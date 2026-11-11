import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Submission } from '../models/Submission';

export const getTeamMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ role: 1, name: 1 });

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const activeSubmissions = await Submission.countDocuments({
          recruiter: u._id,
          submissionStatus: { $in: ['Submitted', 'Awaiting Feedback', 'Follow-up Due'] },
        });
        const totalPlacements = await Submission.countDocuments({
          recruiter: u._id,
          submissionStatus: { $in: ['Selected', 'Closed'] },
        });

        return {
          ...u.toObject(),
          activeSubmissions,
          totalPlacements,
        };
      })
    );

    res.json({ success: true, count: enrichedUsers.length, data: enrichedUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch team members.', error: error.message });
  }
};
