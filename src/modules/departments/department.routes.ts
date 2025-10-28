import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { auth } from '../../common/middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Department CRUD routes
router.get('/', DepartmentController.list);
router.get('/:id', DepartmentController.getById);
router.post('/', DepartmentController.create);
router.put('/:id', DepartmentController.update);
router.delete('/:id', DepartmentController.delete);

// Member management routes
router.post('/:id/members', DepartmentController.addMember);
router.delete('/:id/members/:userId', DepartmentController.removeMember);

export default router;