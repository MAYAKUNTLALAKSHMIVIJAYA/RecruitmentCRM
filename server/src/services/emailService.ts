import { EmailLog, IEmailLog } from '../models/EmailLog';
import { ActivityLog } from '../models/ActivityLog';
import { emitEvent } from './socketService';
import mongoose from 'mongoose';

export interface EmailParams {
  submissionId: string | mongoose.Types.ObjectId;
  candidateId: string | mongoose.Types.ObjectId;
  jobId: string | mongoose.Types.ObjectId;
  clientId: string | mongoose.Types.ObjectId;
  hiringManagerId: string | mongoose.Types.ObjectId;
  senderId: string | mongoose.Types.ObjectId;
  recipientEmail: string;
  recipientName: string;
  templateType: 'Submission' | 'First Follow-up' | 'Second Follow-up' | 'Escalation' | 'Custom';
  subject: string;
  bodyText: string;
  followUpNumber?: number;
  reviewUrl?: string;
}

export const EMAIL_TEMPLATES = {
  Submission: {
    name: 'Candidate Submission',
    subject: 'Candidate Submission – [Candidate Name] – [Job Title]',
    body: `Dear [Hiring Manager],

Please find the profile of [Candidate Name] for the [Job Title] position.

Experience: [Experience]
Skills: [Skills]
Current Company: [Current Company]
Notice Period: [Notice Period]

You can review the full candidate profile, credentials, and submit your interview or hiring decision directly via the secure portal link below:
[Review Link]

Please review the profile and share your feedback.

Thank you,
[Recruiter Name]
RecruitFlow Agency Team`,
  },
  'First Follow-up': {
    name: 'First Follow-up',
    subject: 'Follow-up: Candidate Submission – [Candidate Name]',
    body: `Dear [Hiring Manager],

I hope you are doing well.

I am following up on the profile of [Candidate Name] submitted for the [Job Title] position on [Submission Date].

Could you please share your feedback or let us know if an interview can be scheduled? You can review the submission and submit your decision directly here:
[Review Link]

Your timely response will help us coordinate with the candidate.

Thank you,
[Recruiter Name]
RecruitFlow Agency Team`,
  },
  'Second Follow-up': {
    name: 'Second Follow-up (Urgent)',
    subject: 'Second Follow-up – Feedback Required – [Candidate Name]',
    body: `Dear [Hiring Manager],

I wanted to follow up again regarding [Candidate Name]'s submission for [Job Title].

The candidate is actively exploring opportunities and interviewing with other organizations, so we would appreciate your feedback at the earliest to prevent losing them.

Review link: [Review Link]

Please let us know your decision.

Thank you,
[Recruiter Name]
RecruitFlow Agency Team`,
  },
  Escalation: {
    name: 'Team Escalation',
    subject: 'Urgent: Pending Candidate Feedback – [Candidate Name]',
    body: `Dear [Team Lead],

The submission for [Candidate Name] has been awaiting feedback for several days.

Client: [Client]
Job: [Job Title]
Hiring Manager: [Hiring Manager]
Days Waiting: [Days Waiting] days
Candidate Status: Active with competing interest

Please assist in obtaining the pending feedback from the client stakeholder.

Thank you,
[Recruiter Name]`,
  },
};

export const replacePlaceholders = (
  text: string,
  variables: Record<string, string | number>
): string => {
  let result = text;
  for (const [key, val] of Object.entries(variables)) {
    const regex = new RegExp(`\\[${key}\\]`, 'g');
    result = result.replace(regex, String(val || ''));
  }
  return result;
};

export const sendEmail = async (params: EmailParams): Promise<IEmailLog> => {
  console.log(`[EmailService] ⚡ [SIMULATED EMAIL] To: ${params.recipientEmail} | Subject: "${params.subject}"`);

  const emailLog = new EmailLog({
    submission: params.submissionId,
    candidate: params.candidateId,
    job: params.jobId,
    client: params.clientId,
    hiringManager: params.hiringManagerId,
    sender: params.senderId,
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName,
    subject: params.subject,
    bodyText: params.bodyText,
    templateType: params.templateType,
    status: 'Sent (Simulated)',
    isSimulated: true,
    followUpNumber: params.followUpNumber || 0,
    sentAt: new Date(),
    reviewUrl: params.reviewUrl,
  });

  await emailLog.save();

  // Record in ActivityLog
  await ActivityLog.create({
    submission: params.submissionId,
    candidate: params.candidateId,
    job: params.jobId,
    performedBy: params.senderId,
    action: `Email Sent: ${params.templateType}`,
    details: `Simulated email sent to ${params.recipientName} (${params.recipientEmail}) with subject: "${params.subject}"`,
    meta: {
      templateType: params.templateType,
      recipient: params.recipientEmail,
      followUpNumber: params.followUpNumber,
    },
  });

  emitEvent('email_sent', {
    emailId: emailLog._id,
    submissionId: params.submissionId,
    recipient: params.recipientEmail,
    subject: params.subject,
    templateType: params.templateType,
    sentAt: emailLog.sentAt,
  });

  return emailLog;
};
