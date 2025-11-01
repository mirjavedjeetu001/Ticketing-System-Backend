import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { auth } from '../../common/middleware/auth';
import { requirePermission } from '../../common/middleware/roles';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Department CRUD routes
router.get('/', DepartmentController.list);
router.get('/business-unit/:businessUnitId', DepartmentController.getByBusinessUnit);
router.get('/:id', DepartmentController.getById);
router.post('/', requirePermission('canManageDepartments'), DepartmentController.create);
router.put('/:id', requirePermission('canManageDepartments'), DepartmentController.update);
router.delete('/:id', requirePermission('canManageDepartments'), DepartmentController.delete);
router.patch('/:id/toggle-status', requirePermission('canManageDepartments'), DepartmentController.toggleStatus);

// Member management routes
router.post('/:id/members', requirePermission('canManageDepartments'), DepartmentController.addMember);
router.delete('/:id/members/:userId', requirePermission('canManageDepartments'), DepartmentController.removeMember);

export default router;