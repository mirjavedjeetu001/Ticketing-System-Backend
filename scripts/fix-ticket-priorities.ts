import 'dotenv/config';
import mongoose from 'mongoose';
import { Ticket } from '../src/modules/tickets/ticket.model';
import { IssueCategory } from '../src/modules/categories/category.model';
import { Priority } from '../src/modules/system-settings/priority.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function fixTicketPriorities() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all tickets that don't have a priorityId set
    const ticketsWithoutPriority = await Ticket.find({
      priorityId: { $exists: false }
    }).populate('categoryId');

    console.log(`🎫 Found ${ticketsWithoutPriority.length} tickets without priorityId`);

    if (ticketsWithoutPriority.length === 0) {
      console.log('✅ All tickets already have priorities set');
      return;
    }

    // Get all categories with their default priorities
    const categories = await IssueCategory.find().populate('defaultPriorityId');
    console.log(`📂 Found ${categories.length} categories`);

    let updatedCount = 0;

    for (const ticket of ticketsWithoutPriority) {
      if (ticket.categoryId) {
        const category = categories.find(cat => cat._id.toString() === ticket.categoryId.toString());
        
        if (category && category.defaultPriorityId) {
          // Update ticket with the category's default priority
          await Ticket.findByIdAndUpdate(ticket._id, {
            priorityId: category.defaultPriorityId
          });
          
          console.log(`✅ Updated ticket ${ticket.ticketId || ticket._id} with priority from category`);
          updatedCount++;
        } else {
          console.log(`⚠️ No default priority found for category of ticket ${ticket.ticketId || ticket._id}`);
        }
      } else {
        console.log(`⚠️ Ticket ${ticket.ticketId || ticket._id} has no category`);
      }
    }

    console.log(`🎉 Updated ${updatedCount} tickets with priorities`);
    
    // Also check for tickets that might have null priorityId
    const ticketsWithNullPriority = await Ticket.find({
      priorityId: null
    }).populate('categoryId');

    if (ticketsWithNullPriority.length > 0) {
      console.log(`🔄 Found ${ticketsWithNullPriority.length} tickets with null priorityId, fixing...`);
      
      for (const ticket of ticketsWithNullPriority) {
        if (ticket.categoryId) {
          const category = categories.find(cat => cat._id.toString() === ticket.categoryId.toString());
          
          if (category && category.defaultPriorityId) {
            await Ticket.findByIdAndUpdate(ticket._id, {
              priorityId: category.defaultPriorityId
            });
            console.log(`✅ Fixed null priority for ticket ${ticket.ticketId || ticket._id}`);
            updatedCount++;
          }
        }
      }
    }

    console.log(`📊 Final Results:`);
    console.log(`   - Total tickets updated: ${updatedCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing ticket priorities:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

fixTicketPriorities();