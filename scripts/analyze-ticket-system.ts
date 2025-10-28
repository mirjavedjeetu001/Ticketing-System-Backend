import 'dotenv/config';
import mongoose from 'mongoose';
import { Ticket } from '../src/modules/tickets/ticket.model';
import { IssueCategory } from '../src/modules/categories/category.model';
import { Priority } from '../src/modules/system-settings/priority.model';
import { Severity } from '../src/modules/system-settings/severity.model';
import { Product } from '../src/modules/products/product.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function analyzeTicketSystem() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get counts of all related entities
    const [ticketCount, categoryCount, priorityCount, severityCount, productCount] = await Promise.all([
      Ticket.countDocuments(),
      IssueCategory.countDocuments(),
      Priority.countDocuments(),
      Severity.countDocuments(),
      Product.countDocuments()
    ]);

    console.log('\n📊 System Overview:');
    console.log(`   Tickets: ${ticketCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Priorities: ${priorityCount}`);
    console.log(`   Severities: ${severityCount}`);
    console.log(`   Products: ${productCount}`);

    // Check ticket population
    console.log('\n🎫 Analyzing Tickets...');
    const sampleTickets = await Ticket.find()
      .populate('priorityId', 'name level color')
      .populate('severityId', 'name level color')
      .populate('productId', 'name abbreviation')
      .populate('categoryId', 'name color')
      .limit(3);

    if (sampleTickets.length > 0) {
      console.log('   Sample tickets with populated data:');
      sampleTickets.forEach(ticket => {
        console.log(`   - ${ticket.ticketId || ticket._id}:`);
        console.log(`     Priority: ${ticket.priorityId ? `${ticket.priorityId.name} (Level ${ticket.priorityId.level})` : 'Not set'}`);
        console.log(`     Severity: ${ticket.severityId ? `${ticket.severityId.name} (Level ${ticket.severityId.level})` : 'Not set'}`);
        console.log(`     Product: ${ticket.productId ? ticket.productId.name : 'Not set'}`);
        console.log(`     Category: ${ticket.categoryId ? ticket.categoryId.name : 'Not set'}`);
        console.log(`     SLA Response Due: ${ticket.slaResponseDue || 'Not set'}`);
        console.log(`     SLA Resolution Due: ${ticket.slaResolutionDue || 'Not set'}`);
        console.log('');
      });
    } else {
      console.log('   No tickets found');
    }

    // Check categories with their priorities
    console.log('📂 Analyzing Categories...');
    const categories = await IssueCategory.find()
      .populate('defaultPriorityId', 'name level')
      .populate('featureIds', 'name');

    if (categories.length > 0) {
      console.log('   Categories with default priorities:');
      categories.forEach(cat => {
        console.log(`   - ${cat.name}:`);
        console.log(`     Default Priority: ${cat.defaultPriorityId ? `${cat.defaultPriorityId.name} (Level ${cat.defaultPriorityId.level})` : 'Not set'}`);
        console.log(`     Features: ${cat.featureIds.length} feature(s)`);
        console.log(`     Active: ${cat.isActive}`);
        console.log('');
      });
    } else {
      console.log('   No categories found');
    }

    // Check priorities
    console.log('🎯 Available Priorities:');
    const priorities = await Priority.find({ isActive: true }).sort({ level: 1 });
    priorities.forEach(priority => {
      console.log(`   - ${priority.name} (Level ${priority.level}): ${priority.description}`);
    });

    // Check severities
    console.log('\n⚠️ Available Severities:');
    const severities = await Severity.find({ isActive: true }).sort({ level: 1 });
    severities.forEach(severity => {
      console.log(`   - ${severity.name} (Level ${severity.level}): ${severity.description}`);
    });

    // Check for tickets missing data
    console.log('\n🔍 Checking for Data Issues...');
    const ticketsNoPriority = await Ticket.countDocuments({ priorityId: { $exists: false } });
    const ticketsNoSeverity = await Ticket.countDocuments({ severityId: { $exists: false } });
    const ticketsNoProduct = await Ticket.countDocuments({ productId: { $exists: false } });
    const ticketsNoCategory = await Ticket.countDocuments({ categoryId: { $exists: false } });

    console.log(`   Tickets without Priority: ${ticketsNoPriority}`);
    console.log(`   Tickets without Severity: ${ticketsNoSeverity}`);
    console.log(`   Tickets without Product: ${ticketsNoProduct}`);
    console.log(`   Tickets without Category: ${ticketsNoCategory}`);

    if (ticketsNoPriority === 0 && ticketsNoSeverity === 0 && ticketsNoProduct === 0 && ticketsNoCategory === 0) {
      console.log('   ✅ All tickets have required data!');
    } else {
      console.log('   ⚠️ Some tickets are missing required data');
    }

    console.log('\n🎉 Analysis completed!');
    
  } catch (error) {
    console.error('❌ Error analyzing ticket system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

analyzeTicketSystem();