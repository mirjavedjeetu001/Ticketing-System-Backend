import { User, IUser } from './user.model';
import { AppError, NotFoundError, ConflictError } from '../../common/errors/AppError';

export class UserService {
  static async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'admin' | 'agent' | 'user';
    department?: string;
    departmentId?: string;
    productAccess?: string[];
  }): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create new user
    const user = new User(userData);
    await user.save();
    
    return user;
  }

  static async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  static async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email, isActive: true }).select('+password') as Promise<IUser | null>;
  }

  static async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser> {
    // Don't allow direct password updates through this method
    delete updateData.password;
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  static async updatePassword(id: string, newPassword: string): Promise<void> {
    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    user.password = newPassword;
    await user.save();
  }

  static async deleteUser(id: string): Promise<void> {
    // Soft delete by setting isActive to false
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
  }

  static async listUsers(filter: {
    role?: string;
    department?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ users: IUser[]; total: number; page: number; totalPages: number }> {
    const {
      role,
      department,
      isActive = true,
      search,
      page = 1,
      limit = 50
    } = filter;

    // Build query
    const query: any = { isActive: true }; // Always start with active users
    
    if (role) query.role = role;
    if (department) query.department = department;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      totalPages,
    };
  }

  static async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  static async getAgents(department?: string): Promise<IUser[]> {
    const query: any = { role: 'agent', isActive: true };
    if (department) {
      query.department = department;
    }
    
    return User.find(query).sort({ firstName: 1 });
  }

  static async getUsersByProductAccess(productId: string): Promise<IUser[]> {
    return User.find({
      productAccess: productId,
      isActive: true,
      role: { $in: ['agent', 'admin'] }
    }).sort({ firstName: 1 });
  }

  static async getUsersByDepartment(departmentId: string): Promise<IUser[]> {
    return User.find({
      departmentId: departmentId,
      isActive: true,
      role: { $in: ['agent', 'admin'] }
    }).populate('departmentId', 'name description')
    .sort({ firstName: 1 });
  }
}