import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { auth, AuthRequest } from '../../common/middleware/auth';
import { requireAdmin, requireAgentOrAdmin } from '../../common/middleware/roles';
import { NotFoundError, ValidationError } from '../../common/errors/AppError';
import { body, validationResult } from 'express-validator';
import { User } from './user.model';

const router = Router();

class UserController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const {
        email,
        password,
        firstName,
        lastName,
        role,
        department
      } = req.body;

      const user = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        role: role || 'user',
        department
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
        isActive: isActive === 'true',
        search: search as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
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
      const { id } = req.params;
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
      const { id } = req.params;
      const updateData = req.body;

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
      const { id } = req.params;
      await UserService.deleteUser(id);

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAgents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { department } = req.query;
      const agents = await UserService.getAgents(department as string);

      res.json({
        success: true,
        data: { agents },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { id } = req.params;
      const { password } = req.body;

      await UserService.updatePassword(id, password);

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsersByDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
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

  static async getUsersByProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
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
}

// Validation middleware
const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').optional().isIn(['admin', 'agent', 'user']).withMessage('Invalid role'),
];

const updatePasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Routes
router.post('/', auth, requireAdmin, createUserValidation, UserController.create);
router.get('/', auth, requireAgentOrAdmin, UserController.list);
router.get('/agents', auth, requireAgentOrAdmin, UserController.getAgents);
router.get('/department/:departmentId', auth, requireAgentOrAdmin, UserController.getUsersByDepartment);
router.get('/product/:productId', auth, requireAgentOrAdmin, UserController.getUsersByProduct);
router.get('/:id', auth, requireAgentOrAdmin, UserController.getById);
router.put('/:id', auth, requireAdmin, UserController.update);
router.put('/:id/password', auth, requireAdmin, updatePasswordValidation, UserController.updatePassword);
router.delete('/:id', auth, requireAdmin, UserController.delete);

export default router;