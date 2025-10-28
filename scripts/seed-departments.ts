import 'dotenv/config';
import mongoose from 'mongoose';
import { Department } from '../src/modules/departments/department.model';
import { User } from '../src/modules/users/user.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function seedDepartments() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing departments
    await Department.deleteMany({});
    console.log('🧹 Cleared existing departments');

    // Create departments
    const departments = [
      {
        name: 'SOC',
        description: 'Security Operations Center - Handles security incidents and monitoring',
      },
      {
        name: 'Developer',
        description: 'Software Development Team - Handles bugs, features, and technical issues',
      },
      {
        name: 'DevOps',
        description: 'Development Operations - Handles infrastructure, deployment, and system issues',
      },
      {
        name: 'Product Manager',
        description: 'Product Management Team - Handles feature requests and product decisions',
      },
      {
        name: 'QA',
        description: 'Quality Assurance Team - Handles testing and quality issues',
      },
      {
        name: 'Support',
        description: 'Customer Support Team - Handles customer-related issues',
      },
      {
        name: 'Business',
        description: 'Business Team - Handles business logic and process issues',
      },
      {
        name: 'Design',
        description: 'Design Team - Handles UI/UX and design-related issues',
      }
    ];

    const createdDepartments = await Department.insertMany(departments);
    console.log(`✅ Created ${createdDepartments.length} departments`);

    // Display summary
    console.log('\n📋 Created Departments:');
    createdDepartments.forEach(dept => {
      console.log(`  • ${dept.name}: ${dept.description}`);
    });

    console.log('\n🎉 Departments seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding departments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedDepartments();