import { Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { AuthRequest } from '../../common/middleware/auth';
import { ValidationError } from '../../common/errors/AppError';
import { User } from '../users/user.model';

export class ProductController {
  static async createProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, category, departments, icon, color } = req.body;

      if (!name || !category || !departments || !Array.isArray(departments)) {
        throw new ValidationError('Name, category, and departments array are required');
      }

      const product = await ProductService.createProduct({
        name,
        description,
        category,
        departments,
        icon,
        color,
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, department, search } = req.query;

      const products = await ProductService.getAllProducts({
        category: category as string,
        department: department as string,
        search: search as string,
      });

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User authentication required');
      }

      let products: any[] = [];

      // Admins see all products
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        products = await ProductService.getAllProducts({});
      } else {
        // For other users, get products based on their productAccess array
        // If productAccess is not set or empty, fallback to department-based access for backward compatibility
        const user = await User.findById(req.user._id);
        
        if (user?.productAccess && user.productAccess.length > 0) {
          // New system: use productAccess array
          products = await ProductService.getProductsByIds(user.productAccess.map(id => id.toString()));
        } else if (user?.department) {
          // Fallback: use old department-based system
          products = await ProductService.getProductsByDepartment(user.department);
        } else {
          // No access configured
          products = [];
        }
      }

      res.json({
        success: true,
        data: { products },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await ProductService.getProductById(id);

      res.json({
        success: true,
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await ProductService.updateProduct(id, updateData);

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await ProductService.deleteProduct(id);

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await ProductService.getProductCategories();

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }
}