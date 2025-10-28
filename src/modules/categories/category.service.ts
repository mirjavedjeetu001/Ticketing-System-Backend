import { IssueCategory, IIssueCategory } from './category.model';
import { NotFoundError, ConflictError } from '../../common/errors/AppError';

export class CategoryService {
  static async createCategory(categoryData: {
    name: string;
    description?: string;
    featureIds: string[];
    defaultPriorityId: string;
    color?: string;
  }): Promise<IIssueCategory> {
    // Check if category with same name and overlapping features already exists
    const existingCategories = await IssueCategory.find({ 
      name: categoryData.name,
      featureIds: { $in: categoryData.featureIds }
    });
    
    if (existingCategories.length > 0) {
      throw new ConflictError('A category with this name already exists for one or more of the selected features');
    }

    const category = new IssueCategory(categoryData);
    await category.save();
    
    return category.populate([
      { path: 'featureIds' },
      { path: 'defaultPriorityId' }
    ]);
  }

  static async getCategoryById(id: string): Promise<IIssueCategory> {
    const category = await IssueCategory.findById(id).populate([
      { path: 'featureIds' },
      { path: 'defaultPriorityId' }
    ]);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    return category;
  }

  static async getCategoriesByFeature(featureId: string): Promise<IIssueCategory[]> {
    return IssueCategory.find({ 
      featureIds: { $in: [featureId] },
      isActive: true 
    }).populate([
      { path: 'featureIds' },
      { path: 'defaultPriorityId' }
    ]).sort({ name: 1 });
  }

  static async getAllCategories(filter: {
    featureId?: string;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<IIssueCategory[]> {
    const {
      featureId,
      isActive = true,
      search
    } = filter;

    // Build query
    const query: any = { isActive };
    
    if (featureId) query.featureIds = { $in: [featureId] };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    return IssueCategory.find(query)
      .populate([
        { path: 'featureIds' },
        { path: 'defaultPriorityId' }
      ])
      .sort({ name: 1 });
  }

  static async updateCategory(id: string, updateData: Partial<IIssueCategory>): Promise<IIssueCategory> {
    const category = await IssueCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'featureIds' },
      { path: 'defaultPriorityId' }
    ]);
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    
    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    const category = await IssueCategory.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!category) {
      throw new NotFoundError('Category not found');
    }
  }

  // Note: SLA hours are now managed through System Settings SLA Rules
  // This service no longer handles SLA calculations directly
}