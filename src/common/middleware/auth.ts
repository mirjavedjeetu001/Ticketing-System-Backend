import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AuthenticationError, AuthorizationError } from '../errors/AppError';
import { User, IUser } from '../../modules/users/user.model';

export interface AuthRequest extends Request {
  user?: IUser;
  body: any;
  params: any;
  query: any;
  headers: any;
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid token');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return next(error);
    }
    
    // Handle JWT specific errors
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError('Invalid token'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Token expired'));
    }
    
    next(error);
  }
};

// Optional auth middleware (doesn't throw error if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
    
    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Ignore auth errors in optional auth
    next();
  }
};