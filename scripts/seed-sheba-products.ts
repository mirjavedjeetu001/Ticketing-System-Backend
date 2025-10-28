import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../src/modules/products/product.model';
import { IssueCategory } from '../src/modules/categories/category.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function seedShebaProducts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await IssueCategory.deleteMany({});
    console.log('🧹 Cleared existing products and categories');

    // Create Sheba products with specific abbreviations
    const products = [
      {
        name: 'Sheba Pay',
        abbreviation: 'SPY',
        description: 'Digital payment solution platform',
        category: 'FinTech',
        departments: ['Engineering', 'QA', 'Product', 'Finance'],
        icon: 'CreditCard',
        color: '#10b981'
      },
      {
        name: 'Sheba XYZ',
        abbreviation: 'SXY',
        description: 'Sheba XYZ service platform',
        category: 'Service',
        departments: ['Engineering', 'QA', 'Product'],
        icon: 'Star',
        color: '#3b82f6'
      },
      {
        name: 'Sheba Manager',
        abbreviation: 'SMG',
        description: 'Management and admin platform',
        category: 'Management',
        departments: ['Engineering', 'QA', 'Product', 'Management'],
        icon: 'Users',
        color: '#8b5cf6'
      },
      {
        name: 'Sheba Business Enterprise',
        abbreviation: 'SBE',
        description: 'Enterprise business solutions',
        category: 'Enterprise',
        departments: ['Engineering', 'QA', 'Product', 'Business'],
        icon: 'Building',
        color: '#f59e0b'
      },
      {
        name: 'Sheba Business Corporate',
        abbreviation: 'SBC',
        description: 'Corporate business solutions',
        category: 'Corporate',
        departments: ['Engineering', 'QA', 'Product', 'Business'],
        icon: 'Building2',
        color: '#ef4444'
      },
      {
        name: 'Digigo',
        abbreviation: 'DGO',
        description: 'Digital platform services',
        category: 'Digital',
        departments: ['Engineering', 'QA', 'Product'],
        icon: 'Smartphone',
        color: '#06b6d4'
      },
      {
        name: 'Pulse',
        abbreviation: 'PLS',
        description: 'Pulse monitoring and analytics',
        category: 'Analytics',
        departments: ['Engineering', 'QA', 'Product', 'Analytics'],
        icon: 'Activity',
        color: '#84cc16'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} Sheba products`);

    // Create common categories for all products
    const categories = [];
    
    for (let i = 0; i < createdProducts.length; i++) {
      const product = createdProducts[i];
      
      // Common categories for each product
      categories.push(
        {
          name: 'Bug Report',
          description: 'Functional bugs and issues',
          productId: product._id,
          defaultSeverity: 'medium' as const,
          slaHours: { low: 72, medium: 48, high: 24, critical: 8 },
          color: '#ef4444'
        },
        {
          name: 'Feature Request',
          description: 'New feature requests and enhancements',
          productId: product._id,
          defaultSeverity: 'low' as const,
          slaHours: { low: 168, medium: 120, high: 72, critical: 24 },
          color: '#10b981'
        },
        {
          name: 'Performance Issue',
          description: 'Performance and speed related problems',
          productId: product._id,
          defaultSeverity: 'high' as const,
          slaHours: { low: 48, medium: 24, high: 12, critical: 4 },
          color: '#f59e0b'
        },
        {
          name: 'Security Issue',
          description: 'Security vulnerabilities and concerns',
          productId: product._id,
          defaultSeverity: 'critical' as const,
          slaHours: { low: 24, medium: 12, high: 6, critical: 2 },
          color: '#dc2626'
        },
        {
          name: 'Integration Issue',
          description: 'Third-party integration problems',
          productId: product._id,
          defaultSeverity: 'medium' as const,
          slaHours: { low: 72, medium: 36, high: 18, critical: 6 },
          color: '#8b5cf6'
        }
      );
    }

    const createdCategories = await IssueCategory.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    console.log('🎉 Sheba products and categories seeded successfully!');
    
    // Display summary
    console.log('\n📋 Created Products:');
    createdProducts.forEach(product => {
      console.log(`  • ${product.name} (${(product as any).abbreviation})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding Sheba products:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedShebaProducts();