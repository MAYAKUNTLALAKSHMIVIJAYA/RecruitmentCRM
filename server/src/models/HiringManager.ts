import mongoose, { Document, Schema } from 'mongoose';

export interface IHiringManager extends Document {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  client: mongoose.Types.ObjectId;
  assignedJobs: mongoose.Types.ObjectId[];
  portalAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HiringManagerSchema = new Schema<IHiringManager>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    designation: { type: String, required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    assignedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
    portalAccessToken: { type: String },
  },
  { timestamps: true }
);

export const HiringManager = mongoose.model<IHiringManager>('HiringManager', HiringManagerSchema);
