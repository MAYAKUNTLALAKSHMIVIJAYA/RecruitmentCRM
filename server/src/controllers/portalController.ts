import { Request, Response } from 'express';
import { Submission } from '../models/Submission';
import { Feedback, FeedbackDecision } from '../models/Feedback';
import { FollowUpTask } from '../models/FollowUpTask';
import { Notification } from '../models/Notification';
import { ActivityLog } from '../models/ActivityLog';
import { emitEvent } from '../services/socketService';

export const getPortalSubmissionByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const submission = await Submission.findOne({ reviewToken: token })
      .populate('candidate', 'fullName email phone location skills totalExperience currentCompany currentDesignation expectedSalary noticePeriod resumeUrl linkedinProfile')
      .populate('job', 'jobId jobTitle department requiredSkills experienceRequired salaryRange jobLocation employmentType jobDescription')
      .populate('client', 'companyName industry location')
      .populate('hiringManager', 'fullName email designation')
      .populate('recruiter', 'name email designation phone avatar')
      .populate('hiringManagerFeedback');

    if (!submission) {
      res.status(404).json({
        success: false,
        message: 'Invalid or expired review link. Please contact your recruitment partner.',
      });
      return;
    }

    if (new Date() > new Date(submission.reviewTokenExpiresAt)) {
      res.status(410).json({
        success: false,
        message: 'This review link has expired. Please request an updated review link.',
      });
      return;
    }

    res.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error loading portal submission.', error: error.message });
  }
};

export const submitPortalFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { decision, comments, interviewAvailability, additionalRequirements } = req.body;

    if (!decision || !comments) {
      res.status(400).json({
        success: false,
        message: 'Decision and comments are required to submit feedback.',
      });
      return;
    }

    const submission = await Submission.findOne({ reviewToken: token })
      .populate('candidate')
      .populate('job')
      .populate('client')
      .populate('hiringManager')
      .populate('recruiter');

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found or invalid token.' });
      return;
    }

    // Check if feedback was already submitted
    if (submission.hiringManagerFeedback) {
      res.status(400).json({
        success: false,
        message: 'Feedback has already been recorded for this submission.',
      });
      return;
    }

    const candidate = submission.candidate as any;
    const job = submission.job as any;
    const hiringManager = submission.hiringManager as any;
    const recruiter = submission.recruiter as any;

    // Create Feedback record
    const feedback = await Feedback.create({
      submission: submission._id,
      candidate: candidate._id,
      job: job._id,
      hiringManager: hiringManager._id,
      decision,
      comments,
      interviewAvailability,
      additionalRequirements,
      submittedAt: new Date(),
      ipAddress: req.ip,
    });

    // Map decision to submission status
    let newSubmissionStatus: any = 'Feedback Received';
    if (decision === 'Accept') newSubmissionStatus = 'Selected';
    else if (decision === 'Reject') newSubmissionStatus = 'Rejected';
    else if (decision === 'Request Interview') newSubmissionStatus = 'Interview Requested';
    else if (decision === 'Keep Under Review') newSubmissionStatus = 'Feedback Received';
    else if (decision === 'Request More Information') newSubmissionStatus = 'Awaiting Feedback';

    submission.hiringManagerFeedback = feedback._id as any;
    submission.submissionStatus = newSubmissionStatus;
    submission.isOverdue = false; // feedback received, so no longer overdue
    await submission.save();

    // Mark pending follow-up tasks as completed
    await FollowUpTask.updateMany(
      { submission: submission._id, status: 'Pending' },
      {
        status: 'Completed',
        $push: {
          history: {
            action: 'Task Auto-Completed',
            timestamp: new Date(),
            notes: `Hiring manager submitted feedback (${decision}). Follow-up closed.`,
          },
        },
      }
    );

    // Create ActivityLog entry
    await ActivityLog.create({
      submission: submission._id,
      candidate: candidate._id,
      job: job._id,
      performedBy: recruiter?._id || hiringManager._id,
      action: `Hiring Manager Feedback: ${decision}`,
      details: `${hiringManager.fullName} submitted decision "${decision}". Comments: "${comments}"`,
      meta: {
        decision,
        interviewAvailability,
      },
    });

    // Notify Recruiter
    if (recruiter) {
      await Notification.create({
        recipient: recruiter._id,
        type: decision === 'Request Interview' ? 'INTERVIEW_REQUESTED' : 'FEEDBACK_RECEIVED',
        title: `Feedback Received: ${candidate.fullName}`,
        message: `${hiringManager.fullName} submitted feedback for ${candidate.fullName} on ${job.jobTitle}: "${decision}"`,
        submission: submission._id,
        candidate: candidate._id,
        job: job._id,
      });

      emitEvent('notification_new', { recipient: recruiter._id });
    }

    emitEvent('feedback_submitted', {
      submissionId: submission._id,
      decision,
      candidateName: candidate.fullName,
      jobTitle: job.jobTitle,
      hiringManagerName: hiringManager.fullName,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully. The recruitment team has been alerted.',
      data: feedback,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to record feedback.', error: error.message });
  }
};
