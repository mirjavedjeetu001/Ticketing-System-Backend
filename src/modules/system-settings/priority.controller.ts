import { Request, Response } from 'express';
import { Priority } from './priority.model';

export class PriorityController {
  // Get all priorities
  async getPriorities(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const isActive = req.query.isActive as string;

      const query: any = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }

      const priorities = await Priority.find(query)
        .sort({ level: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Priority.countDocuments(query);

      res.json({
        success: true,
        data: {
          priorities,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get priorities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch priorities',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get priority by ID
  async getPriorityById(req: Request, res: Response): Promise<void> {
    try {
      const priority = await Priority.findById(req.params.id);
      
      if (!priority) {
        res.status(404).json({
          success: false,
          message: 'Priority not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { priority },
      });
    } catch (error) {
      console.error('Get priority by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch priority',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create priority
  async createPriority(req: Request, res: Response): Promise<void> {
    try {
      const { name, level, description, color } = req.body;

      // Check if priority with same name or level exists
      const existingPriority = await Priority.findOne({
        $or: [{ name }, { level }]
      });

      if (existingPriority) {
        res.status(400).json({
          success: false,
          message: 'Priority with this name or level already exists',
        });
        return;
      }

      const priority = new Priority({
        name,
        level,
        description,
        color,
      });

      await priority.save();

      res.status(201).json({
        success: true,
        message: 'Priority created successfully',
        data: { priority },
      });
    } catch (error) {
      console.error('Create priority error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create priority',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update priority
  async updatePriority(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, level, description, color, isActive } = req.body;

      // Check if another priority with same name or level exists
      if (name || level) {
        const existingPriority = await Priority.findOne({
          _id: { $ne: id },
          $or: [
            ...(name ? [{ name }] : []),
            ...(level ? [{ level }] : [])
          ]
        });

        if (existingPriority) {
          res.status(400).json({
            success: false,
            message: 'Another priority with this name or level already exists',
          });
          return;
        }
      }

      const priority = await Priority.findByIdAndUpdate(
        id,
        { name, level, description, color, isActive },
        { new: true, runValidators: true }
      );

      if (!priority) {
        res.status(404).json({
          success: false,
          message: 'Priority not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Priority updated successfully',
        data: { priority },
      });
    } catch (error) {
      console.error('Update priority error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update priority',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete priority
  async deletePriority(req: Request, res: Response): Promise<void> {
    try {
      const priority = await Priority.findByIdAndDelete(req.params.id);
      
      if (!priority) {
        res.status(404).json({
          success: false,
          message: 'Priority not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Priority deleted successfully',
      });
    } catch (error) {
      console.error('Delete priority error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete priority',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}