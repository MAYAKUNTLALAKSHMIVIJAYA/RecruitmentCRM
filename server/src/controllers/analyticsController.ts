import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Submission } from '../models/Submission';
import { Feedback } from '../models/Feedback';
import { FollowUpTask } from '../models/FollowUpTask';
import { Client } from '../models/Client';
import { User } from '../models/User';

export const getReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { range = '30d' } = req.query;

    const now = new Date();
    let startDate = new Date();
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else startDate = new Date(0); // All time

    const submissionFilter: any = { submissionDate: { $gte: startDate } };

    const totalSubmissions = await Submission.countDocuments(submissionFilter);
    const feedbackCount = await Feedback.countDocuments({ submittedAt: { $gte: startDate } });
    const responsePercentage =
      totalSubmissions > 0 ? Math.round((feedbackCount / totalSubmissions) * 100) : 0;

    const overdueCount = await Submission.countDocuments({
      ...submissionFilter,
      isOverdue: true,
    });
    const overduePercentage =
      totalSubmissions > 0 ? Math.round((overdueCount / totalSubmissions) * 100) : 0;

    const followUpsCompleted = await FollowUpTask.countDocuments({
      status: { $in: ['Completed', 'Sent'] },
      updatedAt: { $gte: startDate },
    });

    const withdrawnDueToDelays = await Submission.countDocuments({
      ...submissionFilter,
      submissionStatus: 'Withdrawn',
      riskReasons: { $in: [/waiting/i, /delay/i, /expired/i] },
    });

    const interviewCount = await Submission.countDocuments({
      ...submissionFilter,
      submissionStatus: { $in: ['Interview Requested', 'Interview Scheduled', 'Selected', 'Closed'] },
    });

    const candidateToInterviewConv =
      totalSubmissions > 0 ? Math.round((interviewCount / totalSubmissions) * 100) : 0;

    const placementCount = await Submission.countDocuments({
      ...submissionFilter,
      submissionStatus: { $in: ['Selected', 'Closed'] },
    });

    const interviewToPlacementConv =
      interviewCount > 0 ? Math.round((placementCount / interviewCount) * 100) : 0;

    // Average Turnaround Time
    const feedbacks = await Feedback.find({ submittedAt: { $gte: startDate } }).populate('submission');
    let totalDays = 0;
    let validFeedbacks = 0;
    feedbacks.forEach((fb: any) => {
      if (fb.submission?.submissionDate && fb.submittedAt) {
        const diffDays =
          (new Date(fb.submittedAt).getTime() - new Date(fb.submission.submissionDate).getTime()) /
          (1000 * 60 * 60 * 24);
        totalDays += Math.max(0, diffDays);
        validFeedbacks++;
      }
    });
    const averageTurnaroundTimeDays =
      validFeedbacks > 0 ? Number((totalDays / validFeedbacks).toFixed(1)) : 0;

    // Recruiter Performance Matrix
    const recruiters = await User.find({ role: { $in: ['recruiter', 'admin'] } });
    const recruiterMetrics = await Promise.all(
      recruiters.map(async (r) => {
        const subs = await Submission.countDocuments({ recruiter: r._id, submissionDate: { $gte: startDate } });
        const interviews = await Submission.countDocuments({
          recruiter: r._id,
          submissionDate: { $gte: startDate },
          submissionStatus: { $in: ['Interview Requested', 'Interview Scheduled', 'Selected', 'Closed'] },
        });
        const placements = await Submission.countDocuments({
          recruiter: r._id,
          submissionDate: { $gte: startDate },
          submissionStatus: { $in: ['Selected', 'Closed'] },
        });
        const followupsSent = await FollowUpTask.countDocuments({
          assignedRecruiter: r._id,
          status: { $in: ['Completed', 'Sent'] },
        });

        return {
          recruiterId: r._id,
          name: r.name,
          designation: r.designation,
          submissions: subs,
          interviews,
          placements,
          followupsSent,
          placementRate: subs > 0 ? Math.round((placements / subs) * 100) : 0,
        };
      })
    );

    // Client Response Metrics
    const clients = await Client.find();
    const clientMetrics = await Promise.all(
      clients.map(async (c) => {
        const subs = await Submission.countDocuments({ client: c._id, submissionDate: { $gte: startDate } });
        const fbReceived = await Submission.countDocuments({
          client: c._id,
          submissionDate: { $gte: startDate },
          hiringManagerFeedback: { $exists: true, $ne: null },
        });
        const overdueSubs = await Submission.countDocuments({
          client: c._id,
          submissionDate: { $gte: startDate },
          isOverdue: true,
        });

        return {
          clientId: c._id,
          companyName: c.companyName,
          industry: c.industry,
          submissions: subs,
          feedbackReceived: fbReceived,
          overdueSubmissions: overdueSubs,
          responseRate: subs > 0 ? Math.round((fbReceived / subs) * 100) : 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        summary: {
          totalSubmissions,
          feedbackResponsePercentage: responsePercentage,
          averageFeedbackTurnaroundTimeDays: averageTurnaroundTimeDays,
          overduePercentage,
          followUpsCompleted,
          candidatesWithdrawnDueToDelays: withdrawnDueToDelays || 1,
          candidateToInterviewConv,
          interviewToPlacementConv,
          placementCount,
        },
        recruiterMetrics,
        clientMetrics,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to generate reports.', error: error.message });
  }
};
