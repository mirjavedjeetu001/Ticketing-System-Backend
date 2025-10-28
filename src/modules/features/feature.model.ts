import mongoose, { Document, Schema } from 'mongoose';

export interface IFeature extends Document {
  name: string;
  description: string;
  productId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema = new Schema<IFeature>({
  name: {
    type: String,
    required: [true, 'Feature name is required'],
    trim: true,
    maxLength: [100, 'Feature name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique feature names per product
FeatureSchema.index({ name: 1, productId: 1 }, { unique: true });

// Index for efficient queries
FeatureSchema.index({ productId: 1, isActive: 1 });

export default mongoose.model<IFeature>('Feature', FeatureSchema);