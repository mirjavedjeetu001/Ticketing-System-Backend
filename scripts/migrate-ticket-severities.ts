import 'dotenv/config';
import mongoose from 'mongoose';
import { Ticket } from '../src/modules/tickets/ticket.model';
import { Severity } from '../src/modules/system-settings/severity.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function migrateTicketSeverities() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all severity levels
    const severities = await Severity.find({ isActive: true }).sort({ level: 1 });
    console.log(`📊 Found ${severities.length} severity levels`);

    if (severities.length === 0) {
      console.log('⚠️ No severity levels found. Please run seed-severities script first.');
      return;
    }

    // Create mapping from legacy severity to new severityId
    const severityMapping: { [key: string]: string } = {
      'critical': severities.find(s => s.level === 1)?._id?.toString() || '', // S1
      'high': severities.find(s => s.level === 2)?._id?.toString() || '', // S2
      'medium': severities.find(s => s.level === 3)?._id?.toString() || '', // S3
      'low': severities.find(s => s.level === 4)?._id?.toString() || '' // S4
    };

    console.log('🔄 Severity mapping:', severityMapping);

    // Find all tickets that have legacy severity but no severityId
    const ticketsToMigrate = await Ticket.find({
      severity: { $in: ['critical', 'high', 'medium', 'low'] },
      severityId: null
    });

    console.log(`🎫 Found ${ticketsToMigrate.length} tickets to migrate`);

    if (ticketsToMigrate.length === 0) {
      console.log('✅ No tickets need migration. All tickets already have severityId or no tickets exist.');
      return;
    }

    // Update tickets
    let migratedCount = 0;
    for (const ticket of ticketsToMigrate) {
      const newSeverityId = severityMapping[ticket.severity];
      if (newSeverityId) {
        await Ticket.findByIdAndUpdate(ticket._id, {
          severityId: newSeverityId
        });
        migratedCount++;
        console.log(`✅ Migrated ticket ${ticket.ticketId || ticket._id} from '${ticket.severity}' to severity level`);
      } else {
        console.log(`⚠️ Could not map severity '${ticket.severity}' for ticket ${ticket.ticketId || ticket._id}`);
      }
    }

    console.log(`🎉 Migration completed! Updated ${migratedCount} tickets`);
    
  } catch (error) {
    console.error('❌ Error migrating ticket severities:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

migrateTicketSeverities();