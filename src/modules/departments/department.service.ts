import { Department, IDepartment } from './department.model';
import { User } from '../users/user.model';
import { NotFoundError, ValidationError } from '../../common/errors/AppError';
import { Types } from 'mongoose';

export class DepartmentService {
  static async createDepartment(departmentData: {
    name: string;
    shortName?: string;
    description?: string;
    businessUnitId?: string;
    members?: string[];
    head?: string;
  }): Promise<IDepartment> {
    // Validate department name is unique within the business unit (if provided)
    const query: any = { name: departmentData.name };
    if (departmentData.businessUnitId) {
      query.businessUnitId = departmentData.businessUnitId;
    }
    
    const existingDepartment = await Department.findOne(query);
    if (existingDepartment) {
      throw new ValidationError('Department name already exists in this business unit');
    }

    // Validate members exist
    if (departmentData.members && departmentData.members.length > 0) {
      const memberCount = await User.countDocuments({ 
        _id: { $in: departmentData.members.map(id => new Types.ObjectId(id)) }
      });
      if (memberCount !== departmentData.members.length) {
        throw new ValidationError('One or more members not found');
      }
    }

    // Validate head exists
    if (departmentData.head) {
      const head = await User.findById(departmentData.head);
      if (!head) {
        throw new NotFoundError('Department head not found');
      }
    }

    const department = new Department({
      ...departmentData,
      businessUnitId: departmentData.businessUnitId ? new Types.ObjectId(departmentData.businessUnitId) : undefined,
      members: departmentData.members?.map(id => new Types.ObjectId(id)) || [],
      head: departmentData.head ? new Types.ObjectId(departmentData.head) : undefined,
    });

    await department.save();
    return this.getDepartmentById(department._id);
  }

  static async getDepartmentById(id: string): Promise<IDepartment> {
    const department = await Department.findById(id)
      .populate('members', 'firstName lastName email role department')
      .populate('head', 'firstName lastName email role');

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return department;
  }

  static async listDepartments(filters?: {
    businessUnitId?: string;
    isActive?: boolean;
  }): Promise<IDepartment[]> {
    const query: any = {};
    
    if (filters?.businessUnitId) {
      query.businessUnitId = filters.businessUnitId;
    }
    
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    } else {
      query.isActive = true; // Default to active only
    }
    
    return Department.find(query)
      .populate('businessUnitId', 'name shortName')
      .populate('members', 'firstName lastName email role department')
      .populate('head', 'firstName lastName email role')
      .sort({ name: 1 });
  }

  static async getDepartmentsByBusinessUnit(businessUnitId: string): Promise<IDepartment[]> {
    return Department.find({ 
      businessUnitId: new Types.ObjectId(businessUnitId),
      isActive: true 
    })
      .populate('members', 'firstName lastName email role department')
      .populate('head', 'firstName lastName email role')
      .sort({ name: 1 });
  }

  static async addMemberToDepartment(departmentId: string, userId: string): Promise<IDepartment> {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is already a member
    const isMember = department.members.some(memberId => memberId.toString() === userId);
    if (isMember) {
      throw new ValidationError('User is already a member of this department');
    }

    department.members.push(userId as any);
    await department.save();

    return this.getDepartmentById(department._id);
  }

  static async removeMemberFromDepartment(departmentId: string, userId: string): Promise<IDepartment> {
    const department = await Department.findById(departmentId);
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    department.members = department.members.filter(memberId => memberId.toString() !== userId);
    
    // If removing the head, clear the head field
    if (department.head?.toString() === userId) {
      department.head = undefined;
    }

    await department.save();
    return this.getDepartmentById(department._id);
  }

  static async updateDepartment(
    id: string,
    updateData: Partial<IDepartment>
  ): Promise<IDepartment> {
    const department = await Department.findById(id);
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Validate name uniqueness if changing name
    if (updateData.name && updateData.name !== department.name) {
      const existingDepartment = await Department.findOne({ 
        name: updateData.name,
        _id: { $ne: id }
      });
      if (existingDepartment) {
        throw new ValidationError('Department name already exists');
      }
    }

    Object.assign(department, updateData);
    await department.save();

    return this.getDepartmentById(department._id);
  }

  static async deleteDepartment(id: string): Promise<void> {
    const department = await Department.findById(id);
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Soft delete
    department.isActive = false;
    await department.save();
  }

  static async getUserDepartments(userId: string): Promise<IDepartment[]> {
    return Department.find({
      isActive: true,
      members: new Types.ObjectId(userId)
    }).populate('head', 'firstName lastName email');
  }
}