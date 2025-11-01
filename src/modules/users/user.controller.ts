import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AuthRequest } from '../../common/middleware/auth';
import { ValidationError } from '../../common/errors/AppError';

// Helper function to check if user is admin or super admin
const isAdminOrSuperAdmin = (role: string): boolean => {
  return role === 'super_admin' || role === 'admin';
};

export class UserController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      // Only admins and super admins can create users
      if (!isAdminOrSuperAdmin(req.user.role)) {
        throw new ValidationError('Only admins can create users');
      }

      const {
        email,
        password,
        firstName,
        lastName,
        role,
        department,
        departmentId,
        productAccess
      } = req.body;

      if (!email || !password || !firstName || !lastName) {
        throw new ValidationError('Email, password, first name, and last name are required');
      }

      const user = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        role: role || 'user',
        department,
        departmentId,
        productAccess
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      // All authenticated users can list users (needed for ticket assignment, mentions, etc.)
      // Admins see all users, regular users see users in their scope

      const {
        role,
        department,
        isActive,
        search,
        page = '1',
        limit = '50'
      } = req.query;

      const result = await UserService.listUsers({
        role: role as string,
        department: department as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;

      // Users can only view their own profile, admins can view any
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user._id !== id) {
        throw new ValidationError('Not authorized to view this user');
      }

      const user = await UserService.getUserById(id);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      let updateData = req.body;

      // Users can update their own profile (limited fields), admins can update any
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user._id !== id) {
        throw new ValidationError('Not authorized to update this user');
      }

      // Non-admins can only update certain fields
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        const allowedFields = ['firstName', 'lastName'];
        const filteredData: any = {};
        allowedFields.forEach(field => {
          if (updateData[field] !== undefined) {
            filteredData[field] = updateData[field];
          }
        });
        updateData = filteredData;
      }

      const user = await UserService.updateUser(id, updateData);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      // Only admins can delete users
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        throw new ValidationError('Only admins can delete users');
      }

      const { id } = req.params;

      // Prevent deleting themselves
      if (req.user._id === id) {
        throw new ValidationError('Cannot delete your own account');
      }

      await UserService.deleteUser(id);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        throw new ValidationError('Password is required');
      }

      // Users can update their own password, admins can update any
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user._id !== id) {
        throw new ValidationError('Not authorized to update this user\'s password');
      }

      await UserService.updatePassword(id, password);

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { departmentId } = req.params;
      const users = await UserService.getUsersByDepartment(departmentId);

      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { productId } = req.params;
      const users = await UserService.getUsersByProductAccess(productId);

      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  // New hierarchical management endpoints
  static async updateRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        throw new ValidationError('Role is required');
      }

      const user = await UserService.updateUserRole(id, role);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePermissions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { permissions } = req.body;

      if (!permissions) {
        throw new ValidationError('Permissions are required');
      }

      const user = await UserService.updateUserPermissions(id, permissions);

      res.json({
        success: true,
        message: 'User permissions updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignCompany(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { companyId } = req.body;

      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }

      const user = await UserService.assignToCompany(id, companyId);

      res.json({
        success: true,
        message: 'User assigned to company successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignBusinessUnit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { businessUnitId } = req.body;

      if (!businessUnitId) {
        throw new ValidationError('Business Unit ID is required');
      }

      const user = await UserService.assignToBusinessUnit(id, businessUnitId);

      res.json({
        success: true,
        message: 'User assigned to business unit successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { departmentId } = req.body;

      if (!departmentId) {
        throw new ValidationError('Department ID is required');
      }

      const user = await UserService.assignToDepartment(id, departmentId);

      res.json({
        success: true,
        message: 'User assigned to department successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignTeam(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { teamId } = req.body;

      const user = await UserService.assignToTeam(id, teamId || null);

      res.json({
        success: true,
        message: teamId ? 'User assigned to team successfully' : 'User removed from team successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.toggleUserStatus(id);

      res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCompany(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId } = req.params;
      const users = await UserService.getUsersByCompany(companyId);

      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByBusinessUnit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { businessUnitId } = req.params;
      const users = await UserService.getUsersByBusinessUnit(businessUnitId);

      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByTeam(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { teamId } = req.params;
      const users = await UserService.getUsersByTeam(teamId);

      res.json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }
}