import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { EmailLog } from '../models/EmailLog';
import { sendEmail, EMAIL_TEMPLATES } from '../services/emailService';

export const getEmailLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId, candidateId, templateType } = req.query;
    const query: any = {};

    if (submissionId) query.submission = submissionId;
    if (candidateId) query.candidate = candidateId;
    if (templateType) query.templateType = templateType;

    const emails = await EmailLog.find(query)
      .populate('sender', 'name email avatar')
      .populate('candidate', 'fullName email')
      .populate('job', 'jobId jobTitle')
      .populate('client', 'companyName')
      .populate('hiringManager', 'fullName email')
      .sort({ sentAt: -1 });

    res.json({ success: true, count: emails.length, data: emails });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch email logs.', error: error.message });
  }
};

export const getTemplates = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: EMAIL_TEMPLATES,
  });
};

export const sendManualEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      submissionId,
      candidateId,
      jobId,
      clientId,
      hiringManagerId,
      recipientEmail,
      recipientName,
      templateType = 'Custom',
      subject,
      bodyText,
    } = req.body;

    const emailLog = await sendEmail({
      submissionId,
      candidateId,
      jobId,
      clientId,
      hiringManagerId,
      senderId: req.user?._id as any,
      recipientEmail,
      recipientName,
      templateType,
      subject,
      bodyText,
    });

    res.status(201).json({
      success: true,
      message: 'Email dispatched (Simulated Mode).',
      data: emailLog,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to send email.', error: error.message });
  }
};
