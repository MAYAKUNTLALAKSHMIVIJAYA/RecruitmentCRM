import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { FollowUpTask } from '../models/FollowUpTask';
import { Submission } from '../models/Submission';
import { Candidate } from '../models/Candidate';
import { Job } from '../models/Job';
import { Client } from '../models/Client';
import { HiringManager } from '../models/HiringManager';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { sendEmail, EMAIL_TEMPLATES, replacePlaceholders } from '../services/emailService';
import { runReminderCheck } from '../services/reminderService';
import { config } from '../config/config';
import { emitEvent } from '../services/socketService';

export const getFollowUps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, recruiter, isOverdue } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (recruiter) query.assignedRecruiter = recruiter;

    let tasks = await FollowUpTask.find(query)
      .populate('candidate', 'fullName email skills totalExperience competingOffers inFinalStagesElsewhere')
      .populate('job', 'jobId jobTitle')
      .populate('client', 'companyName industry')
      .populate('hiringManager', 'fullName email phone designation')
      .populate('assignedRecruiter', 'name email designation avatar')
      .populate('submission')
      .sort({ dueDate: 1 });

    const now = new Date();
    if (isOverdue === 'true') {
      tasks = tasks.filter((t) => t.status === 'Pending' && new Date(t.dueDate) < now);
    }

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch follow-ups.', error: error.message });
  }
};

export const createFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await FollowUpTask.create({
      ...req.body,
      assignedRecruiter: req.body.assignedRecruiter || req.user?._id,
      history: [
        {
          action: 'Follow-up Created',
          performedBy: req.user?._id,
          timestamp: new Date(),
          notes: req.body.notes || 'Manual follow-up task created',
        },
      ],
    });

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create follow-up task.', error: error.message });
  }
};

export const sendFollowUpEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await FollowUpTask.findById(req.params.id)
      .populate('submission')
      .populate('candidate')
      .populate('job')
      .populate('client')
      .populate('hiringManager')
      .populate('assignedRecruiter');

    if (!task) {
      res.status(404).json({ success: false, message: 'Follow-up task not found.' });
      return;
    }

    const submission = task.submission as any;
    const candidate = task.candidate as any;
    const job = task.job as any;
    const client = task.client as any;
    const hiringManager = task.hiringManager as any;

    if (!submission || !hiringManager) {
      res.status(400).json({ success: false, message: 'Submission or hiring manager record missing.' });
      return;
    }

    const reviewUrl = `${config.clientUrl}/portal/review/${submission.reviewToken}`;
    const step = task.stepNumber >= 2 ? 2 : 1;
    const templateKey = step === 1 ? 'First Follow-up' : 'Second Follow-up';
    const template = EMAIL_TEMPLATES[templateKey];

    const submissionDateFormatted = new Date(submission.submissionDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const subject = replacePlaceholders(template.subject, {
      'Candidate Name': candidate.fullName,
      'Job Title': job.jobTitle,
    });

    const bodyText = replacePlaceholders(template.body, {
      'Hiring Manager': hiringManager.fullName,
      'Candidate Name': candidate.fullName,
      'Job Title': job.jobTitle,
      'Submission Date': submissionDateFormatted,
      'Recruiter Name': req.user?.name || 'Recruiter',
      'Review Link': reviewUrl,
    });

    // Send Simulated Follow-up Email
    await sendEmail({
      submissionId: submission._id,
      candidateId: candidate._id,
      jobId: job._id,
      clientId: client._id,
      hiringManagerId: hiringManager._id,
      senderId: req.user?._id as any,
      recipientEmail: hiringManager.email,
      recipientName: hiringManager.fullName,
      templateType: templateKey,
      subject,
      bodyText,
      followUpNumber: step,
      reviewUrl,
    });

    const now = new Date();
    task.status = 'Sent';
    task.lastSentDate = now;
    task.history.push({
      action: `${templateKey} Sent`,
      performedBy: req.user?._id,
      timestamp: now,
      notes: `Sent via email to ${hiringManager.fullName} (${hiringManager.email})`,
    });
    await task.save();

    // Update Submission
    submission.lastFollowUpDate = now;
    submission.nextFollowUpDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    await submission.save();

    // Create next follow-up task if this was step 1
    if (step === 1) {
      await FollowUpTask.create({
        submission: submission._id,
        candidate: candidate._id,
        job: job._id,
        client: client._id,
        hiringManager: hiringManager._id,
        assignedRecruiter: req.user?._id,
        stepNumber: 2,
        title: `2nd Follow-up: Urgent Client Feedback on ${candidate.fullName}`,
        dueDate: submission.nextFollowUpDate,
        status: 'Pending',
        history: [
          {
            action: 'Follow-up Scheduled',
            performedBy: req.user?._id,
            timestamp: now,
            notes: 'Automated 2nd follow-up task queued following 1st reminder',
          },
        ],
      });
    }

    emitEvent('followup_sent', {
      taskId: task._id,
      submissionId: submission._id,
      candidateName: candidate.fullName,
    });

    res.json({
      success: true,
      message: `${templateKey} successfully sent to ${hiringManager.fullName} (Simulated).`,
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to send follow-up.', error: error.message });
  }
};

export const snoozeFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { days = 2, reason = 'Waiting on client request' } = req.body;
    const task = await FollowUpTask.findById(req.params.id);

    if (!task) {
      res.status(404).json({ success: false, message: 'Follow-up task not found.' });
      return;
    }

    const now = new Date();
    const snoozedUntil = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);

    task.status = 'Snoozed';
    task.snoozedUntil = snoozedUntil;
    task.dueDate = snoozedUntil;
    task.history.push({
      action: `Snoozed for ${days} days`,
      performedBy: req.user?._id,
      timestamp: now,
      notes: reason,
    });

    await task.save();

    res.json({
      success: true,
      message: `Follow-up snoozed until ${snoozedUntil.toLocaleDateString()}.`,
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to snooze follow-up.', error: error.message });
  }
};

export const escalateFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notes } = req.body;
    const task = await FollowUpTask.findById(req.params.id)
      .populate('submission')
      .populate('candidate')
      .populate('job')
      .populate('client')
      .populate('hiringManager');

    if (!task) {
      res.status(404).json({ success: false, message: 'Follow-up task not found.' });
      return;
    }

    const submission = task.submission as any;
    const candidate = task.candidate as any;
    const job = task.job as any;
    const client = task.client as any;
    const hiringManager = task.hiringManager as any;

    const adminUser = await User.findOne({ role: 'admin' });

    task.status = 'Escalated';
    task.escalationNotes = notes || 'Manually escalated by recruiter due to zero client response';
    task.history.push({
      action: 'Escalated to Leadership',
      performedBy: req.user?._id,
      timestamp: new Date(),
      notes: task.escalationNotes,
    });
    await task.save();

    if (submission) {
      submission.isEscalated = true;
      submission.escalatedAt = new Date();
      if (adminUser) submission.escalatedTo = adminUser._id;
      await submission.save();

      // Send simulated escalation email to team lead
      const emailBody = replacePlaceholders(EMAIL_TEMPLATES.Escalation.body, {
        'Team Lead': adminUser?.name || 'Recruitment Director',
        'Candidate Name': candidate.fullName,
        Client: client.companyName,
        'Job Title': job.jobTitle,
        'Hiring Manager': hiringManager.fullName,
        'Days Waiting': submission.daysWaiting,
        'Recruiter Name': req.user?.name || 'Recruiter',
      });

      await sendEmail({
        submissionId: submission._id,
        candidateId: candidate._id,
        jobId: job._id,
        clientId: client._id,
        hiringManagerId: hiringManager._id,
        senderId: req.user?._id as any,
        recipientEmail: adminUser?.email || 'admin@recruitflow.com',
        recipientName: adminUser?.name || 'Team Lead',
        templateType: 'Escalation',
        subject: `Urgent Escalation: Pending Candidate Feedback – ${candidate.fullName}`,
        bodyText: emailBody,
      });

      if (adminUser) {
        await Notification.create({
          recipient: adminUser._id,
          type: 'SUBMISSION_ESCALATED',
          title: `ESCALATION: ${candidate.fullName} @ ${client.companyName}`,
          message: `${req.user?.name} escalated submission for ${candidate.fullName} (${submission.daysWaiting} days pending).`,
          submission: submission._id,
          candidate: candidate._id,
          job: job._id,
        });
      }
    }

    res.json({
      success: true,
      message: 'Submission and follow-up escalated to team leadership successfully.',
      data: task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to escalate follow-up.', error: error.message });
  }
};

export const completeFollowUp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await FollowUpTask.findById(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Follow-up task not found.' });
      return;
    }

    task.status = 'Completed';
    task.history.push({
      action: 'Marked Completed',
      performedBy: req.user?._id,
      timestamp: new Date(),
      notes: req.body.notes || 'Resolved directly by recruiter',
    });
    await task.save();

    res.json({ success: true, message: 'Follow-up marked as completed.', data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to complete follow-up.', error: error.message });
  }
};

export const triggerReminderScan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const results = await runReminderCheck();
    res.json({
      success: true,
      message: 'Follow-up and risk automation scan completed successfully.',
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Scan failed.', error: error.message });
  }
};
