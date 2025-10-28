import { Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { AuthRequest } from '../../common/middleware/auth';
import { ValidationError } from '../../common/errors/AppError';

export class CategoryController {
  static async createCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, featureIds, defaultPriorityId, color } = req.body;

      if (!name || !featureIds || featureIds.length === 0 || !defaultPriorityId) {
        throw new ValidationError('Name, at least one feature, and default priority ID are required');
      }

      const category = await CategoryService.createCategory({
        name,
        description,
        featureIds,
        defaultPriorityId,
        color,
      });

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { featureId, search } = req.query;

      const categories = await CategoryService.getAllCategories({
        featureId: featureId as string,
        search: search as string,
      });

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const category = await CategoryService.getCategoryById(id);

      res.json({
        success: true,
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await CategoryService.updateCategory(id, updateData);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await CategoryService.deleteCategory(id);

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategoriesByFeature(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { featureId } = req.params;

      const categories = await CategoryService.getCategoriesByFeature(featureId);

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }
}