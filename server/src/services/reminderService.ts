import { Submission } from '../models/Submission';
import { FollowUpTask } from '../models/FollowUpTask';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { Setting } from '../models/Setting';
import { evaluateCandidateRisk } from './riskEngine';
import { emitEvent } from './socketService';

export interface ReminderConfig {
  firstFollowUpDays: number;
  secondFollowUpDays: number;
  escalationDays: number;
  overdueThresholdDays: number;
}

export const getDefaultReminderConfig = async (): Promise<ReminderConfig> => {
  try {
    const setting = await Setting.findOne({ key: 'followup_intervals' });
    if (setting && setting.value) {
      return {
        firstFollowUpDays: setting.value.firstFollowUpDays ?? 2,
        secondFollowUpDays: setting.value.secondFollowUpDays ?? 4,
        escalationDays: setting.value.escalationDays ?? 6,
        overdueThresholdDays: setting.value.overdueThresholdDays ?? 7,
      };
    }
  } catch (err) {
    console.error('Error reading reminder config:', err);
  }
  return {
    firstFollowUpDays: 2,
    secondFollowUpDays: 4,
    escalationDays: 6,
    overdueThresholdDays: 7,
  };
};

export const runReminderCheck = async (): Promise<{
  checked: number;
  markedFollowUpDue: number;
  escalated: number;
  notificationsSent: number;
}> => {
  const config = await getDefaultReminderConfig();
  const now = new Date();

  // Find all active submissions awaiting feedback
  const activeSubmissions = await Submission.find({
    submissionStatus: {
      $in: ['Submitted', 'Awaiting Feedback', 'Follow-up Due'],
    },
  })
    .populate('candidate')
    .populate('job')
    .populate('client')
    .populate('hiringManager')
    .populate('recruiter');

  let markedFollowUpDue = 0;
  let escalatedCount = 0;
  let notificationsSent = 0;

  // Find an admin user to notify for escalations
  const adminUser = await User.findOne({ role: 'admin' });

  for (const submission of activeSubmissions) {
    const submittedTime = new Date(submission.submissionDate).getTime();
    const daysWaiting = Math.max(
      0,
      Math.floor((now.getTime() - submittedTime) / (1000 * 60 * 60 * 24))
    );
    submission.daysWaiting = daysWaiting;

    const isOverdue = now > new Date(submission.feedbackDueDate);
    submission.isOverdue = isOverdue;

    // Recalculate Candidate Risk
    const candidateData = submission.candidate as any;
    const riskAssessment = evaluateCandidateRisk({
      inFinalStagesElsewhere: candidateData?.inFinalStagesElsewhere,
      competingOffers: candidateData?.competingOffers,
      dissatisfiedWithDelays: candidateData?.dissatisfiedWithDelays,
      isOverdue,
      daysWaiting,
      priority: submission.priority,
      submissionStatus: submission.submissionStatus,
    });

    submission.riskLevel = riskAssessment.level;
    submission.riskReasons = riskAssessment.reasons;

    // Rule: Feedback overdue check
    if (isOverdue && submission.submissionStatus !== 'Follow-up Due') {
      submission.submissionStatus = 'Follow-up Due';
      markedFollowUpDue++;

      // Create Notification for assigned recruiter
      if (submission.recruiter) {
        await Notification.create({
          recipient: submission.recruiter._id,
          type: 'FOLLOWUP_OVERDUE',
          title: 'Feedback Overdue: Follow-up Required',
          message: `Feedback for ${candidateData?.fullName || 'Candidate'} on job ${(submission.job as any)?.jobTitle || 'Job'} is overdue (${daysWaiting} days waiting).`,
          submission: submission._id,
          candidate: candidateData?._id,
          job: (submission.job as any)?._id,
        });
        notificationsSent++;
        emitEvent('notification_new', { recipient: submission.recruiter._id });
      }
    }

    // Rule: Escalation at day 6 or beyond
    if (daysWaiting >= config.escalationDays && !submission.isEscalated) {
      submission.isEscalated = true;
      submission.escalatedAt = now;
      if (adminUser) {
        submission.escalatedTo = adminUser._id;
        await Notification.create({
          recipient: adminUser._id,
          type: 'SUBMISSION_ESCALATED',
          title: 'Submission Escalated to Team Lead',
          message: `Submission ${submission.submissionId} (${candidateData?.fullName} @ ${(submission.client as any)?.companyName}) has exceeded ${daysWaiting} days with no response.`,
          submission: submission._id,
          candidate: candidateData?._id,
          job: (submission.job as any)?._id,
        });
        notificationsSent++;
        escalatedCount++;
      }
    }

    // Critical risk notification
    if (submission.riskLevel === 'Critical') {
      const existingNotif = await Notification.findOne({
        submission: submission._id,
        type: 'CANDIDATE_RISK',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      if (!existingNotif && submission.recruiter) {
        await Notification.create({
          recipient: submission.recruiter._id,
          type: 'CANDIDATE_RISK',
          title: 'CRITICAL: Candidate at Withdrawal Risk',
          message: `${candidateData?.fullName} is in final stages with another employer and response is delayed. Immediate follow-up required!`,
          submission: submission._id,
          candidate: candidateData?._id,
          job: (submission.job as any)?._id,
        });
        notificationsSent++;
      }
    }

    await submission.save();
  }

  emitEvent('reminders_processed', {
    checked: activeSubmissions.length,
    markedFollowUpDue,
    escalatedCount,
  });

  return {
    checked: activeSubmissions.length,
    markedFollowUpDue,
    escalated: escalatedCount,
    notificationsSent,
  };
};
