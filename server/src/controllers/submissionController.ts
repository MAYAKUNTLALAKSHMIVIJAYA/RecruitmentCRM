import { Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { Submission, ISubmission } from '../models/Submission';
import { Candidate } from '../models/Candidate';
import { Job } from '../models/Job';
import { Client } from '../models/Client';
import { HiringManager } from '../models/HiringManager';
import { FollowUpTask } from '../models/FollowUpTask';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { sendEmail, EMAIL_TEMPLATES, replacePlaceholders } from '../services/emailService';
import { evaluateCandidateRisk } from '../services/riskEngine';
import { config } from '../config/config';
import { emitEvent } from '../services/socketService';

export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      status,
      priority,
      client,
      recruiter,
      hiringManager,
      riskLevel,
      isOverdue,
      search,
      candidateId,
      jobId,
    } = req.query;

    const query: any = {};

    if (status) query.submissionStatus = status;
    if (priority) query.priority = priority;
    if (client) query.client = client;
    if (recruiter) query.recruiter = recruiter;
    if (hiringManager) query.hiringManager = hiringManager;
    if (riskLevel) query.riskLevel = riskLevel;
    if (candidateId) query.candidate = candidateId;
    if (jobId) query.job = jobId;
    if (isOverdue === 'true') query.isOverdue = true;

    let submissions = await Submission.find(query)
      .populate('candidate', 'candidateId fullName email phone skills totalExperience currentCompany currentDesignation noticePeriod expectedSalary resumeUrl competingOffers inFinalStagesElsewhere dissatisfiedWithDelays')
      .populate('job', 'jobId jobTitle department jobLocation salaryRange priority')
      .populate('client', 'companyName industry location')
      .populate('hiringManager', 'fullName email designation phone')
      .populate('recruiter', 'name email designation avatar')
      .populate('hiringManagerFeedback')
      .sort({ submissionDate: -1 });

    // Client-side text search across candidate name, job title, client company
    if (search) {
      const term = String(search).toLowerCase();
      submissions = submissions.filter((sub: any) => {
        const canName = sub.candidate?.fullName?.toLowerCase() || '';
        const jobTitle = sub.job?.jobTitle?.toLowerCase() || '';
        const clientName = sub.client?.companyName?.toLowerCase() || '';
        const subId = sub.submissionId?.toLowerCase() || '';
        return (
          canName.includes(term) ||
          jobTitle.includes(term) ||
          clientName.includes(term) ||
          subId.includes(term)
        );
      });
    }

    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch submissions.', error: error.message });
  }
};

export const getSubmissionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('candidate')
      .populate('job')
      .populate('client')
      .populate('hiringManager')
      .populate('recruiter', 'name email designation phone avatar')
      .populate('hiringManagerFeedback')
      .populate('escalatedTo', 'name email designation');

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found.' });
      return;
    }

    const followUpTasks = await FollowUpTask.find({ submission: submission._id })
      .populate('assignedRecruiter', 'name email avatar')
      .sort({ dueDate: 1 });

    const timeline = await ActivityLog.find({ submission: submission._id })
      .populate('performedBy', 'name email designation avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        submission,
        followUpTasks,
        timeline,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch submission details.', error: error.message });
  }
};

export const createSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      candidateId,
      jobId,
      submissionMethod = 'Email',
      submissionNotes = '',
      priority = 'Medium',
      customSubject,
      feedbackDueDays = 2,
    } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }

    const job = await Job.findById(jobId).populate('client').populate('hiringManager');
    if (!job) {
      res.status(404).json({ success: false, message: 'Job requirement not found.' });
      return;
    }

    const client = job.client as any;
    const hiringManager = job.hiringManager as any;

    // Check if candidate is already submitted for this specific job
    const existingSubmission = await Submission.findOne({
      candidate: candidate._id,
      job: job._id,
      submissionStatus: { $nin: ['Withdrawn', 'Rejected', 'Closed'] },
    });

    if (existingSubmission) {
      res.status(400).json({
        success: false,
        message: `Candidate ${candidate.fullName} is already actively submitted to ${job.jobTitle} (Status: ${existingSubmission.submissionStatus}).`,
      });
      return;
    }

    // Generate unique Submission ID
    const count = await Submission.countDocuments();
    const submissionId = `SUB-${String(count + 501).padStart(5, '0')}`;

    // Generate secure expiring review token
    const reviewToken = crypto.randomBytes(24).toString('hex');
    const reviewTokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // Feedback due date
    const submissionDate = new Date();
    const feedbackDueDate = new Date(
      submissionDate.getTime() + Number(feedbackDueDays) * 24 * 60 * 60 * 1000
    );

    const emailSubject =
      customSubject || `Candidate Submission – ${candidate.fullName} – ${job.jobTitle}`;

    // Risk calculation
    const riskAssessment = evaluateCandidateRisk({
      inFinalStagesElsewhere: candidate.inFinalStagesElsewhere,
      competingOffers: candidate.competingOffers,
      dissatisfiedWithDelays: candidate.dissatisfiedWithDelays,
      isOverdue: false,
      daysWaiting: 0,
      priority,
      submissionStatus: 'Submitted',
    });

    const submission = await Submission.create({
      submissionId,
      candidate: candidate._id,
      job: job._id,
      client: client._id,
      hiringManager: hiringManager._id,
      recruiter: req.user?._id,
      submissionDate,
      submissionMethod,
      emailSubject,
      submissionNotes,
      resumeAttachment: candidate.resumeUrl,
      priority,
      feedbackDueDate,
      submissionStatus: 'Submitted',
      reviewToken,
      reviewTokenExpiresAt,
      riskLevel: riskAssessment.level,
      riskReasons: riskAssessment.reasons,
      daysWaiting: 0,
      isOverdue: false,
    });

    // Create Initial Follow-up Task (Step 1)
    await FollowUpTask.create({
      submission: submission._id,
      candidate: candidate._id,
      job: job._id,
      client: client._id,
      hiringManager: hiringManager._id,
      assignedRecruiter: req.user?._id,
      stepNumber: 1,
      title: `1st Follow-up: Hiring Manager Feedback on ${candidate.fullName}`,
      dueDate: feedbackDueDate,
      status: 'Pending',
      history: [
        {
          action: 'Follow-up Scheduled',
          performedBy: req.user?._id,
          timestamp: new Date(),
          notes: `Automated follow-up created upon candidate submission. Due on ${feedbackDueDate.toLocaleDateString()}`,
        },
      ],
    });

    // Construct Review URL
    const reviewUrl = `${config.clientUrl}/portal/review/${reviewToken}`;

    // Prepare email body using Template 1
    const emailBody = replacePlaceholders(EMAIL_TEMPLATES.Submission.body, {
      'Hiring Manager': hiringManager.fullName,
      'Candidate Name': candidate.fullName,
      'Job Title': job.jobTitle,
      Experience: `${candidate.totalExperience} years`,
      Skills: candidate.skills.join(', '),
      'Current Company': candidate.currentCompany || 'Confidential',
      'Notice Period': candidate.noticePeriod,
      'Recruiter Name': req.user?.name || 'Recruiter',
      'Review Link': reviewUrl,
    });

    // Send Simulated Submission Email
    await sendEmail({
      submissionId: submission._id,
      candidateId: candidate._id,
      jobId: job._id,
      clientId: client._id,
      hiringManagerId: hiringManager._id,
      senderId: req.user?._id as any,
      recipientEmail: hiringManager.email,
      recipientName: hiringManager.fullName,
      templateType: 'Submission',
      subject: emailSubject,
      bodyText: emailBody,
      reviewUrl,
    });

    // Create Activity Log
    await ActivityLog.create({
      submission: submission._id,
      candidate: candidate._id,
      job: job._id,
      performedBy: req.user?._id,
      action: 'Candidate Submitted to Client',
      details: `Candidate submitted to ${hiringManager.fullName} (${client.companyName}) via Email with feedback due on ${feedbackDueDate.toLocaleDateString()}.`,
    });

    // Update Candidate overall status if New/Screened
    if (['New', 'Contacted', 'Screened', 'Shortlisted'].includes(candidate.status)) {
      candidate.status = 'Submitted';
      await candidate.save();
    }

    emitEvent('submission_created', {
      submissionId: submission._id,
      candidateName: candidate.fullName,
      jobTitle: job.jobTitle,
      clientName: client.companyName,
    });

    res.status(201).json({
      success: true,
      message: 'Candidate submitted successfully. Review link and follow-up task generated.',
      data: submission,
      reviewUrl,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create submission.', error: error.message });
  }
};

export const updateSubmissionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, notes } = req.body;
    const submission = await Submission.findById(req.params.id)
      .populate('candidate')
      .populate('job');

    if (!submission) {
      res.status(404).json({ success: false, message: 'Submission not found.' });
      return;
    }

    const prevStatus = submission.submissionStatus;
    submission.submissionStatus = status;

    if (status === 'Feedback Received' || status === 'Selected' || status === 'Rejected') {
      // Complete or cancel pending follow-up tasks
      await FollowUpTask.updateMany(
        { submission: submission._id, status: 'Pending' },
        { status: status === 'Feedback Received' ? 'Completed' : 'Cancelled' }
      );
    }

    await submission.save();

    if (req.user) {
      await ActivityLog.create({
        submission: submission._id,
        candidate: (submission.candidate as any)?._id,
        job: (submission.job as any)?._id,
        performedBy: req.user._id,
        action: 'Status Changed',
        details: `Submission status manually updated from "${prevStatus}" to "${status}". ${notes ? `Note: ${notes}` : ''}`,
      });
    }

    emitEvent('submission_updated', {
      submissionId: submission._id,
      status,
      prevStatus,
    });

    res.json({ success: true, data: submission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update submission status.', error: error.message });
  }
};

export const getSubmissionTimeline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const activities = await ActivityLog.find({ submission: req.params.id })
      .populate('performedBy', 'name email designation avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: activities });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch timeline.', error: error.message });
  }
};
