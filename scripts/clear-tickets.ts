import 'dotenv/config';
import mongoose from 'mongoose';
import { Ticket } from '../src/modules/tickets/ticket.model';
import { TicketCounter } from '../src/modules/tickets/ticketCounter.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function clearTickets() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing tickets and counters
    await Ticket.deleteMany({});
    await TicketCounter.deleteMany({});
    
    console.log('🧹 Cleared all existing tickets and ticket counters');
    console.log('✅ Ready for fresh ticket creation!');
    
  } catch (error) {
    console.error('❌ Error clearing tickets:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

clearTickets();