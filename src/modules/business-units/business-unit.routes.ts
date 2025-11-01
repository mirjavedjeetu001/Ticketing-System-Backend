import express from 'express';
import { BusinessUnitController } from './business-unit.controller';
import { auth } from '../../common/middleware/auth';
import { requirePermission } from '../../common/middleware/roles';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create business unit (requires permission)
router.post('/', requirePermission('canManageBusinessUnits'), BusinessUnitController.create);

// Get all business units
router.get('/', BusinessUnitController.getAll);

// Get business units by company
router.get('/company/:companyId', BusinessUnitController.getByCompany);

// Get single business unit
router.get('/:id', BusinessUnitController.getById);

// Update business unit (requires permission)
router.put('/:id', requirePermission('canManageBusinessUnits'), BusinessUnitController.update);

// Delete business unit (requires permission)
router.delete('/:id', requirePermission('canManageBusinessUnits'), BusinessUnitController.delete);

// Toggle business unit status (requires permission)
router.patch('/:id/toggle-status', requirePermission('canManageBusinessUnits'), BusinessUnitController.toggleStatus);

export default router;
