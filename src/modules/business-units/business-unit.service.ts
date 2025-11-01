import { BusinessUnit, IBusinessUnit } from './business-unit.model';
import { ValidationError, NotFoundError } from '../../common/errors/AppError';

export class BusinessUnitService {
  static async createBusinessUnit(data: Partial<IBusinessUnit>): Promise<IBusinessUnit> {
    try {
      // Check if business unit with same short name exists in the company
      const existing = await BusinessUnit.findOne({ 
        companyId: data.companyId,
        shortName: data.shortName 
      });
      
      if (existing) {
        throw new ValidationError('Business unit with this short name already exists');
      }

      const businessUnit = new BusinessUnit(data);
      await businessUnit.save();
      return await businessUnit.populate([
        { path: 'companyId', select: 'name shortName' },
        { path: 'headUserId', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ]);
    } catch (error) {
      throw error;
    }
  }

  static async getAllBusinessUnits(filter: any = {}): Promise<IBusinessUnit[]> {
    const query: any = {};
    
    if (filter.companyId) {
      query.companyId = filter.companyId;
    }
    
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    return await BusinessUnit.find(query)
      .populate('companyId', 'name shortName')
      .populate('headUserId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  static async getBusinessUnitById(id: string): Promise<IBusinessUnit> {
    const businessUnit = await BusinessUnit.findById(id)
      .populate('companyId', 'name shortName')
      .populate('headUserId', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email');
    
    if (!businessUnit) {
      throw new NotFoundError('Business unit not found');
    }

    return businessUnit;
  }

  static async updateBusinessUnit(id: string, data: Partial<IBusinessUnit>): Promise<IBusinessUnit> {
    const businessUnit = await BusinessUnit.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate([
      { path: 'companyId', select: 'name shortName' },
      { path: 'headUserId', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    if (!businessUnit) {
      throw new NotFoundError('Business unit not found');
    }

    return businessUnit;
  }

  static async deleteBusinessUnit(id: string): Promise<void> {
    const businessUnit = await BusinessUnit.findByIdAndDelete(id);
    
    if (!businessUnit) {
      throw new NotFoundError('Business unit not found');
    }
  }

  static async toggleStatus(id: string): Promise<IBusinessUnit> {
    const businessUnit = await BusinessUnit.findById(id);
    
    if (!businessUnit) {
      throw new NotFoundError('Business unit not found');
    }

    businessUnit.isActive = !businessUnit.isActive;
    await businessUnit.save();

    return await businessUnit.populate([
      { path: 'companyId', select: 'name shortName' },
      { path: 'headUserId', select: 'firstName lastName email' }
    ]);
  }

  static async getBusinessUnitsByCompany(companyId: string): Promise<IBusinessUnit[]> {
    return await BusinessUnit.find({ companyId, isActive: true })
      .populate('headUserId', 'firstName lastName email')
      .sort({ name: 1 });
  }
}
