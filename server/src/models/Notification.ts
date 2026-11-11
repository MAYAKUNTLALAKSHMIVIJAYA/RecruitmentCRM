import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  type:
    | 'SUBMISSION_CREATED'
    | 'FEEDBACK_RECEIVED'
    | 'FOLLOWUP_DUE'
    | 'FOLLOWUP_OVERDUE'
    | 'CANDIDATE_RISK'
    | 'SUBMISSION_ESCALATED'
    | 'INTERVIEW_REQUESTED'
    | 'CANDIDATE_WITHDRAWN';
  title: string;
  message: string;
  submission?: mongoose.Types.ObjectId;
  candidate?: mongoose.Types.ObjectId;
  job?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: [
        'SUBMISSION_CREATED',
        'FEEDBACK_RECEIVED',
        'FOLLOWUP_DUE',
        'FOLLOWUP_OVERDUE',
        'CANDIDATE_RISK',
        'SUBMISSION_ESCALATED',
        'INTERVIEW_REQUESTED',
        'CANDIDATE_WITHDRAWN',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    submission: { type: Schema.Types.ObjectId, ref: 'Submission' },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    job: { type: Schema.Types.ObjectId, ref: 'Job' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
