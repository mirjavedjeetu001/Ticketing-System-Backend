import express from 'express';
import { TeamController } from './team.controller';
import { auth } from '../../common/middleware/auth';
import { requirePermission } from '../../common/middleware/roles';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create team (requires permission)
router.post('/', requirePermission('canManageTeams'), TeamController.create);

// Get all teams
router.get('/', TeamController.getAll);

// Get teams by department
router.get('/department/:departmentId', TeamController.getByDepartment);

// Get single team
router.get('/:id', TeamController.getById);

// Update team (requires permission)
router.put('/:id', requirePermission('canManageTeams'), TeamController.update);

// Delete team (requires permission)
router.delete('/:id', requirePermission('canManageTeams'), TeamController.delete);

// Toggle team status (requires permission)
router.patch('/:id/toggle-status', requirePermission('canManageTeams'), TeamController.toggleStatus);

// Add team member (requires permission)
router.post('/:id/members', requirePermission('canManageTeams'), TeamController.addMember);

// Remove team member (requires permission)
router.delete('/:id/members/:userId', requirePermission('canManageTeams'), TeamController.removeMember);

export default router;
