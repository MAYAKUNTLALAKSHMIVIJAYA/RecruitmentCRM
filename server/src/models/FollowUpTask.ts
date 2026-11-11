import mongoose, { Document, Schema } from 'mongoose';

export type FollowUpStatus = 'Pending' | 'Sent' | 'Snoozed' | 'Completed' | 'Escalated' | 'Cancelled';

export interface IFollowUpTask extends Document {
  submission: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  hiringManager: mongoose.Types.ObjectId;
  assignedRecruiter: mongoose.Types.ObjectId;
  stepNumber: number; // 1 = first follow up, 2 = second follow up, 3 = escalation
  title: string;
  dueDate: Date;
  status: FollowUpStatus;
  lastSentDate?: Date;
  snoozedUntil?: Date;
  escalationNotes?: string;
  history: Array<{
    action: string;
    performedBy?: mongoose.Types.ObjectId;
    timestamp: Date;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpTaskSchema = new Schema<IFollowUpTask>(
  {
    submission: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    hiringManager: { type: Schema.Types.ObjectId, ref: 'HiringManager', required: true },
    assignedRecruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stepNumber: { type: Number, default: 1 },
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Snoozed', 'Completed', 'Escalated', 'Cancelled'],
      default: 'Pending',
    },
    lastSentDate: { type: Date },
    snoozedUntil: { type: Date },
    escalationNotes: { type: String },
    history: [
      {
        action: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

FollowUpTaskSchema.index({ status: 1, dueDate: 1 });

export const FollowUpTask = mongoose.model<IFollowUpTask>('FollowUpTask', FollowUpTaskSchema);
