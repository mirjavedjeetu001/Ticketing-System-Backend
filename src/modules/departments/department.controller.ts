import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';
import { AuthRequest } from '../../common/middleware/auth';
import { ValidationError } from '../../common/errors/AppError';

export class DepartmentController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new ValidationError('Admin access required');
      }

      const { name, description, members, head } = req.body;

      if (!name) {
        throw new ValidationError('Department name is required');
      }

      const department = await DepartmentService.createDepartment({
        name,
        description,
        members,
        head,
      });

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await DepartmentService.listDepartments();

      res.json({
        success: true,
        data: { departments },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await DepartmentService.getDepartmentById(id);

      res.json({
        success: true,
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new ValidationError('Admin access required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const department = await DepartmentService.updateDepartment(id, updateData);

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new ValidationError('Admin access required');
      }

      const { id } = req.params;
      await DepartmentService.deleteDepartment(id);

      res.json({
        success: true,
        message: 'Department deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new ValidationError('Admin access required');
      }

      const { id } = req.params;
      const { userId } = req.body;

      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const department = await DepartmentService.addMemberToDepartment(id, userId);

      res.json({
        success: true,
        message: 'Member added to department successfully',
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.role !== 'admin') {
        throw new ValidationError('Admin access required');
      }

      const { id, userId } = req.params;

      const department = await DepartmentService.removeMemberFromDepartment(id, userId);

      res.json({
        success: true,
        message: 'Member removed from department successfully',
        data: { department },
      });
    } catch (error) {
      next(error);
    }
  }
}