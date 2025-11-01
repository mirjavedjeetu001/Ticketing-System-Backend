import { Router } from 'express';
import { TicketController } from './ticket.controller';
import { auth } from '../../common/middleware/auth';
import { requireAgentOrAdmin } from '../../common/middleware/roles';
import { upload } from '../../config/multer';

const router = Router();

// Attachment route (serve files from MongoDB) - No auth required for viewing attachments
router.get('/attachments/:filename', TicketController.getAttachment);

// All other ticket routes require authentication
router.use(auth);

// Public ticket routes (all authenticated users)
router.get('/', TicketController.list);
router.post('/', upload.array('attachments', 5), TicketController.create); // Allow up to 5 files
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
router.post('/:id/comments', upload.array('attachments', 5), TicketController.addComment); // Allow up to 5 files per comment

export default router;