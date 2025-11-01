import { Request, Response, NextFunction } from 'express';
import { TicketService, TicketFilter } from './ticket.service';
import { AuthRequest } from '../../common/middleware/auth';
import { ValidationError } from '../../common/errors/AppError';
import * as fs from 'fs';
import * as path from 'path';
import { Ticket } from './ticket.model';

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

      // Handle file attachments
      console.log('🔍 CREATE TICKET - Files received:', req.files);
      console.log('🔍 CREATE TICKET - Files type:', typeof req.files);
      console.log('🔍 CREATE TICKET - Is array:', Array.isArray(req.files));
      
      const attachments: any[] = [];
      if (req.files && Array.isArray(req.files)) {
        console.log(`✅ CREATE TICKET - Processing ${req.files.length} file(s)`);
        for (const file of req.files) {
          console.log('📎 CREATE TICKET - File:', file.filename, file.originalname, file.size);
          
          // Read file and convert to base64 to store in MongoDB
          const fileData = fs.readFileSync(file.path);
          const base64Data = fileData.toString('base64');
          
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
            data: base64Data, // Store base64 in MongoDB
            url: file.path, // Keep local path for backup
          });
          
          console.log(`💾 Stored ${file.originalname} as base64 (${(base64Data.length / 1024).toFixed(2)} KB encoded)`);
        }
      } else {
        console.log('❌ CREATE TICKET - No files received or files is not an array');
      }
      console.log('📋 CREATE TICKET - Final attachments array:', attachments.length, 'files');

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
        attachments,
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

  static async getAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename } = req.params;
      console.log('📎 Fetching attachment:', filename);

      // Find ticket with this attachment
      const ticket = await Ticket.findOne({ 'attachments.filename': filename });

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Attachment not found',
        });
        return;
      }

      // Find the specific attachment
      const attachment = ticket.attachments.find((att: any) => att.filename === filename);
      if (!attachment) {
        res.status(404).json({
          success: false,
          message: 'Attachment not found',
        });
        return;
      }

      let fileBuffer: Buffer;

      // Try to get file from MongoDB (base64 data)
      if (attachment.data) {
        console.log(`📦 Serving from MongoDB (base64): ${attachment.originalName}`);
        fileBuffer = Buffer.from(attachment.data, 'base64');
      } 
      // Fallback: Try to get file from local filesystem (for old attachments)
      else if (attachment.url && fs.existsSync(attachment.url)) {
        console.log(`📂 Serving from local file: ${attachment.url}`);
        fileBuffer = fs.readFileSync(attachment.url);
      }
      // Last resort: Check uploads directory
      else {
        const uploadPath = path.join(__dirname, '../../../uploads', filename);
        if (fs.existsSync(uploadPath)) {
          console.log(`📂 Serving from uploads directory: ${uploadPath}`);
          fileBuffer = fs.readFileSync(uploadPath);
        } else {
          console.error(`❌ File not found anywhere: ${filename}`);
          res.status(404).json({
            success: false,
            message: 'Attachment file not found',
          });
          return;
        }
      }

      // Set appropriate headers
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      
      // Cache control for better performance
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      console.log(`✅ Served attachment: ${attachment.originalName} (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
      
      // Send the file
      res.send(fileBuffer);
    } catch (error) {
      console.error('❌ Error fetching attachment:', error);
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
        req.user._id.toString(),
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
        req.user._id.toString(),
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
      await TicketService.deleteTicket(id, req.user._id.toString(), req.user.role);

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
        req.user._id.toString(),
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

      console.log('🔍 ADD COMMENT - Files received:', req.files);
      console.log('🔍 ADD COMMENT - Content:', content);

      // Allow comments with either content OR attachments (files from req.files)
      const hasFiles = req.files && Array.isArray(req.files) && req.files.length > 0;
      if (!content && !hasFiles) {
        throw new ValidationError('Comment content or attachments are required');
      }

      // Handle file attachments
      const attachments: any[] = [];
      if (req.files && Array.isArray(req.files)) {
        console.log(`✅ ADD COMMENT - Processing ${req.files.length} file(s)`);
        for (const file of req.files) {
          console.log('📎 ADD COMMENT - File:', file.filename, file.originalname, file.size);
          
          // Read file and convert to base64 to store in MongoDB
          const fileData = fs.readFileSync(file.path);
          const base64Data = fileData.toString('base64');
          
          attachments.push({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
            data: base64Data, // Store base64 in MongoDB
            url: file.path, // Keep local path for backup
          });
          
          console.log(`💾 Stored ${file.originalname} as base64 (${(base64Data.length / 1024).toFixed(2)} KB encoded)`);
        }
      } else {
        console.log('❌ ADD COMMENT - No files received or files is not an array');
      }
      console.log('📋 ADD COMMENT - Final attachments array:', attachments.length, 'files');

      const ticket = await TicketService.addComment(
        id,
        content || '', // Allow empty content if there are attachments
        req.user._id.toString(),
        isInternal,
        attachments
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
        req.user._id.toString(),
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
        req.user._id.toString(),
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
        req.user._id.toString(),
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