import { Schema, model, Document } from 'mongoose';

export interface ISeverity extends Document {
  _id: string;
  name: string; // S1, S2, S3, S4
  level: number; // 1, 2, 3, 4
  description: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SeveritySchema = new Schema<ISeverity>({
  name: {
    type: String,
    required: [true, 'Severity name is required'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^S[1-9]\d*$/, 'Severity name must follow pattern S1, S2, S3, etc.'],
  },
  level: {
    type: Number,
    required: [true, 'Severity level is required'],
    unique: true,
    min: [1, 'Severity level must be at least 1'],
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
SeveritySchema.index({ level: 1, isActive: 1 });
SeveritySchema.index({ name: 1 });

export const Severity = model<ISeverity>('Severity', SeveritySchema);