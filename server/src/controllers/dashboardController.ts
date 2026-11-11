import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Candidate } from '../models/Candidate';
import { Job } from '../models/Job';
import { Client } from '../models/Client';
import { Submission } from '../models/Submission';
import { FollowUpTask } from '../models/FollowUpTask';
import { Feedback } from '../models/Feedback';
import { User } from '../models/User';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const activeJobs = await Job.countDocuments({ jobStatus: 'Open' });
    const totalClients = await Client.countDocuments();
    const totalSubmissions = await Submission.countDocuments();
    
    const awaitingFeedback = await Submission.countDocuments({
      submissionStatus: { $in: ['Submitted', 'Awaiting Feedback', 'Follow-up Due'] },
    });

    const feedbackReceived = await Feedback.countDocuments();

    const overdueFollowUps = await FollowUpTask.countDocuments({
      status: 'Pending',
      dueDate: { $lt: new Date() },
    });

    const interviewsScheduled = await Submission.countDocuments({
      submissionStatus: { $in: ['Interview Requested', 'Interview Scheduled'] },
    });

    const candidatesAtRisk = await Submission.countDocuments({
      riskLevel: { $in: ['High', 'Critical'] },
      submissionStatus: { $nin: ['Withdrawn', 'Rejected', 'Selected', 'Closed'] },
    });

    const successfulPlacements = await Submission.countDocuments({
      submissionStatus: { $in: ['Selected', 'Closed'] },
    });

    res.json({
      success: true,
      data: {
        totalCandidates,
        activeJobs,
        totalClients,
        totalSubmissions,
        awaitingFeedback,
        feedbackReceived,
        overdueFollowUps,
        interviewsScheduled,
        candidatesAtRisk,
        successfulPlacements,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.', error: error.message });
  }
};

export const getDashboardCharts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Pipeline distribution
    const statuses = [
      'Shortlisted',
      'Submitted',
      'Awaiting Feedback',
      'Follow-up Due',
      'Interview Scheduled',
      'Selected',
      'Rejected',
      'Withdrawn',
    ];

    const pipelineData = await Promise.all(
      statuses.map(async (status) => {
        const count = await Submission.countDocuments({ submissionStatus: status });
        return { name: status, value: count };
      })
    );

    // 2. Submission trends (by month / days)
    const submissions = await Submission.find().sort({ submissionDate: 1 });
    const trendMap: Record<string, number> = {};

    submissions.forEach((sub) => {
      const dateKey = new Date(sub.submissionDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
    });

    const trendData = Object.entries(trendMap).map(([date, count]) => ({
      date,
      submissions: count,
    }));

    // 3. Feedback response turnaround time distribution
    const feedbacks = await Feedback.find().populate('submission');
    const turnaroundBuckets = {
      '< 24 hours': 0,
      '1 - 2 days': 0,
      '3 - 4 days': 0,
      '> 4 days (Delayed)': 0,
    };

    feedbacks.forEach((fb: any) => {
      if (fb.submission?.submissionDate && fb.submittedAt) {
        const hours =
          (new Date(fb.submittedAt).getTime() - new Date(fb.submission.submissionDate).getTime()) /
          (1000 * 60 * 60);
        if (hours < 24) turnaroundBuckets['< 24 hours']++;
        else if (hours <= 48) turnaroundBuckets['1 - 2 days']++;
        else if (hours <= 96) turnaroundBuckets['3 - 4 days']++;
        else turnaroundBuckets['> 4 days (Delayed)']++;
      }
    });

    const turnaroundData = Object.entries(turnaroundBuckets).map(([bucket, count]) => ({
      name: bucket,
      count,
    }));

    // 4. Recruiter Performance
    const recruiters = await User.find({ role: { $in: ['recruiter', 'admin'] } });
    const recruiterData = await Promise.all(
      recruiters.map(async (rec) => {
        const subCount = await Submission.countDocuments({ recruiter: rec._id });
        const interviewCount = await Submission.countDocuments({
          recruiter: rec._id,
          submissionStatus: { $in: ['Interview Requested', 'Interview Scheduled'] },
        });
        const placedCount = await Submission.countDocuments({
          recruiter: rec._id,
          submissionStatus: { $in: ['Selected', 'Closed'] },
        });

        return {
          recruiter: rec.name,
          submissions: subCount,
          interviews: interviewCount,
          placements: placedCount,
        };
      })
    );

    // 5. Job-wise Candidate Submissions
    const topJobs = await Job.find({ jobStatus: 'Open' }).limit(5);
    const jobSubmissionsData = await Promise.all(
      topJobs.map(async (job) => {
        const count = await Submission.countDocuments({ job: job._id });
        return {
          job: job.jobTitle.length > 20 ? job.jobTitle.substring(0, 20) + '...' : job.jobTitle,
          submissions: count,
        };
      })
    );

    // 6. Follow-up Statuses
    const pendingFollowups = await FollowUpTask.countDocuments({ status: 'Pending' });
    const completedFollowups = await FollowUpTask.countDocuments({ status: { $in: ['Completed', 'Sent'] } });
    const escalatedFollowups = await FollowUpTask.countDocuments({ status: 'Escalated' });

    res.json({
      success: true,
      data: {
        pipeline: pipelineData,
        trends: trendData.slice(-14),
        turnaround: turnaroundData,
        recruiters: recruiterData,
        jobs: jobSubmissionsData,
        followupStats: [
          { name: 'Pending / Due', value: pendingFollowups },
          { name: 'Sent / Completed', value: completedFollowups },
          { name: 'Escalated', value: escalatedFollowups },
        ],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch charts.', error: error.message });
  }
};

export const getAttentionRequired = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Critical and High risk submissions
    const atRiskSubmissions = await Submission.find({
      riskLevel: { $in: ['Critical', 'High'] },
      submissionStatus: { $nin: ['Selected', 'Rejected', 'Withdrawn', 'Closed'] },
    })
      .populate('candidate', 'fullName email phone skills totalExperience currentCompany inFinalStagesElsewhere competingOffers')
      .populate('job', 'jobId jobTitle')
      .populate('client', 'companyName')
      .populate('hiringManager', 'fullName email phone designation')
      .populate('recruiter', 'name email avatar')
      .sort({ riskLevel: 1, daysWaiting: -1 })
      .limit(6);

    // 2. Overdue submissions awaiting feedback
    const overdueSubmissions = await Submission.find({
      isOverdue: true,
      submissionStatus: { $in: ['Submitted', 'Awaiting Feedback', 'Follow-up Due'] },
    })
      .populate('candidate', 'fullName email skills totalExperience')
      .populate('job', 'jobId jobTitle')
      .populate('client', 'companyName')
      .populate('hiringManager', 'fullName email phone designation')
      .populate('recruiter', 'name email avatar')
      .sort({ feedbackDueDate: 1 })
      .limit(6);

    // 3. Overdue follow-up tasks
    const overdueTasks = await FollowUpTask.find({
      status: 'Pending',
      dueDate: { $lt: new Date() },
    })
      .populate('candidate', 'fullName')
      .populate('job', 'jobTitle')
      .populate('client', 'companyName')
      .populate('hiringManager', 'fullName email')
      .populate('assignedRecruiter', 'name email')
      .populate('submission')
      .sort({ dueDate: 1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        atRiskSubmissions,
        overdueSubmissions,
        overdueTasks,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch attention items.', error: error.message });
  }
};
