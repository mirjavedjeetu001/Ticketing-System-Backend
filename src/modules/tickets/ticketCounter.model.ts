import { Schema, model, Document } from 'mongoose';

export interface ITicketCounter extends Document {
  productId: Schema.Types.ObjectId;
  productAbbreviation: string;
  currentCount: number;
  lastResetDate?: Date;
}

const TicketCounterSchema = new Schema<ITicketCounter>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
  },
  productAbbreviation: {
    type: String,
    required: true,
    uppercase: true,
    maxlength: 5,
  },
  currentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastResetDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
TicketCounterSchema.index({ productId: 1, productAbbreviation: 1 });

export const TicketCounter = model<ITicketCounter>('TicketCounter', TicketCounterSchema);