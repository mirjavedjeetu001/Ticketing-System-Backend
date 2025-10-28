import { Schema, model, Document } from 'mongoose';

export interface IDepartment extends Document {
  _id: string;
  name: string;
  description?: string;
  members: Schema.Types.ObjectId[]; // User IDs
  head?: Schema.Types.ObjectId; // Department head user ID
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Department name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  head: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
DepartmentSchema.index({ name: 1, isActive: 1 });
DepartmentSchema.index({ members: 1 });

export const Department = model<IDepartment>('Department', DepartmentSchema);