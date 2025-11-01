import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  _id: string;
  name: string;
  abbreviation?: string;
  description?: string;
  category: string;
  businessUnitId?: Schema.Types.ObjectId;
  departments: string[]; // Which departments can access this product
  isActive: boolean;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    unique: true,
  },
  abbreviation: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: 5,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    trim: true,
  },
  businessUnitId: {
    type: Schema.Types.ObjectId,
    ref: 'BusinessUnit',
    required: false,
  },
  departments: [{
    type: String,
    required: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  icon: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
    default: '#3b82f6',
  },
}, {
  timestamps: true,
});

// Indexes
ProductSchema.index({ name: 1, isActive: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ departments: 1, isActive: 1 });

export const Product = model<IProduct>('Product', ProductSchema);