import Feature, { IFeature } from './feature.model';
import mongoose from 'mongoose';

export class FeatureService {
  // Get all features for a specific product
  static async getFeaturesByProduct(productId: string): Promise<IFeature[]> {
    return await Feature.find({ 
      productId: new mongoose.Types.ObjectId(productId),
      isActive: true 
    })
    .populate('productId', 'name')
    .populate('createdBy', 'name email')
    .sort({ name: 1 });
  }

  // Get all features with optional filtering
  static async getAllFeatures(filter: {
    productId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<IFeature[]> {
    const query: any = {};

    if (filter.productId) {
      query.productId = new mongoose.Types.ObjectId(filter.productId);
    }

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } }
      ];
    }

    return await Feature.find(query)
      .populate('productId', 'name abbreviation')
      .populate('createdBy', 'name email')
      .sort({ productId: 1, name: 1 });
  }

  // Create a new feature
  static async createFeature(
    data: Omit<IFeature, '_id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<IFeature> {
    const feature = new Feature({
      ...data,
      createdBy: new mongoose.Types.ObjectId(createdBy)
    });

    return await feature.save();
  }

  // Get feature by ID
  static async getFeatureById(id: string): Promise<IFeature | null> {
    return await Feature.findById(id)
      .populate('productId', 'name abbreviation')
      .populate('createdBy', 'name email');
  }

  // Update feature
  static async updateFeature(
    id: string,
    data: Partial<IFeature>
  ): Promise<IFeature | null> {
    return await Feature.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('productId', 'name abbreviation')
    .populate('createdBy', 'name email');
  }

  // Delete feature (soft delete by setting isActive to false)
  static async deleteFeature(id: string): Promise<IFeature | null> {
    return await Feature.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
  }

  // Get features by multiple IDs
  static async getFeaturesByIds(ids: string[]): Promise<IFeature[]> {
    return await Feature.find({
      _id: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) },
      isActive: true
    })
    .populate('productId', 'name abbreviation')
    .sort({ name: 1 });
  }

  // Check if feature name exists for a product
  static async isFeatureNameExists(
    name: string, 
    productId: string, 
    excludeId?: string
  ): Promise<boolean> {
    const query: any = {
      name: { $regex: `^${name}$`, $options: 'i' },
      productId: new mongoose.Types.ObjectId(productId)
    };

    if (excludeId) {
      query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
    }

    const existingFeature = await Feature.findOne(query);
    return !!existingFeature;
  }
}