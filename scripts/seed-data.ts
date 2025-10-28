import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from '../src/modules/products/product.model';
import { IssueCategory } from '../src/modules/categories/category.model';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse';

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await IssueCategory.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create sample products
    const products = [
      {
        name: 'Web Application',
        description: 'Main web application and website issues',
        category: 'Software',
        departments: ['Engineering', 'QA', 'Product'],
        icon: 'Globe',
        color: '#3b82f6'
      },
      {
        name: 'Mobile App',
        description: 'iOS and Android mobile application',
        category: 'Software',
        departments: ['Engineering', 'QA', 'Product'],
        icon: 'Smartphone',
        color: '#10b981'
      },
      {
        name: 'API Services',
        description: 'Backend API and microservices',
        category: 'Infrastructure',
        departments: ['Engineering', 'DevOps'],
        icon: 'Server',
        color: '#f59e0b'
      },
      {
        name: 'Customer Support',
        description: 'Customer service and support issues',
        category: 'Support',
        departments: ['Support', 'Customer Success'],
        icon: 'Headphones',
        color: '#8b5cf6'
      },
      {
        name: 'Payment System',
        description: 'Payment processing and billing',
        category: 'Finance',
        departments: ['Finance', 'Engineering'],
        icon: 'CreditCard',
        color: '#ef4444'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`✅ Created ${createdProducts.length} products`);

    // Create categories for each product
    const categories = [
      // Web Application categories
      {
        name: 'Bug Report',
        description: 'Functional bugs and issues',
        productId: createdProducts[0]._id,
        defaultSeverity: 'medium' as const,
        color: '#ef4444'
      },
      {
        name: 'Feature Request',
        description: 'New feature requests',
        productId: createdProducts[0]._id,
        defaultSeverity: 'low' as const,
        slaHours: { low: 168, medium: 120, high: 72, critical: 24 },
        color: '#10b981'
      },
      {
        name: 'Performance Issue',
        description: 'Performance and speed related issues',
        productId: createdProducts[0]._id,
        defaultSeverity: 'high' as const,
        slaHours: { low: 48, medium: 24, high: 12, critical: 4 },
        color: '#f59e0b'
      },
      
      // Mobile App categories
      {
        name: 'Crash Report',
        description: 'App crashes and stability issues',
        productId: createdProducts[1]._id,
        defaultSeverity: 'critical' as const,
        slaHours: { low: 24, medium: 12, high: 6, critical: 2 },
        color: '#dc2626'
      },
      {
        name: 'UI/UX Issue',
        description: 'User interface and experience problems',
        productId: createdProducts[1]._id,
        defaultSeverity: 'medium' as const,
        color: '#8b5cf6'
      },
      
      // API Services categories
      {
        name: 'Service Outage',
        description: 'API service downtime or unavailability',
        productId: createdProducts[2]._id,
        defaultSeverity: 'critical' as const,
        slaHours: { low: 12, medium: 6, high: 2, critical: 1 },
        color: '#dc2626'
      },
      {
        name: 'Integration Issue',
        description: 'Third-party integration problems',
        productId: createdProducts[2]._id,
        defaultSeverity: 'high' as const,
        color: '#f59e0b'
      },
      
      // Customer Support categories
      {
        name: 'Account Issue',
        description: 'Customer account related problems',
        productId: createdProducts[3]._id,
        defaultSeverity: 'medium' as const,
        slaHours: { low: 48, medium: 24, high: 8, critical: 4 },
        color: '#3b82f6'
      },
      {
        name: 'Billing Inquiry',
        description: 'Billing and payment questions',
        productId: createdProducts[3]._id,
        defaultSeverity: 'medium' as const,
        color: '#10b981'
      },
      
      // Payment System categories
      {
        name: 'Payment Failure',
        description: 'Failed payment transactions',
        productId: createdProducts[4]._id,
        defaultSeverity: 'high' as const,
        slaHours: { low: 24, medium: 12, high: 4, critical: 2 },
        color: '#dc2626'
      },
      {
        name: 'Refund Request',
        description: 'Customer refund requests',
        productId: createdProducts[4]._id,
        defaultSeverity: 'medium' as const,
        slaHours: { low: 72, medium: 48, high: 24, critical: 12 },
        color: '#f59e0b'
      }
    ];

    const createdCategories = await IssueCategory.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);

    console.log('🎉 Sample data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

seedData();