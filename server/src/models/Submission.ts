import mongoose, { Document, Schema } from 'mongoose';

export type SubmissionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Awaiting Feedback'
  | 'Follow-up Due'
  | 'Feedback Received'
  | 'Interview Requested'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn'
  | 'Closed';

export interface ISubmission extends Document {
  submissionId: string;
  candidate: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  hiringManager: mongoose.Types.ObjectId;
  recruiter: mongoose.Types.ObjectId;
  submissionDate: Date;
  submissionMethod: string;
  emailSubject: string;
  submissionNotes: string;
  resumeAttachment?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  feedbackDueDate: Date;
  lastFollowUpDate?: Date;
  nextFollowUpDate?: Date;
  submissionStatus: SubmissionStatus;
  reviewToken: string;
  reviewTokenExpiresAt: Date;
  hiringManagerFeedback?: mongoose.Types.ObjectId;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskReasons: string[];
  daysWaiting: number;
  isOverdue: boolean;
  isEscalated: boolean;
  escalatedAt?: Date;
  escalatedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    submissionId: { type: String, required: true, unique: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    hiringManager: { type: Schema.Types.ObjectId, ref: 'HiringManager', required: true },
    recruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submissionDate: { type: Date, default: Date.now },
    submissionMethod: { type: String, default: 'Email' },
    emailSubject: { type: String, required: true },
    submissionNotes: { type: String, default: '' },
    resumeAttachment: { type: String },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    feedbackDueDate: { type: Date, required: true },
    lastFollowUpDate: { type: Date },
    nextFollowUpDate: { type: Date },
    submissionStatus: {
      type: String,
      enum: [
        'Draft',
        'Submitted',
        'Awaiting Feedback',
        'Follow-up Due',
        'Feedback Received',
        'Interview Requested',
        'Interview Scheduled',
        'Selected',
        'Rejected',
        'Withdrawn',
        'Closed',
      ],
      default: 'Submitted',
    },
    reviewToken: { type: String, required: true, unique: true },
    reviewTokenExpiresAt: { type: Date, required: true },
    hiringManagerFeedback: { type: Schema.Types.ObjectId, ref: 'Feedback' },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },
    riskReasons: [{ type: String }],
    daysWaiting: { type: Number, default: 0 },
    isOverdue: { type: Boolean, default: false },
    isEscalated: { type: Boolean, default: false },
    escalatedAt: { type: Date },
    escalatedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SubmissionSchema.index({ candidate: 1, job: 1 });
SubmissionSchema.index({ client: 1, hiringManager: 1 });
SubmissionSchema.index({ submissionStatus: 1, feedbackDueDate: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
