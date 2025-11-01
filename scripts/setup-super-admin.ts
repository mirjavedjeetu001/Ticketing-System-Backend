import mongoose from 'mongoose';
import { User } from '../src/modules/users/user.model';
import { Company } from '../src/modules/companies/company.model';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const setupSuperAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Step 1: Clear all existing users
    console.log('\n🗑️  Removing all existing users...');
    const deletedCount = await User.deleteMany({});
    console.log(`✅ Deleted ${deletedCount.deletedCount} users`);

    // Step 2: Create or get default company
    console.log('\n🏢 Setting up default company...');
    let company = await Company.findOne({ shortName: 'SPL' });
    
    if (!company) {
      company = await Company.create({
        name: 'Sheba Platform Ltd',
        shortName: 'SPL',
        website: 'https://www.sheba.xyz',
        email: 'contact@sheba.xyz',
        settings: {
          allowUserRegistration: true,
          requireEmailVerification: false,
          slaEnabled: true
        },
        isActive: true
      });
      console.log('✅ Created default company: Sheba Platform Ltd');
    } else {
      console.log('✅ Using existing company: Sheba Platform Ltd');
    }

    // Step 3: Create super admin user
    console.log('\n👤 Creating super admin user...');
    
    // Pass plain password - the User model's pre-save hook will hash it
    const superAdmin = await User.create({
      email: 'javed@iamsheba.xyz',
      password: '123456',
      firstName: 'Javed',
      lastName: 'Admin',
      role: 'super_admin',
      companyId: company._id,
      phone: '+880 1234-567890',
      isActive: true,
      isEmailVerified: true,
      permissions: {
        canCreateTickets: true,
        canViewAllTickets: true,
        canAssignTickets: true,
        canCloseTickets: true,
        canDeleteTickets: true,
        canManageUsers: true,
        canManageTeams: true,
        canManageDepartments: true,
        canManageBusinessUnits: true,
        canManageCompany: true,
        canViewReports: true,
        canExportData: true
      }
    });

    console.log('✅ Super admin created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Email:    ${superAdmin.email}`);
    console.log(`   Password: 123456`);
    console.log(`   Role:     ${superAdmin.role}`);
    console.log(`   Name:     ${superAdmin.firstName} ${superAdmin.lastName}`);
    console.log(`   Company:  ${company.name} (${company.shortName})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n✨ Setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Login with the credentials above');
    console.log('   3. Create Business Units (SSL, SFL, SML, SBE, SBC, Tech)');
    console.log('   4. Create Departments under Business Units');
    console.log('   5. Create Teams under Departments');
    console.log('   6. Add users and assign them to teams');
    console.log('');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the setup
setupSuperAdmin();
