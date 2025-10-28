import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import ticketRoutes from '../modules/tickets/ticket.routes';
import productRoutes from '../modules/products/product.routes';
import categoryRoutes from '../modules/categories/category.routes';
import departmentRoutes from '../modules/departments/department.routes';
import systemSettingsRoutes from '../modules/system-settings/system-settings.routes';
import featureRoutes from '../modules/features/feature.routes';

const router = Router();

// Health check route for API
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tickets', ticketRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/departments', departmentRoutes);
router.use('/system-settings', systemSettingsRoutes);
router.use('/features', featureRoutes);

export default router;