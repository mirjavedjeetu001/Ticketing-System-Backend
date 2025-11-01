import { Schema, model, Document } from 'mongoose';

export interface IBusinessUnit extends Document {
  name: string;
  shortName: string; // SSL, SFL, SML, SBE, SBC, Tech
  description?: string;
  companyId: Schema.Types.ObjectId;
  headUserId?: Schema.Types.ObjectId;
  isActive: boolean;
  settings?: {
    allowTicketCreation?: boolean;
    requireApproval?: boolean;
  };
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessUnitSchema = new Schema<IBusinessUnit>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    headUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      allowTicketCreation: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
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
BusinessUnitSchema.index({ companyId: 1, name: 1 });
BusinessUnitSchema.index({ companyId: 1, shortName: 1 }, { unique: true });
BusinessUnitSchema.index({ isActive: 1 });

export const BusinessUnit = model<IBusinessUnit>('BusinessUnit', BusinessUnitSchema);
