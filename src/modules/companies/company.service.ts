import { Company, ICompany } from './company.model';
import { ValidationError, NotFoundError } from '../../common/errors/AppError';

export class CompanyService {
  static async createCompany(data: Partial<ICompany>): Promise<ICompany> {
    try {
      // Check if company with same name already exists
      const existingCompany = await Company.findOne({ name: data.name });
      if (existingCompany) {
        throw new ValidationError('Company with this name already exists');
      }

      const company = new Company(data);
      await company.save();
      return company;
    } catch (error) {
      throw error;
    }
  }

  static async getAllCompanies(filter: any = {}): Promise<ICompany[]> {
    const query: any = {};
    
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    return await Company.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  static async getCompanyById(companyId: string): Promise<ICompany> {
    const company = await Company.findById(companyId)
      .populate('createdBy', 'firstName lastName email');
    
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  }

  static async updateCompany(companyId: string, data: Partial<ICompany>): Promise<ICompany> {
    const company = await Company.findByIdAndUpdate(
      companyId,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  }

  static async deleteCompany(companyId: string): Promise<void> {
    const company = await Company.findByIdAndDelete(companyId);
    
    if (!company) {
      throw new NotFoundError('Company not found');
    }
  }

  static async toggleCompanyStatus(companyId: string): Promise<ICompany> {
    const company = await Company.findById(companyId);
    
    if (!company) {
      throw new NotFoundError('Company not found');
    }

    company.isActive = !company.isActive;
    await company.save();

    return company;
  }
}
