import { Request, Response, NextFunction } from 'express';
import { FeatureService } from './feature.service';
import { AuthRequest } from '../../common/middleware/auth';

export class FeatureController {
  // Get all features with optional filtering
  static async getFeatures(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, isActive, search } = req.query;

      const features = await FeatureService.getAllFeatures({
        productId: productId as string,
        isActive: isActive ? isActive === 'true' : undefined,
        search: search as string,
      });

      res.json({
        success: true,
        data: { features },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get features for a specific product
  static async getFeaturesByProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.params;

      const features = await FeatureService.getFeaturesByProduct(productId);

      res.json({
        success: true,
        data: { features },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get feature by ID
  static async getFeatureById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const feature = await FeatureService.getFeatureById(id);

      if (!feature) {
        res.status(404).json({
          success: false,
          message: 'Feature not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { feature },
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new feature
  static async createFeature(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, productId, isActive } = req.body;

      // Check if feature name already exists for this product
      const nameExists = await FeatureService.isFeatureNameExists(name, productId);
      if (nameExists) {
        res.status(400).json({
          success: false,
          message: 'Feature name already exists for this product',
        });
        return;
      }

      const feature = await FeatureService.createFeature(
        {
          name,
          description,
          productId,
          isActive: isActive !== undefined ? isActive : true,
        } as any,
        req.user!._id
      );

      res.status(201).json({
        success: true,
        message: 'Feature created successfully',
        data: { feature },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update feature
  static async updateFeature(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, productId, isActive } = req.body;

      // Check if feature name already exists for this product (excluding current feature)
      if (name && productId) {
        const nameExists = await FeatureService.isFeatureNameExists(name, productId, id);
        if (nameExists) {
          res.status(400).json({
            success: false,
            message: 'Feature name already exists for this product',
          });
          return;
        }
      }

      const feature = await FeatureService.updateFeature(id, {
        name,
        description,
        productId,
        isActive,
      });

      if (!feature) {
        res.status(404).json({
          success: false,
          message: 'Feature not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Feature updated successfully',
        data: { feature },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete feature (soft delete)
  static async deleteFeature(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const feature = await FeatureService.deleteFeature(id);

      if (!feature) {
        res.status(404).json({
          success: false,
          message: 'Feature not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Feature deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}