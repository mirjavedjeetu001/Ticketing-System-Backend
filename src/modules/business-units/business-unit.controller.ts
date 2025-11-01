import { Request, Response, NextFunction } from 'express';
import { BusinessUnitService } from './business-unit.service';
import { AuthRequest } from '../../common/middleware/auth';

export class BusinessUnitController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = {
        ...req.body,
        createdBy: req.user?._id,
      };

      const businessUnit = await BusinessUnitService.createBusinessUnit(data);

      res.status(201).json({
        success: true,
        message: 'Business unit created successfully',
        data: { businessUnit },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { companyId, isActive } = req.query;
      const filter: any = {};
      
      if (companyId) filter.companyId = companyId;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const businessUnits = await BusinessUnitService.getAllBusinessUnits(filter);

      res.json({
        success: true,
        data: { businessUnits, total: businessUnits.length },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessUnit = await BusinessUnitService.getBusinessUnitById(req.params.id);

      res.json({
        success: true,
        data: { businessUnit },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessUnit = await BusinessUnitService.updateBusinessUnit(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Business unit updated successfully',
        data: { businessUnit },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await BusinessUnitService.deleteBusinessUnit(req.params.id);

      res.json({
        success: true,
        message: 'Business unit deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessUnit = await BusinessUnitService.toggleStatus(req.params.id);

      res.json({
        success: true,
        message: `Business unit ${businessUnit.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { businessUnit },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businessUnits = await BusinessUnitService.getBusinessUnitsByCompany(req.params.companyId);

      res.json({
        success: true,
        data: { businessUnits, total: businessUnits.length },
      });
    } catch (error) {
      next(error);
    }
  }
}
