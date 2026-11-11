import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Client } from '../models/Client';
import { HiringManager } from '../models/HiringManager';
import { Submission } from '../models/Submission';
import { Job } from '../models/Job';
import { Feedback } from '../models/Feedback';

export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clients = await Client.find()
      .populate('assignedRecruiter', 'name email designation avatar')
      .sort({ companyName: 1 });

    // Augment with hiring managers count and active jobs count
    const enrichedClients = await Promise.all(
      clients.map(async (client) => {
        const hmCount = await HiringManager.countDocuments({ client: client._id });
        const jobCount = await Job.countDocuments({ client: client._id, jobStatus: 'Open' });
        const submissionCount = await Submission.countDocuments({ client: client._id });
        const pendingCount = await Submission.countDocuments({
          client: client._id,
          submissionStatus: { $in: ['Submitted', 'Awaiting Feedback', 'Follow-up Due'] },
        });

        return {
          ...client.toObject(),
          hiringManagersCount: hmCount,
          activeJobsCount: jobCount,
          totalSubmissionsCount: submissionCount,
          pendingFeedbackCount: pendingCount,
        };
      })
    );

    res.json({ success: true, count: enrichedClients.length, data: enrichedClients });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch clients.', error: error.message });
  }
};

export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await Client.findById(req.params.id)
      .populate('assignedRecruiter', 'name email designation avatar');

    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found.' });
      return;
    }

    const hiringManagers = await HiringManager.find({ client: client._id })
      .populate('assignedJobs', 'jobId jobTitle jobStatus');

    const jobs = await Job.find({ client: client._id }).sort({ createdAt: -1 });

    const submissions = await Submission.find({ client: client._id })
      .populate('candidate', 'fullName email skills totalExperience')
      .populate('job', 'jobId jobTitle')
      .populate('hiringManager', 'fullName email designation')
      .populate('recruiter', 'name email')
      .sort({ submissionDate: -1 });

    // Calculate average feedback turnaround time in days
    const feedbackList = await Feedback.find({
      submission: { $in: submissions.map((s) => s._id) },
    }).populate('submission', 'submissionDate');

    let totalTurnaroundDays = 0;
    let completedCount = 0;
    feedbackList.forEach((fb: any) => {
      if (fb.submission && fb.submission.submissionDate && fb.submittedAt) {
        const days = (new Date(fb.submittedAt).getTime() - new Date(fb.submission.submissionDate).getTime()) / (1000 * 60 * 60 * 24);
        totalTurnaroundDays += Math.max(0, days);
        completedCount++;
      }
    });

    const averageTurnaroundDays = completedCount > 0 ? Number((totalTurnaroundDays / completedCount).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        client,
        hiringManagers,
        jobs,
        submissions,
        stats: {
          totalSubmissions: submissions.length,
          pendingFeedback: submissions.filter((s) =>
            ['Submitted', 'Awaiting Feedback', 'Follow-up Due'].includes(s.submissionStatus)
          ).length,
          averageTurnaroundDays,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch client details.', error: error.message });
  }
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await Client.create({
      ...req.body,
      assignedRecruiter: req.body.assignedRecruiter || req.user?._id,
    });
    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create client.', error: error.message });
  }
};

export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!client) {
      res.status(404).json({ success: false, message: 'Client not found.' });
      return;
    }
    res.json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update client.', error: error.message });
  }
};

export const addHiringManager = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const hiringManager = await HiringManager.create({
      ...req.body,
      client: req.params.clientId || req.body.client,
    });
    res.status(201).json({ success: true, data: hiringManager });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to add hiring manager.', error: error.message });
  }
};

export const getHiringManagers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = {};
    if (req.query.client) query.client = req.query.client;

    const managers = await HiringManager.find(query)
      .populate('client', 'companyName industry')
      .populate('assignedJobs', 'jobId jobTitle')
      .sort({ fullName: 1 });

    res.json({ success: true, data: managers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch hiring managers.', error: error.message });
  }
};
