import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'agent' | 'user';
  department?: string;
  departmentId?: Schema.Types.ObjectId;
  productAccess?: Schema.Types.ObjectId[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'agent', 'user'],
    default: 'user',
    index: true,
  },
  department: {
    type: String,
    trim: true,
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    index: true,
  },
  productAccess: [{
    type: Schema.Types.ObjectId,
    ref: 'Product',
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ department: 1, isActive: 1 });
UserSchema.index({ departmentId: 1, isActive: 1 });
UserSchema.index({ productAccess: 1, isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function(this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = model<IUser>('User', UserSchema);