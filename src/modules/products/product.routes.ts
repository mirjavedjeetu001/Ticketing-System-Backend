import { Router } from 'express';
import { ProductController } from './product.controller';
import { auth } from '../../common/middleware/auth';
import { requireRole } from '../../common/middleware/roles';

const router = Router();

// Public routes (with auth)
router.get('/my-products', auth, ProductController.getMyProducts);
router.get('/categories', auth, ProductController.getCategories);
router.get('/', auth, ProductController.getProducts);
router.get('/:id', auth, ProductController.getProduct);

// Admin only routes (super_admin and admin)
router.post('/', auth, requireRole(['super_admin', 'admin']), ProductController.createProduct);
router.put('/:id', auth, requireRole(['super_admin', 'admin']), ProductController.updateProduct);
router.delete('/:id', auth, requireRole(['super_admin', 'admin']), ProductController.deleteProduct);

export default router;