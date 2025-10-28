import 'dotenv/config';
import mongoose from 'mongoose';
import { Severity } from '../src/modules/system-settings/severity.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function seedSeverities() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing severities
    await Severity.deleteMany({});
    console.log('🧹 Cleared existing severities');

    // Create default severity levels
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

    const createdSeverities = await Severity.insertMany(severities);
    console.log(`✅ Created ${createdSeverities.length} severity levels:`);
    
    createdSeverities.forEach(severity => {
      console.log(`   - ${severity.name} (Level ${severity.level}): ${severity.description}`);
    });

    console.log('🎉 Severities seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding severities:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedSeverities();