import { Router } from 'express';
import { FeatureController } from './feature.controller';
import { auth } from '../../common/middleware/auth';

const router = Router();

// Get all features
router.get('/', auth, FeatureController.getFeatures);

// Get features by product ID
router.get('/product/:productId', auth, FeatureController.getFeaturesByProduct);

// Get feature by ID
router.get('/:id', auth, FeatureController.getFeatureById);

// Create new feature
router.post('/', auth, FeatureController.createFeature);

// Update feature
router.put('/:id', auth, FeatureController.updateFeature);

// Delete feature
router.delete('/:id', auth, FeatureController.deleteFeature);

export default router;