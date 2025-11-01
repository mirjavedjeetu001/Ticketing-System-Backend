import { Router } from 'express';
import { UserController } from './user.controller';
import { auth } from '../../common/middleware/auth';
import { requireAdmin, requireAgentOrAdmin, requirePermission } from '../../common/middleware/roles';
import { body } from 'express-validator';

const router = Router();

// Validation middleware
const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
];

const updatePasswordValidation = [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Apply authentication to all routes
router.use(auth);

// Basic CRUD routes
router.post('/', requirePermission('canManageUsers'), createUserValidation, UserController.create);
router.get('/', UserController.list); // All authenticated users can view user list
router.get('/:id', UserController.getById); // All authenticated users can view user details
router.put('/:id', requirePermission('canManageUsers'), UserController.update);
router.delete('/:id', requirePermission('canManageUsers'), UserController.delete);

// Password management
router.put('/:id/password', requirePermission('canManageUsers'), updatePasswordValidation, UserController.updatePassword);

// Department/Product filtering
router.get('/department/:departmentId', UserController.getByDepartment);
router.get('/product/:productId', UserController.getByProduct);

// New hierarchical management endpoints
router.patch('/:id/role', requirePermission('canManageUsers'), UserController.updateRole);
router.patch('/:id/permissions', requirePermission('canManageUsers'), UserController.updatePermissions);
router.patch('/:id/toggle-status', requirePermission('canManageUsers'), UserController.toggleStatus);

// Assignment endpoints
router.patch('/:id/assign/company', requirePermission('canManageCompany'), UserController.assignCompany);
router.patch('/:id/assign/business-unit', requirePermission('canManageBusinessUnits'), UserController.assignBusinessUnit);
router.patch('/:id/assign/department', requirePermission('canManageDepartments'), UserController.assignDepartment);
router.patch('/:id/assign/team', requirePermission('canManageTeams'), UserController.assignTeam);

// Hierarchical filtering
router.get('/company/:companyId', UserController.getByCompany);
router.get('/business-unit/:businessUnitId', UserController.getByBusinessUnit);
router.get('/team/:teamId', UserController.getByTeam);

export default router;
