import { Request, Response, NextFunction } from 'express';
import { TicketService, TicketFilter } from './ticket.service';
import { AuthRequest } from '../../common/middleware/auth';
import { ValidationError } from '../../common/errors/AppError';

export class TicketController {
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const {
        title,
        description,
        severityId,
        department,
        productId,
        categoryId,
        assigneeId,
        assignToProductTeam,
        departmentId,
        tags,
        mentions,
        estimatedHours,
        dueDate,
      } = req.body;

      if (!title) {
        throw new ValidationError('Title is required');
      }

      // Parse mentions if it's a JSON string
      let parsedMentions: string[] = [];
      if (mentions) {
        try {
          parsedMentions = typeof mentions === 'string' ? JSON.parse(mentions) : mentions;
        } catch (error) {
          console.error('Error parsing mentions:', error);
        }
      }

      const ticket = await TicketService.createTicket({
        title,
        description,
        createdBy: req.user._id,
        severityId,
        department,
        productId,
        categoryId,
        assigneeId,
        assignToProductTeam,
        departmentId,
        tags,
        mentions: parsedMentions,
        estimatedHours,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const {
        status,
        priority,
        assignee,
        createdBy,
        department,
        product,
        tags,
        search,
        dueDateFrom,
        dueDateTo,
        createdDateFrom,
        createdDateTo,
        isOverdue,
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const filter: TicketFilter = {
        status: status as string,
        priority: priority as string,
        assignee: assignee as string,
        createdBy: createdBy as string,
        department: department as string,
        product: product as string,
        tags: tags ? (tags as string).split(',') : undefined,
        search: search as string,
        isOverdue: isOverdue === 'true',
      };

      if (dueDateFrom || dueDateTo) {
        filter.dueDate = {
          from: dueDateFrom ? new Date(dueDateFrom as string) : undefined,
          to: dueDateTo ? new Date(dueDateTo as string) : undefined,
        };
      }

      if (createdDateFrom || createdDateTo) {
        filter.createdDate = {
          from: createdDateFrom ? new Date(createdDateFrom as string) : undefined,
          to: createdDateTo ? new Date(createdDateTo as string) : undefined,
        };
      }

      const result = await TicketService.listTickets(
        filter,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        },
        req.user._id,
        req.user.role
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await TicketService.getTicketById(id);

      res.json({
        success: true,
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const updateData = req.body;

      const ticket = await TicketService.updateTicket(
        id,
        updateData,
        req.user._id,
        req.user.role
      );

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      await TicketService.deleteTicket(id, req.user._id, req.user.role);

      res.json({
        success: true,
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async assign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { assigneeId } = req.body;

      if (!assigneeId) {
        throw new ValidationError('Assignee ID is required');
      }

      const ticket = await TicketService.assignTicket(
        id,
        assigneeId,
        req.user._id,
        req.user.role
      );

      res.json({
        success: true,
        message: 'Ticket assigned successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { content, isInternal = false } = req.body;

      if (!content) {
        throw new ValidationError('Comment content is required');
      }

      const ticket = await TicketService.addComment(
        id,
        content,
        req.user._id,
        isInternal
      );

      res.json({
        success: true,
        message: 'Comment added successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async resolveTicket(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;
      const { resolution } = req.body;

      if (!resolution) {
        throw new ValidationError('Resolution description is required');
      }

      const ticket = await TicketService.resolveTicket(
        id,
        resolution,
        req.user._id,
        req.user.role
      );

      res.json({
        success: true,
        message: 'Ticket resolved successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async closeTicket(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const { id } = req.params;

      const ticket = await TicketService.closeTicket(
        id,
        req.user._id,
        req.user.role
      );

      res.json({
        success: true,
        message: 'Ticket closed successfully',
        data: { ticket },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('Authentication required');
      }

      const {
        department,
        product,
        assignee,
        createdBy,
      } = req.query;

      const filter: TicketFilter = {
        department: department as string,
        product: product as string,
        assignee: assignee as string,
        createdBy: createdBy as string,
      };

      const stats = await TicketService.getTicketStats(
        filter,
        req.user._id,
        req.user.role
      );

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      next(error);
    }
  }
}