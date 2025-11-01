import { Request, Response, NextFunction } from 'express';
import { TeamService } from './team.service';
import { AuthRequest } from '../../common/middleware/auth';

export class TeamController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = {
        ...req.body,
        createdBy: req.user?._id,
      };

      const team = await TeamService.createTeam(data);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId, businessUnitId, isActive } = req.query;
      const filter: any = {};
      
      if (departmentId) filter.departmentId = departmentId;
      if (businessUnitId) filter.businessUnitId = businessUnitId;
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const teams = await TeamService.getAllTeams(filter);

      res.json({
        success: true,
        data: { teams, total: teams.length },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const team = await TeamService.getTeamById(req.params.id);

      res.json({
        success: true,
        data: { team },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const team = await TeamService.updateTeam(req.params.id, req.body);

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: { team },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await TeamService.deleteTeam(req.params.id);

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body;
      const team = await TeamService.addMember(req.params.id, userId);

      res.json({
        success: true,
        message: 'Member added to team successfully',
        data: { team },
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const team = await TeamService.removeMember(req.params.id, userId);

      res.json({
        success: true,
        message: 'Member removed from team successfully',
        data: { team },
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const team = await TeamService.toggleStatus(req.params.id);

      res.json({
        success: true,
        message: `Team ${team.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { team },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const teams = await TeamService.getTeamsByDepartment(req.params.departmentId);

      res.json({
        success: true,
        data: { teams, total: teams.length },
      });
    } catch (error) {
      next(error);
    }
  }
}
