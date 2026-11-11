import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Job } from '../models/Job';
import { Submission } from '../models/Submission';
import { ActivityLog } from '../models/ActivityLog';

export const getJobs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, client, recruiter, search } = req.query;
    const query: any = {};

    if (status) query.jobStatus = status;
    if (priority) query.priority = priority;
    if (client) query.client = client;
    if (recruiter) query.assignedRecruiter = recruiter;
    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { jobId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(query)
      .populate('client', 'companyName industry location')
      .populate('hiringManager', 'fullName email designation phone')
      .populate('assignedRecruiter', 'name email designation avatar')
      .sort({ createdAt: -1 });

    // Augment with submissions statistics per job
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const totalSubmissions = await Submission.countDocuments({ job: job._id });
        const pendingFeedback = await Submission.countDocuments({
          job: job._id,
          submissionStatus: { $in: ['Submitted', 'Awaiting Feedback', 'Follow-up Due'] },
        });
        const interviews = await Submission.countDocuments({
          job: job._id,
          submissionStatus: { $in: ['Interview Requested', 'Interview Scheduled'] },
        });
        const selected = await Submission.countDocuments({
          job: job._id,
          submissionStatus: { $in: ['Selected', 'Closed'] },
        });

        const conversionRate =
          totalSubmissions > 0 ? Math.round((selected / totalSubmissions) * 100) : 0;

        return {
          ...job.toObject(),
          totalSubmissions,
          pendingFeedback,
          interviews,
          selected,
          conversionRate,
        };
      })
    );

    res.json({ success: true, count: enrichedJobs.length, data: enrichedJobs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch jobs.', error: error.message });
  }
};

export const getJobById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'companyName industry website location primaryContact contactEmail contactPhone')
      .populate('hiringManager', 'fullName email designation phone')
      .populate('assignedRecruiter', 'name email designation phone avatar');

    if (!job) {
      res.status(404).json({ success: false, message: 'Job requirement not found.' });
      return;
    }

    const submissions = await Submission.find({ job: job._id })
      .populate('candidate', 'fullName email phone skills totalExperience currentCompany currentDesignation expectedSalary noticePeriod resumeUrl competingOffers inFinalStagesElsewhere')
      .populate('recruiter', 'name email avatar')
      .populate('hiringManagerFeedback')
      .sort({ submissionDate: -1 });

    const totalSubmissions = submissions.length;
    const interviews = submissions.filter((s) =>
      ['Interview Requested', 'Interview Scheduled'].includes(s.submissionStatus)
    ).length;
    const selections = submissions.filter((s) => ['Selected', 'Closed'].includes(s.submissionStatus)).length;
    const pendingFeedback = submissions.filter((s) =>
      ['Submitted', 'Awaiting Feedback', 'Follow-up Due'].includes(s.submissionStatus)
    ).length;

    res.json({
      success: true,
      data: {
        job,
        submissions,
        metrics: {
          totalSubmissions,
          interviews,
          selections,
          pendingFeedback,
          conversionRate: totalSubmissions > 0 ? Math.round((selections / totalSubmissions) * 100) : 0,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch job details.', error: error.message });
  }
};

export const createJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Job.countDocuments();
    const jobId = `REQ-${String(count + 201).padStart(4, '0')}`;

    const job = await Job.create({
      ...req.body,
      jobId,
      assignedRecruiter: req.body.assignedRecruiter || req.user?._id,
      requiredSkills: Array.isArray(req.body.requiredSkills)
        ? req.body.requiredSkills
        : (req.body.requiredSkills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    });

    if (req.user) {
      await ActivityLog.create({
        job: job._id,
        performedBy: req.user._id,
        action: 'Job Requirement Created',
        details: `New requirement "${job.jobTitle}" created for client.`,
      });
    }

    res.status(201).json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create job requirement.', error: error.message });
  }
};

export const updateJob = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updateData = { ...req.body };
    if (typeof updateData.requiredSkills === 'string') {
      updateData.requiredSkills = updateData.requiredSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const job = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      res.status(404).json({ success: false, message: 'Job requirement not found.' });
      return;
    }

    res.json({ success: true, data: job });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update job requirement.', error: error.message });
  }
};
