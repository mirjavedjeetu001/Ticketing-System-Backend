import { Router } from 'express';
import { CompanyController } from './company.controller';
import { auth } from '../../common/middleware/auth';
import { requirePermission } from '../../common/middleware/roles';

const router = Router();

// All routes require authentication
router.use(auth);

// Company routes
router.post('/', requirePermission('canManageCompany'), CompanyController.create);
router.get('/', CompanyController.getAll);
router.get('/:id', CompanyController.getById);
router.put('/:id', requirePermission('canManageCompany'), CompanyController.update);
router.delete('/:id', requirePermission('canManageCompany'), CompanyController.delete);
router.patch('/:id/toggle-status', requirePermission('canManageCompany'), CompanyController.toggleStatus);

export default router;
