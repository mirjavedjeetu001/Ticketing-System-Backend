import 'dotenv/config';
import { connectDB } from '../src/config/db';
import { User } from '../src/modules/users/user.model';

async function createAdminUser() {
  try {
    await connectDB(process.env.MONGO_URI!);
    console.log('📊 Connected to MongoDB');

    // Clear any existing data first
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});

    // Create clean admin user
    const adminUser = new User({
      email: 'admin@shebapulse.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@shebapulse.com');
    console.log('� Password: admin123');
    console.log('');
    console.log('🎯 You can now login and create users, departments, products, and tickets through the UI');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();