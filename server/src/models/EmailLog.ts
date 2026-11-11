import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  submission: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  hiringManager: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  templateType: 'Submission' | 'First Follow-up' | 'Second Follow-up' | 'Escalation' | 'Custom';
  status: 'Sent (Simulated)' | 'Failed';
  isSimulated: boolean;
  followUpNumber: number;
  sentAt: Date;
  reviewUrl?: string;
  metadata?: any;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    submission: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    hiringManager: { type: Schema.Types.ObjectId, ref: 'HiringManager', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientEmail: { type: String, required: true },
    recipientName: { type: String, required: true },
    subject: { type: String, required: true },
    bodyText: { type: String, required: true },
    templateType: {
      type: String,
      enum: ['Submission', 'First Follow-up', 'Second Follow-up', 'Escalation', 'Custom'],
      default: 'Submission',
    },
    status: {
      type: String,
      enum: ['Sent (Simulated)', 'Failed'],
      default: 'Sent (Simulated)',
    },
    isSimulated: { type: Boolean, default: true },
    followUpNumber: { type: Number, default: 0 },
    sentAt: { type: Date, default: Date.now },
    reviewUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
