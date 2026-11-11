import mongoose, { Document, Schema } from 'mongoose';

export type FeedbackDecision =
  | 'Accept'
  | 'Reject'
  | 'Request Interview'
  | 'Request More Information'
  | 'Keep Under Review';

export interface IFeedback extends Document {
  submission: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  job: mongoose.Types.ObjectId;
  hiringManager: mongoose.Types.ObjectId;
  decision: FeedbackDecision;
  comments: string;
  interviewAvailability?: string;
  additionalRequirements?: string;
  submittedAt: Date;
  ipAddress?: string;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    submission: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    candidate: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    hiringManager: { type: Schema.Types.ObjectId, ref: 'HiringManager', required: true },
    decision: {
      type: String,
      enum: [
        'Accept',
        'Reject',
        'Request Interview',
        'Request More Information',
        'Keep Under Review',
      ],
      required: true,
    },
    comments: { type: String, required: true },
    interviewAvailability: { type: String, default: '' },
    additionalRequirements: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);
