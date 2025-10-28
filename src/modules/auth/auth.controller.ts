import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../users/user.service';
import { AuthenticationError, ValidationError } from '../../common/errors/AppError';
import { config } from '../../config';
import { AuthRequest } from '../../common/middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, role, department } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        throw new ValidationError('Email, password, first name, and last name are required');
      }

      // Validate password strength
      if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }

      // Create user
      const user = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        role,
        department,
      });

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Get user by email (including password)
      const user = await UserService.getUserByEmail(email);
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Update last login
      await UserService.updateLastLogin(user._id);

      // Generate token
      const token = jwt.sign(
        { userId: user._id },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
      );

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            lastLogin: new Date(),
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      res.json({
        success: true,
        data: {
          user: {
            id: req.user._id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            fullName: req.user.fullName,
            role: req.user.role,
            department: req.user.department,
            isActive: req.user.isActive,
            lastLogin: req.user.lastLogin,
            createdAt: req.user.createdAt,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const { firstName, lastName, department } = req.body;

      // Update user
      const updatedUser = await UserService.updateUser(req.user._id, {
        firstName,
        lastName,
        department,
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            fullName: updatedUser.fullName,
            role: updatedUser.role,
            department: updatedUser.department,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const { currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword) {
        throw new ValidationError('Current password and new password are required');
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        throw new ValidationError('New password must be at least 6 characters long');
      }

      // Get user with password
      const user = await UserService.getUserByEmail(req.user.email);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Update password
      await UserService.updatePassword(user._id, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      // Generate new token
      const token = jwt.sign(
        { userId: req.user._id },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
      );

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: { token },
      });
    } catch (error) {
      next(error);
    }
  }
}