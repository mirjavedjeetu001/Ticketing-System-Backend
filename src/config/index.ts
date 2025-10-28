export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/sheba_pulse',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'),
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  logLevel: process.env.LOG_LEVEL || 'info',
};