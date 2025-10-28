import { Router } from 'express';
import { AuthController } from './auth.controller';
import { auth } from '../../common/middleware/auth';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.post('/change-password', auth, AuthController.changePassword);
router.post('/refresh-token', auth, AuthController.refreshToken);

export default router;