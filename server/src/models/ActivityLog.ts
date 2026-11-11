import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  submission?: mongoose.Types.ObjectId;
  candidate?: mongoose.Types.ObjectId;
  job?: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  action: string;
  details: string;
  meta?: any;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    submission: { type: Schema.Types.ObjectId, ref: 'Submission' },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    job: { type: Schema.Types.ObjectId, ref: 'Job' },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivityLogSchema.index({ submission: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
