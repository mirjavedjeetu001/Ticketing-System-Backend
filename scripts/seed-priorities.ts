import 'dotenv/config';
import mongoose from 'mongoose';
import { Priority } from '../src/modules/system-settings/priority.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function seedPriorities() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing priorities
    await Priority.deleteMany({});
    console.log('🧹 Cleared existing priorities');

    // Create default priority levels
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

    const createdPriorities = await Priority.insertMany(priorities);
    console.log(`✅ Created ${createdPriorities.length} priority levels:`);
    
    createdPriorities.forEach(priority => {
      console.log(`   - ${priority.name} (Level ${priority.level}): ${priority.description}`);
    });

    console.log('🎉 Priorities seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding priorities:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedPriorities();