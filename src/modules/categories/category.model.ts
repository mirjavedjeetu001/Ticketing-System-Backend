import { Schema, model, Document } from 'mongoose';

export interface IIssueCategory extends Document {
  _id: string;
  name: string;
  description?: string;
  featureIds: Schema.Types.ObjectId[];
  defaultPriorityId: Schema.Types.ObjectId;
  isActive: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueCategorySchema = new Schema<IIssueCategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  featureIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Feature',
    required: [true, 'At least one feature is required'],
  }],
  defaultPriorityId: {
    type: Schema.Types.ObjectId,
    ref: 'Priority',
    required: [true, 'Default priority is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  color: {
    type: String,
    trim: true,
    default: '#6b7280',
  },
}, {
  timestamps: true,
});

// Indexes
IssueCategorySchema.index({ name: 1 });
IssueCategorySchema.index({ isActive: 1 });
IssueCategorySchema.index({ featureIds: 1 });
IssueCategorySchema.index({ name: 1, featureIds: 1 });

export const IssueCategory = model<IIssueCategory>('IssueCategory', IssueCategorySchema);