import { Schema, model, Document } from 'mongoose';

export interface ISLARule extends Document {
  _id: string;
  name: string;
  description: string;
  severityId: Schema.Types.ObjectId;
  priorityId: Schema.Types.ObjectId;
  responseTime: number; // in minutes
  resolutionTime: number; // in minutes
  isActive: boolean;
  escalationRules: {
    level: number;
    timeThreshold: number; // in minutes
    escalateTo: Schema.Types.ObjectId[]; // User IDs
    notificationTemplate: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const SLARuleSchema = new Schema<ISLARule>({
  name: {
    type: String,
    required: [true, 'SLA rule name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  severityId: {
    type: Schema.Types.ObjectId,
    ref: 'Severity',
    required: [true, 'Severity is required'],
    index: true,
  },
  priorityId: {
    type: Schema.Types.ObjectId,
    ref: 'Priority',
    required: [true, 'Priority is required'],
    index: true,
  },
  responseTime: {
    type: Number,
    required: [true, 'Response time is required'],
    min: [1, 'Response time must be at least 1 minute'],
  },
  resolutionTime: {
    type: Number,
    required: [true, 'Resolution time is required'],
    min: [1, 'Resolution time must be at least 1 minute'],
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  escalationRules: [{
    level: {
      type: Number,
      required: true,
      min: 1,
    },
    timeThreshold: {
      type: Number,
      required: true,
      min: 1,
    },
    escalateTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    notificationTemplate: {
      type: String,
      default: 'Ticket escalation notification',
    },
  }],
}, {
  timestamps: true,
});

// Compound indexes
SLARuleSchema.index({ severityId: 1, priorityId: 1 }, { unique: true });
SLARuleSchema.index({ isActive: 1 });

// Virtual for formatted response time
SLARuleSchema.virtual('responseTimeFormatted').get(function(this: ISLARule) {
  const hours = Math.floor(this.responseTime / 60);
  const minutes = this.responseTime % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
});

// Virtual for formatted resolution time
SLARuleSchema.virtual('resolutionTimeFormatted').get(function(this: ISLARule) {
  const hours = Math.floor(this.resolutionTime / 60);
  const minutes = this.resolutionTime % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
});

SLARuleSchema.set('toJSON', { virtuals: true });

export const SLARule = model<ISLARule>('SLARule', SLARuleSchema);