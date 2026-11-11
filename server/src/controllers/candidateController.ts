import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Candidate, ICandidate } from '../models/Candidate';
import { Submission } from '../models/Submission';
import { ActivityLog } from '../models/ActivityLog';

export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, priority, recruiter, skill, experienceMin, experienceMax } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { currentCompany: { $regex: search, $options: 'i' } },
        { candidateId: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (recruiter) query.recruiterOwner = recruiter;
    if (skill) {
      query.skills = { $regex: skill, $options: 'i' };
    }
    if (experienceMin || experienceMax) {
      query.totalExperience = {};
      if (experienceMin) query.totalExperience.$gte = Number(experienceMin);
      if (experienceMax) query.totalExperience.$lte = Number(experienceMax);
    }

    const candidates = await Candidate.find(query)
      .populate('recruiterOwner', 'name email designation avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: candidates.length, data: candidates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidates.', error: error.message });
  }
};

export const getCandidateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('recruiterOwner', 'name email designation phone avatar');

    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }

    // Fetch all submissions for this candidate across all jobs
    const submissions = await Submission.find({ candidate: candidate._id })
      .populate('job', 'jobId jobTitle department salaryRange jobLocation')
      .populate('client', 'companyName industry location')
      .populate('hiringManager', 'fullName email designation phone')
      .populate('recruiter', 'name email')
      .populate('hiringManagerFeedback')
      .sort({ submissionDate: -1 });

    const activities = await ActivityLog.find({ candidate: candidate._id })
      .populate('performedBy', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      data: {
        candidate,
        submissions,
        activities,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch candidate details.', error: error.message });
  }
};

export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Candidate.countDocuments();
    const candidateId = `CAN-${String(count + 101).padStart(4, '0')}`;

    const candidateData = {
      ...req.body,
      candidateId,
      recruiterOwner: req.body.recruiterOwner || req.user?._id,
      skills: Array.isArray(req.body.skills)
        ? req.body.skills
        : (req.body.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    };

    const candidate = await Candidate.create(candidateData);

    if (req.user) {
      await ActivityLog.create({
        candidate: candidate._id,
        performedBy: req.user._id,
        action: 'Candidate Created',
        details: `Candidate ${candidate.fullName} was added to the CRM database.`,
      });
    }

    res.status(201).json({ success: true, data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create candidate.', error: error.message });
  }
};

export const updateCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updateData = { ...req.body };
    if (typeof updateData.skills === 'string') {
      updateData.skills = updateData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }

    if (req.user) {
      await ActivityLog.create({
        candidate: candidate._id,
        performedBy: req.user._id,
        action: 'Candidate Updated',
        details: `Profile updated for candidate ${candidate.fullName}.`,
      });
    }

    res.json({ success: true, data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update candidate.', error: error.message });
  }
};

export const deleteCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }

    // Check if candidate has active submissions
    const activeSubmissions = await Submission.countDocuments({
      candidate: candidate._id,
      submissionStatus: { $in: ['Submitted', 'Awaiting Feedback', 'Interview Requested', 'Interview Scheduled'] },
    });

    if (activeSubmissions > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete candidate with ${activeSubmissions} active job submissions. Close or withdraw submissions first.`,
      });
      return;
    }

    await Candidate.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Candidate deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete candidate.', error: error.message });
  }
};

export const addCandidateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { note } = req.body;
    if (!note) {
      res.status(400).json({ success: false, message: 'Note text is required.' });
      return;
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: 'Candidate not found.' });
      return;
    }

    const formattedNote = `[${new Date().toLocaleDateString()}] ${req.user?.name || 'Recruiter'}: ${note}`;
    candidate.notes.unshift(formattedNote);
    await candidate.save();

    if (req.user) {
      await ActivityLog.create({
        candidate: candidate._id,
        performedBy: req.user._id,
        action: 'Note Added',
        details: `Note added to ${candidate.fullName}: "${note.substring(0, 80)}..."`,
      });
    }

    res.json({ success: true, data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to add note.', error: error.message });
  }
};
