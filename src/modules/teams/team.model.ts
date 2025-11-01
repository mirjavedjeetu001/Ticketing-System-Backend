import { Schema, model, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  departmentId: Schema.Types.ObjectId;
  businessUnitId: Schema.Types.ObjectId;
  teamLeadId?: Schema.Types.ObjectId;
  members: Schema.Types.ObjectId[]; // Array of user IDs
  isActive: boolean;
  settings?: {
    maxMembers?: number;
    allowSelfAssignment?: boolean;
  };
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    businessUnitId: {
      type: Schema.Types.ObjectId,
      ref: 'BusinessUnit',
      required: true,
    },
    teamLeadId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      maxMembers: {
        type: Number,
        default: 50,
      },
      allowSelfAssignment: {
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
TeamSchema.index({ departmentId: 1 });
TeamSchema.index({ businessUnitId: 1 });
TeamSchema.index({ teamLeadId: 1 });
TeamSchema.index({ members: 1 });
TeamSchema.index({ isActive: 1 });

export const Team = model<ITeam>('Team', TeamSchema);
