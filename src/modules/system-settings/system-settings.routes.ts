import { Router } from 'express';
import { SeverityController } from './severity.controller';
import { PriorityController } from './priority.controller';
import { SLAController } from './sla.controller';
import { auth } from '../../common/middleware/auth';
import { requireAdmin } from '../../common/middleware/roles';

const router = Router();

// Initialize controllers
const severityController = new SeverityController();
const priorityController = new PriorityController();
const slaController = new SLAController();

// Apply authentication and admin middleware to all routes
router.use(auth);
router.use(requireAdmin);

// System overview route
router.get('/overview', slaController.getSystemOverview);

// Severity routes
router.get('/severities', severityController.getSeverities);
router.get('/severities/:id', severityController.getSeverityById);
router.post('/severities', severityController.createSeverity);
router.put('/severities/:id', severityController.updateSeverity);
router.delete('/severities/:id', severityController.deleteSeverity);

// Priority routes
router.get('/priorities', priorityController.getPriorities);
router.get('/priorities/:id', priorityController.getPriorityById);
router.post('/priorities', priorityController.createPriority);
router.put('/priorities/:id', priorityController.updatePriority);
router.delete('/priorities/:id', priorityController.deletePriority);

// SLA rules routes
router.get('/sla-rules', slaController.getSLARules);
router.get('/sla-rules/:id', slaController.getSLARuleById);
router.post('/sla-rules', slaController.createSLARule);
router.put('/sla-rules/:id', slaController.updateSLARule);
router.delete('/sla-rules/:id', slaController.deleteSLARule);

export default router;