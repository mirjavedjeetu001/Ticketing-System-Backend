import { Router } from 'express';
import { TicketController } from './ticket.controller';
import { auth } from '../../common/middleware/auth';
import { requireAgentOrAdmin } from '../../common/middleware/roles';

const router = Router();

// All ticket routes require authentication
router.use(auth);

// Public ticket routes (all authenticated users)
router.get('/', TicketController.list);
router.post('/', TicketController.create);
router.get('/stats', TicketController.getStats);
router.get('/:id', TicketController.getById);
router.put('/:id', TicketController.update);
router.delete('/:id', TicketController.delete);

// Agent/Admin only routes
router.post('/:id/assign', requireAgentOrAdmin, TicketController.assign);

// Resolution and closing routes
router.post('/:id/resolve', TicketController.resolveTicket);
router.post('/:id/close', TicketController.closeTicket);

// Comment routes
router.post('/:id/comments', TicketController.addComment);

export default router;