import { Product, IProduct } from './product.model';
import { NotFoundError, ConflictError } from '../../common/errors/AppError';

export class ProductService {
  static async createProduct(productData: {
    name: string;
    description?: string;
    category: string;
    departments: string[];
    icon?: string;
    color?: string;
  }): Promise<IProduct> {
    // Check if product already exists
    const existingProduct = await Product.findOne({ name: productData.name });
    if (existingProduct) {
      throw new ConflictError('Product with this name already exists');
    }

    const product = new Product(productData);
    await product.save();
    
    return product;
  }

  static async getProductById(id: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    return product;
  }

  static async getProductsByDepartment(department: string): Promise<IProduct[]> {
    return Product.find({ 
      departments: department, 
      isActive: true 
    }).sort({ name: 1 });
  }

  static async getProductsByIds(productIds: string[]): Promise<IProduct[]> {
    return Product.find({ 
      _id: { $in: productIds }, 
      isActive: true 
    }).sort({ name: 1 });
  }

  static async getAllProducts(filter: {
    category?: string;
    department?: string;
    isActive?: boolean;
    search?: string;
  } = {}): Promise<IProduct[]> {
    const {
      category,
      department,
      isActive = true,
      search
    } = filter;

    // Build query
    const query: any = { isActive };
    
    if (category) query.category = category;
    if (department) query.departments = department;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    return Product.find(query).sort({ name: 1 });
  }

  static async updateProduct(id: string, updateData: Partial<IProduct>): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    
    return product;
  }

  static async deleteProduct(id: string): Promise<void> {
    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      throw new NotFoundError('Product not found');
    }
  }

  static async getProductCategories(): Promise<string[]> {
    const categories = await Product.distinct('category', { isActive: true });
    return categories.sort();
  }
}