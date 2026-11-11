import mongoose, { Document, Schema } from 'mongoose';

export type CandidateStatus =
  | 'New'
  | 'Contacted'
  | 'Screened'
  | 'Shortlisted'
  | 'Submitted'
  | 'Interview'
  | 'Selected'
  | 'Offer'
  | 'Placed'
  | 'Rejected'
  | 'Withdrawn';

export interface ICandidate extends Document {
  candidateId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  totalExperience: number; // in years
  currentCompany: string;
  currentDesignation: string;
  expectedSalary: string;
  noticePeriod: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  linkedinProfile?: string;
  recruiterOwner: mongoose.Types.ObjectId;
  availability: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  source: string;
  status: CandidateStatus;
  notes: string[];
  competingOffers: boolean;
  inFinalStagesElsewhere: boolean;
  dissatisfiedWithDelays?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    candidateId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    location: { type: String, required: true },
    skills: [{ type: String, trim: true }],
    totalExperience: { type: Number, required: true, default: 0 },
    currentCompany: { type: String, default: '' },
    currentDesignation: { type: String, default: '' },
    expectedSalary: { type: String, default: '' },
    noticePeriod: { type: String, default: 'Immediate' },
    resumeUrl: { type: String },
    resumeOriginalName: { type: String },
    linkedinProfile: { type: String },
    recruiterOwner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    availability: { type: String, default: 'Immediate' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    source: { type: String, default: 'LinkedIn' },
    status: {
      type: String,
      enum: [
        'New',
        'Contacted',
        'Screened',
        'Shortlisted',
        'Submitted',
        'Interview',
        'Selected',
        'Offer',
        'Placed',
        'Rejected',
        'Withdrawn',
      ],
      default: 'New',
    },
    notes: [{ type: String }],
    competingOffers: { type: Boolean, default: false },
    inFinalStagesElsewhere: { type: Boolean, default: false },
    dissatisfiedWithDelays: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CandidateSchema.index({ fullName: 'text', email: 'text', skills: 'text' });

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
