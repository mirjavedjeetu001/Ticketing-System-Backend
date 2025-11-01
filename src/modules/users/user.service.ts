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
        .populate('companyId', 'name shortName')
        .populate('businessUnitId', 'name shortName')
        .populate({
          path: 'departmentId',
          select: 'name businessUnitId',
          populate: {
            path: 'businessUnitId',
            select: 'name shortName companyId',
            populate: {
              path: 'companyId',
              select: 'name shortName'
            }
          }
        })
        .populate('teamId', 'name')
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

  // New methods for hierarchical user management
  static async updateUserRole(
    userId: string,
    newRole: 'super_admin' | 'admin' | 'business_unit_head' | 'department_head' | 'team_lead' | 'agent' | 'user'
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.role = newRole;
    
    // Set default permissions based on role
    user.permissions = this.getDefaultPermissionsByRole(newRole);
    
    await user.save();
    return user;
  }

  static async updateUserPermissions(
    userId: string,
    permissions: Partial<IUser['permissions']>
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Merge with existing permissions
    user.permissions = {
      ...user.permissions,
      ...permissions
    };
    
    await user.save();
    return user;
  }

  static async assignToCompany(userId: string, companyId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { companyId },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  static async assignToBusinessUnit(userId: string, businessUnitId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { businessUnitId },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  static async assignToDepartment(userId: string, departmentId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { departmentId },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  static async assignToTeam(userId: string, teamId: string | null): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { teamId: teamId || undefined },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }

  static async toggleUserStatus(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.isActive = !user.isActive;
    await user.save();
    
    return user;
  }

  static async getUsersByCompany(companyId: string): Promise<IUser[]> {
    return User.find({ companyId, isActive: true })
      .populate('businessUnitId', 'name shortName')
      .populate('departmentId', 'name shortName')
      .populate('teamId', 'name')
      .sort({ firstName: 1 });
  }

  static async getUsersByBusinessUnit(businessUnitId: string): Promise<IUser[]> {
    return User.find({ businessUnitId, isActive: true })
      .populate('departmentId', 'name shortName')
      .populate('teamId', 'name')
      .sort({ firstName: 1 });
  }

  static async getUsersByTeam(teamId: string): Promise<IUser[]> {
    return User.find({ teamId, isActive: true })
      .populate('departmentId', 'name shortName')
      .sort({ firstName: 1 });
  }

  private static getDefaultPermissionsByRole(role: string): IUser['permissions'] {
    const permissions: IUser['permissions'] = {
      canCreateTickets: false,
      canViewAllTickets: false,
      canAssignTickets: false,
      canCloseTickets: false,
      canDeleteTickets: false,
      canManageUsers: false,
      canManageTeams: false,
      canManageDepartments: false,
      canManageBusinessUnits: false,
      canManageCompany: false,
      canViewReports: false,
      canExportData: false,
    };

    switch (role) {
      case 'super_admin':
        // Super admin has all permissions
        Object.keys(permissions).forEach(key => {
          permissions[key as keyof typeof permissions] = true;
        });
        break;
      
      case 'admin':
        permissions.canCreateTickets = true;
        permissions.canViewAllTickets = true;
        permissions.canAssignTickets = true;
        permissions.canCloseTickets = true;
        permissions.canDeleteTickets = true;
        permissions.canManageUsers = true;
        permissions.canManageTeams = true;
        permissions.canManageDepartments = true;
        permissions.canViewReports = true;
        permissions.canExportData = true;
        break;
      
      case 'business_unit_head':
        permissions.canCreateTickets = true;
        permissions.canViewAllTickets = true;
        permissions.canAssignTickets = true;
        permissions.canCloseTickets = true;
        permissions.canManageTeams = true;
        permissions.canManageDepartments = true;
        permissions.canViewReports = true;
        permissions.canExportData = true;
        break;
      
      case 'department_head':
        permissions.canCreateTickets = true;
        permissions.canViewAllTickets = true;
        permissions.canAssignTickets = true;
        permissions.canCloseTickets = true;
        permissions.canManageTeams = true;
        permissions.canViewReports = true;
        break;
      
      case 'team_lead':
        permissions.canCreateTickets = true;
        permissions.canViewAllTickets = true;
        permissions.canAssignTickets = true;
        permissions.canCloseTickets = true;
        permissions.canViewReports = true;
        break;
      
      case 'agent':
        permissions.canCreateTickets = true;
        permissions.canViewAllTickets = true;
        permissions.canAssignTickets = true;
        permissions.canCloseTickets = true;
        break;
      
      case 'user':
        permissions.canCreateTickets = true;
        break;
    }

    return permissions;
  }
}