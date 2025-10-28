import 'dotenv/config';
import mongoose from 'mongoose';
import { Severity } from '../src/modules/system-settings/severity.model';
import { Priority } from '../src/modules/system-settings/priority.model';
import { Ticket } from '../src/modules/tickets/ticket.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function setupSystemSettings() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Setup Severities
    console.log('\n🔧 Setting up Severity Levels...');
    const existingSeverities = await Severity.find();
    if (existingSeverities.length === 0) {
      const severities = [
        {
          name: 'S1',
          level: 1,
          description: 'Critical - System down, complete business stoppage',
          color: '#ef4444', // Red
          isActive: true
        },
        {
          name: 'S2',
          level: 2,
          description: 'High - Major functionality impaired, business significantly affected',
          color: '#f97316', // Orange
          isActive: true
        },
        {
          name: 'S3',
          level: 3,
          description: 'Medium - Minor functionality issues, workarounds available',
          color: '#f59e0b', // Yellow
          isActive: true
        },
        {
          name: 'S4',
          level: 4,
          description: 'Low - Cosmetic issues, minor inconveniences',
          color: '#10b981', // Green
          isActive: true
        }
      ];
      await Severity.insertMany(severities);
      console.log('✅ Created 4 severity levels');
    } else {
      console.log(`✅ Found ${existingSeverities.length} existing severity levels`);
    }

    // Setup Priorities
    console.log('\n🎯 Setting up Priority Levels...');
    const existingPriorities = await Priority.find();
    if (existingPriorities.length === 0) {
      const priorities = [
        {
          name: 'P1',
          level: 1,
          description: 'Critical - Immediate action required, escalate to senior management',
          color: '#dc2626', // Dark Red
          isActive: true
        },
        {
          name: 'P2',
          level: 2,
          description: 'High - Urgent attention needed, assign experienced team',
          color: '#ea580c', // Orange Red
          isActive: true
        },
        {
          name: 'P3',
          level: 3,
          description: 'Medium - Normal priority, follow standard process',
          color: '#d97706', // Orange
          isActive: true
        },
        {
          name: 'P4',
          level: 4,
          description: 'Low - Can be addressed in next available slot',
          color: '#059669', // Green
          isActive: true
        }
      ];
      await Priority.insertMany(priorities);
      console.log('✅ Created 4 priority levels');
    } else {
      console.log(`✅ Found ${existingPriorities.length} existing priority levels`);
    }

    // Check tickets for migration needs
    console.log('\n🎫 Checking tickets for migration...');
    const legacyTickets = await Ticket.find({
      severity: { $in: ['critical', 'high', 'medium', 'low'] },
      severityId: null
    });

    if (legacyTickets.length > 0) {
      console.log(`⚠️ Found ${legacyTickets.length} tickets using legacy severity field`);
      console.log('💡 Run the migrate-ticket-severities.ts script to update them');
    } else {
      console.log('✅ All tickets are using the new severity system');
    }

    // Display current system status
    console.log('\n📊 System Status:');
    const activeSeverities = await Severity.find({ isActive: true }).sort({ level: 1 });
    const activePriorities = await Priority.find({ isActive: true }).sort({ level: 1 });
    const totalTickets = await Ticket.countDocuments();

    console.log(`   Severities: ${activeSeverities.length}`);
    activeSeverities.forEach(s => console.log(`     - ${s.name} (Level ${s.level}): ${s.description}`));
    
    console.log(`   Priorities: ${activePriorities.length}`);
    activePriorities.forEach(p => console.log(`     - ${p.name} (Level ${p.level}): ${p.description}`));
    
    console.log(`   Total Tickets: ${totalTickets}`);

    console.log('\n🎉 System setup completed successfully!');
    console.log('💡 The All Tickets page will now display proper severity levels (S1, S2, S3, S4) instead of legacy values');
    
  } catch (error) {
    console.error('❌ Error setting up system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

setupSystemSettings();