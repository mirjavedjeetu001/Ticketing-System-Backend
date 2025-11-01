import { Request, Response, NextFunction } from 'express';
import { CompanyService } from './company.service';
import { AuthRequest } from '../../common/middleware/auth';

export class CompanyController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyData = {
        ...req.body,
        createdBy: req.user?._id,
      };

      const company = await CompanyService.createCompany(companyData);

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: { company },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive } = req.query;
      const filter: any = {};
      
      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const companies = await CompanyService.getAllCompanies(filter);

      res.json({
        success: true,
        data: { companies, total: companies.length },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await CompanyService.getCompanyById(req.params.id);

      res.json({
        success: true,
        data: { company },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await CompanyService.updateCompany(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Company updated successfully',
        data: { company },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CompanyService.deleteCompany(req.params.id);

      res.json({
        success: true,
        message: 'Company deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await CompanyService.toggleCompanyStatus(req.params.id);

      res.json({
        success: true,
        message: `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { company },
      });
    } catch (error) {
      next(error);
    }
  }
}
