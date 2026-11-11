import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  companyName: string;
  industry: string;
  website: string;
  location: string;
  primaryContact: string;
  contactEmail: string;
  contactPhone: string;
  assignedRecruiter: mongoose.Types.ObjectId;
  accountStatus: 'Active' | 'Inactive' | 'On Hold';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    companyName: { type: String, required: true, trim: true },
    industry: { type: String, required: true },
    website: { type: String, default: '' },
    location: { type: String, required: true },
    primaryContact: { type: String, required: true },
    contactEmail: { type: String, required: true, lowercase: true },
    contactPhone: { type: String, default: '' },
    assignedRecruiter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accountStatus: {
      type: String,
      enum: ['Active', 'Inactive', 'On Hold'],
      default: 'Active',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Client = mongoose.model<IClient>('Client', ClientSchema);
