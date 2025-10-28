import 'dotenv/config';
import app from './app';
import { connectDB } from './config/db';
import { logger } from './common/logger';

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {
    // Connect to database
    await connectDB(process.env.MONGO_URI!);
    
    // Start server on all network interfaces (0.0.0.0)
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌐 Accessible on network at http://0.0.0.0:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();