import mongoose, { Document, Schema } from 'mongoose';

export type JobStatus = 'Open' | 'On Hold' | 'Closed' | 'Cancelled';

export interface IJob extends Document {
  jobId: string;
  jobTitle: string;
  client: mongoose.Types.ObjectId;
  hiringManager: mongoose.Types.ObjectId;
  department: string;
  requiredSkills: string[];
  experienceRequired: string;
  salaryRange: string;
  jobLocation: string;
  employmentType: string;
  jobDescription: string;
  assignedRecruiter: mongoose.Types.ObjectId;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  numberOfOpenings: number;
  jobStatus: JobStatus;
  targetClosureDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    jobId: { type: String, required: true, unique: true },
    jobTitle: { type: String, required: true, trim: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    hiringManager: { type: Schema.Types.ObjectId, ref: 'HiringManager', required: true },
    department: { type: String, default: 'Engineering' },
    requiredSkills: [{ type: String, trim: true }],
    experienceRequired: { type: String, required: true },
    salaryRange: { type: String, default: '' },
    jobLocation: { type: String, required: true },
    employmentType: { type: String, default: 'Full-time' },
    jobDescription: { type: String, default: '' },
    assignedRecruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    numberOfOpenings: { type: Number, default: 1 },
    jobStatus: {
      type: String,
      enum: ['Open', 'On Hold', 'Closed', 'Cancelled'],
      default: 'Open',
    },
    targetClosureDate: { type: Date },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>('Job', JobSchema);
