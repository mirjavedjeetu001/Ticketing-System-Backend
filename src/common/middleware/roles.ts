import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AuthorizationError } from '../errors/AppError';

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }

    // Super admins have all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user has the required permission
    const permissions = req.user.permissions || {};
    if (!permissions[permission as keyof typeof permissions]) {
      return next(new AuthorizationError(`Access denied. Required permission: ${permission}`));
    }

    next();
  };
};

// Role-based authorization middleware
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};

// Admin only middleware (includes super_admin)
export const requireAdmin = requireRole(['super_admin', 'admin']);

// Agent or admin middleware (includes super_admin)
export const requireAgentOrAdmin = requireRole(['super_admin', 'agent', 'admin']);

// Check if user can access resource based on ownership or role
export const requireOwnershipOrRole = (roles: string | string[] = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthorizationError('Authentication required'));
    }

    // Super admins and admins can access everything
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      return next();
    }

    // Check if user has required role
    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Check ownership (user ID in params matches current user)
    const resourceUserId = req.params.userId || req.params.id;
    if (resourceUserId && resourceUserId === req.user._id.toString()) {
      return next();
    }

    return next(new AuthorizationError('Access denied'));
  };
};

// Department-based access (for agents)
export const requireSameDepartmentOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AuthorizationError('Authentication required'));
  }

  // Super admins and admins can access everything
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }

  // For agents, check if they're in the same department as the resource
  // This would typically be used with additional context about the resource
  // For now, we'll just pass through - implement specific logic as needed
  next();
};