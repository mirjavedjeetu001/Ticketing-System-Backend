import { Router } from 'express';
import { CategoryController } from './category.controller';
import { auth } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/roles';

const router = Router();

// Public routes (with auth)
router.get('/', auth, CategoryController.getCategories);
router.get('/feature/:featureId', auth, CategoryController.getCategoriesByFeature);
router.get('/:id', auth, CategoryController.getCategory);

// Admin only routes
router.post('/', auth, requireRole('admin'), CategoryController.createCategory);
router.put('/:id', auth, requireRole('admin'), CategoryController.updateCategory);
router.delete('/:id', auth, requireRole('admin'), CategoryController.deleteCategory);

export default router;