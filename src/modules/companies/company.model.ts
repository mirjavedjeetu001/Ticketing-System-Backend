import { Schema, model, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  shortName?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  currency?: string;
  isActive: boolean;
  settings?: {
    allowUserRegistration?: boolean;
    requireEmailVerification?: boolean;
    defaultTicketPriority?: string;
    defaultTicketSeverity?: string;
    slaEnabled?: boolean;
  };
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
    website: {
      type: String,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      allowUserRegistration: {
        type: Boolean,
        default: false,
      },
      requireEmailVerification: {
        type: Boolean,
        default: true,
      },
      defaultTicketPriority: {
        type: String,
      },
      defaultTicketSeverity: {
        type: String,
      },
      slaEnabled: {
        type: Boolean,
        default: true,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CompanySchema.index({ name: 1 });
CompanySchema.index({ isActive: 1 });

export const Company = model<ICompany>('Company', CompanySchema);
