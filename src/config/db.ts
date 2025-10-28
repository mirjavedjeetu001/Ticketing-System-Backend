import mongoose from 'mongoose';
import { logger } from '../common/logger';

export async function connectDB(uri: string): Promise<void> {
  if (!uri) {
    throw new Error('MONGO_URI is required');
  }

  try {
    logger.info(`🔗 Attempting to connect to MongoDB Atlas...`);
    logger.info(`📍 Connection URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    
    // Extract hostname for debugging
    const hostnameMatch = uri.match(/@([^/]+)/);
    if (hostnameMatch) {
      logger.info(`🌐 Cluster hostname: ${hostnameMatch[1]}`);
    }
    
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000, // Shorter timeout to fail fast
      socketTimeoutMS: 10000,
      connectTimeoutMS: 5000,
      retryWrites: true,
      family: 4 // Use IPv4
    };

    await mongoose.connect(uri, options);
    logger.info('✅ MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:');
    console.error('Raw error:', error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      const errorMsg = error.message || '';
      logger.error(`❌ MongoDB connection failed: ${error.name} - ${errorMsg}`);
      
      if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo ENOTFOUND')) {
        logger.error('💡 DNS resolution failed - the MongoDB cluster hostname cannot be found');
        logger.error('   This usually means the cluster is paused or deleted');
        logger.error('   Please check your MongoDB Atlas dashboard');
      } else if (errorMsg.includes('authentication') || errorMsg.includes('auth')) {
        logger.error('💡 Authentication failed - wrong username/password');
      } else if (errorMsg.includes('IP') || errorMsg.includes('not authorized')) {
        logger.error('💡 IP not whitelisted in MongoDB Atlas');
      } else if (errorMsg.includes('timeout')) {
        logger.error('💡 Connection timeout - network or cluster issue');
      } else {
        logger.error('💡 Unknown MongoDB error - check your connection string');
      }
    } else {
      console.error('Non-Error object:', typeof error, error);
      logger.error('❌ Unknown error connecting to MongoDB');
    }
    throw error;
  }
}