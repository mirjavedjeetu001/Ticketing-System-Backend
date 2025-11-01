import { Schema, model, Document } from 'mongoose';

export interface ITicket extends Document {
  _id: string;
  ticketId: string;
  title: string;
  description?: string;
  createdBy: Schema.Types.ObjectId;
  assignee?: Schema.Types.ObjectId;
  assignedBy?: Schema.Types.ObjectId; // Who assigned/mentioned this user
  assignToProductTeam?: boolean;
  assignedDepartmentId?: Schema.Types.ObjectId;
  mentionedUsers?: Schema.Types.ObjectId[]; // Users who were mentioned in this ticket
  severityId?: Schema.Types.ObjectId;
  priorityId?: Schema.Types.ObjectId;
  severity: 'low' | 'medium' | 'high' | 'critical'; // Legacy field for backward compatibility
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  department?: string;
  productId: Schema.Types.ObjectId;
  categoryId: Schema.Types.ObjectId;
  tags: string[];
  mentions?: string[]; // Array of usernames or department names mentioned
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
    data?: string; // Base64 encoded file data stored in MongoDB
    url?: string; // Local file path for backward compatibility
  }[];
  comments: {
    author: Schema.Types.ObjectId;
    content: string;
    createdAt: Date;
    isInternal: boolean;
  }[];
  activityLog: {
    user: Schema.Types.ObjectId;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    description: string;
    createdAt: Date;
  }[];
  resolution?: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  slaResponseDue?: Date;
  slaResolutionDue?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticketId: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required'],
    index: true,
  },
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  assignToProductTeam: {
    type: Boolean,
    default: false,
    index: true,
  },
  assignedDepartmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    index: true,
  },
  mentionedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  severityId: {
    type: Schema.Types.ObjectId,
    ref: 'Severity',
    index: true,
  },
  priorityId: {
    type: Schema.Types.ObjectId,
    ref: 'Priority',
    index: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },
  department: {
    type: String,
    trim: true,
    index: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required'],
    index: true,
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'IssueCategory',
    required: [true, 'Category is required'],
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  mentions: [{
    type: String,
    trim: true,
  }],
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    data: { type: String }, // Base64 encoded file data (stored in MongoDB)
    url: { type: String }, // Local file path (for backward compatibility)
  }],
  comments: [{
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: false, maxlength: 2000, default: '' },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false },
  }],
  activityLog: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true }, // e.g., 'status_changed', 'description_updated', 'assigned', etc.
    field: { type: String }, // field that was changed (if applicable)
    oldValue: { type: String }, // previous value (if applicable)
    newValue: { type: String }, // new value (if applicable)
    description: { type: String, required: true }, // human-readable description
    createdAt: { type: Date, default: Date.now },
  }],
  resolution: {
    type: String,
    trim: true,
    maxlength: [2000, 'Resolution cannot exceed 2000 characters'],
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative'],
    max: [1000, 'Estimated hours cannot exceed 1000'],
  },
  actualHours: {
    type: Number,
    min: [0, 'Actual hours cannot be negative'],
    max: [1000, 'Actual hours cannot exceed 1000'],
  },
  dueDate: {
    type: Date,
    index: true,
  },
  slaResponseDue: {
    type: Date,
    index: true,
  },
  slaResolutionDue: {
    type: Date,
    index: true,
  },
  resolvedAt: {
    type: Date,
  },
  closedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Compound indexes for better query performance
TicketSchema.index({ status: 1, severity: 1 });
TicketSchema.index({ assignee: 1, status: 1 });
TicketSchema.index({ createdBy: 1, status: 1 });
TicketSchema.index({ department: 1, status: 1 });
TicketSchema.index({ productId: 1, status: 1 });
TicketSchema.index({ categoryId: 1, status: 1 });
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ dueDate: 1, status: 1 });

// Text search index
TicketSchema.index({
  title: 'text',
  description: 'text',
  'comments.content': 'text',
});

// Pre-save middleware to update timestamps
TicketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

// Virtual for computed fields
TicketSchema.virtual('isOverdue').get(function(this: ITicket) {
  if (!this.dueDate || this.status === 'closed' || this.status === 'resolved') {
    return false;
  }
  return new Date() > this.dueDate;
});

TicketSchema.virtual('timeToResolve').get(function(this: ITicket) {
  if (!this.resolvedAt) return null;
  return this.resolvedAt.getTime() - this.createdAt.getTime();
});

// Ensure virtuals are included in JSON
TicketSchema.set('toJSON', { virtuals: true });

export const Ticket = model<ITicket>('Ticket', TicketSchema);