import { Schema, model, Document } from 'mongoose';

export interface IPriority extends Document {
  _id: string;
  name: string; // P1, P2, P3, etc.
  level: number; // 1, 2, 3, etc.
  description: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PrioritySchema = new Schema<IPriority>({
  name: {
    type: String,
    required: [true, 'Priority name is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^P[1-9]\d*$/, 'Priority name must follow pattern P1, P2, P3, etc.'],
  },
  level: {
    type: Number,
    required: [true, 'Priority level is required'],
    unique: true,
    min: [1, 'Priority level must be at least 1'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color'],
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes
PrioritySchema.index({ level: 1, isActive: 1 });
PrioritySchema.index({ name: 1 });

export const Priority = model<IPriority>('Priority', PrioritySchema);