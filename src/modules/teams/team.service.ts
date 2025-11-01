import { Team, ITeam } from './team.model';
import { ValidationError, NotFoundError } from '../../common/errors/AppError';
import { User } from '../users/user.model';

export class TeamService {
  static async createTeam(data: Partial<ITeam>): Promise<ITeam> {
    try {
      const team = new Team(data);
      await team.save();
      
      // Update team members' teamId
      if (data.members && data.members.length > 0) {
        await User.updateMany(
          { _id: { $in: data.members } },
          { $set: { teamId: team._id } }
        );
      }

      return await team.populate([
        { path: 'departmentId', select: 'name shortName' },
        { path: 'businessUnitId', select: 'name shortName' },
        { path: 'teamLeadId', select: 'firstName lastName email' },
        { path: 'members', select: 'firstName lastName email role' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ]);
    } catch (error) {
      throw error;
    }
  }

  static async getAllTeams(filter: any = {}): Promise<ITeam[]> {
    const query: any = {};
    
    if (filter.departmentId) {
      query.departmentId = filter.departmentId;
    }
    
    if (filter.businessUnitId) {
      query.businessUnitId = filter.businessUnitId;
    }
    
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    return await Team.find(query)
      .populate('departmentId', 'name shortName')
      .populate('businessUnitId', 'name shortName')
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email role isActive')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  static async getTeamById(id: string): Promise<ITeam> {
    const team = await Team.findById(id)
      .populate('departmentId', 'name shortName')
      .populate('businessUnitId', 'name shortName')
      .populate('teamLeadId', 'firstName lastName email role phone')
      .populate('members', 'firstName lastName email role phone isActive')
      .populate('createdBy', 'firstName lastName email');
    
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    return team;
  }

  static async updateTeam(id: string, data: Partial<ITeam>): Promise<ITeam> {
    const team = await Team.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate([
      { path: 'departmentId', select: 'name shortName' },
      { path: 'businessUnitId', select: 'name shortName' },
      { path: 'teamLeadId', select: 'firstName lastName email' },
      { path: 'members', select: 'firstName lastName email role' }
    ]);

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    return team;
  }

  static async deleteTeam(id: string): Promise<void> {
    const team = await Team.findByIdAndDelete(id);
    
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Remove team reference from users
    await User.updateMany(
      { teamId: id },
      { $unset: { teamId: '' } }
    );
  }

  static async addMember(teamId: string, userId: string): Promise<ITeam> {
    const team = await Team.findById(teamId);
    
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check if user is already a member
    if (team.members.includes(userId as any)) {
      throw new ValidationError('User is already a member of this team');
    }

    // Check max members limit
    if (team.settings?.maxMembers && team.members.length >= team.settings.maxMembers) {
      throw new ValidationError('Team has reached maximum members limit');
    }

    team.members.push(userId as any);
    await team.save();

    // Update user's teamId
    await User.findByIdAndUpdate(userId, { $set: { teamId: team._id } });

    return await team.populate('members', 'firstName lastName email role');
  }

  static async removeMember(teamId: string, userId: string): Promise<ITeam> {
    const team = await Team.findById(teamId);
    
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    team.members = team.members.filter(id => id.toString() !== userId);
    await team.save();

    // Remove team reference from user
    await User.findByIdAndUpdate(userId, { $unset: { teamId: '' } });

    return await team.populate('members', 'firstName lastName email role');
  }

  static async toggleStatus(id: string): Promise<ITeam> {
    const team = await Team.findById(id);
    
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    team.isActive = !team.isActive;
    await team.save();

    return await team.populate([
      { path: 'departmentId', select: 'name shortName' },
      { path: 'teamLeadId', select: 'firstName lastName email' },
      { path: 'members', select: 'firstName lastName email role' }
    ]);
  }

  static async getTeamsByDepartment(departmentId: string): Promise<ITeam[]> {
    return await Team.find({ departmentId, isActive: true })
      .populate('teamLeadId', 'firstName lastName email')
      .populate('members', 'firstName lastName email')
      .sort({ name: 1 });
  }
}
