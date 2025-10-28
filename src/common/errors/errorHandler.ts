import { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';
import { logger } from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle operational errors (AppError instances)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${message}`,
    });
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }

  // Handle duplicate key errors (MongoDB)
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // Log unexpected errors
  logger.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Send generic error response for unexpected errors
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}