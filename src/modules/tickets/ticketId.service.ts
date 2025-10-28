import { Product } from '../products/product.model';
import { TicketCounter } from './ticketCounter.model';
import { Types } from 'mongoose';

export class TicketIdService {
  /**
   * Generate a unique ticket ID for a product
   * Format: {PRODUCT_ABBREVIATION}-{NUMBER} (e.g., SBE-1, SPY-42)
   */
  static async generateTicketId(productId: string): Promise<string> {
    try {
      // Find the product to get its abbreviation
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Use abbreviation or fallback to first 3 letters of product name
      let abbreviation = product.abbreviation;
      if (!abbreviation) {
        abbreviation = product.name
          .replace(/[^A-Za-z\s]/g, '') // Remove special characters
          .split(' ')
          .map(word => word.charAt(0).toUpperCase())
          .join('')
          .substring(0, 3) || 'TKT';
      }

      // Get or create counter for this product
      let counter = await TicketCounter.findOne({ productId: new Types.ObjectId(productId) });
      
      if (!counter) {
        // Create new counter for this product
        counter = new TicketCounter({
          productId: new Types.ObjectId(productId),
          productAbbreviation: abbreviation,
          currentCount: 0,
        });
      }

      // Increment the counter
      counter.currentCount += 1;
      await counter.save();

      // Return the formatted ticket ID
      return `${abbreviation}-${counter.currentCount}`;
      
    } catch (error) {
      console.error('Error generating ticket ID:', error);
      // Fallback to a random ID if generation fails
      const fallback = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return fallback;
    }
  }

  /**
   * Check if a ticket ID already exists
   */
  static async isTicketIdUnique(ticketId: string): Promise<boolean> {
    const { Ticket } = await import('./ticket.model');
    const existingTicket = await Ticket.findOne({ ticketId });
    return !existingTicket;
  }

  /**
   * Reset counter for a product (optional feature for yearly resets)
   */
  static async resetProductCounter(productId: string): Promise<void> {
    await TicketCounter.updateOne(
      { productId: new Types.ObjectId(productId) },
      { 
        currentCount: 0,
        lastResetDate: new Date()
      }
    );
  }

  /**
   * Get current counter for a product
   */
  static async getProductCounter(productId: string): Promise<number> {
    const counter = await TicketCounter.findOne({ productId: new Types.ObjectId(productId) });
    return counter?.currentCount || 0;
  }
}