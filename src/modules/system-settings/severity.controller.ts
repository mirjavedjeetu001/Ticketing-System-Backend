import { Request, Response } from 'express';
import { Severity } from './severity.model';

export class SeverityController {
  // Get all severities
  async getSeverities(req: Request, res: Response) {
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

      const severities = await Severity.find(query)
        .sort({ level: 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Severity.countDocuments(query);

      res.json({
        success: true,
        data: {
          severities,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get severities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch severities',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get severity by ID
  async getSeverityById(req: Request, res: Response): Promise<void> {
    try {
      const severity = await Severity.findById(req.params.id);
      
      if (!severity) {
        res.status(404).json({
          success: false,
          message: 'Severity not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { severity },
      });
    } catch (error) {
      console.error('Get severity by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch severity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create severity
  async createSeverity(req: Request, res: Response): Promise<void> {
    try {
      const { name, level, description, color } = req.body;

      // Check if severity with same name or level exists
      const existingSeverity = await Severity.findOne({
        $or: [{ name }, { level }]
      });

      if (existingSeverity) {
        res.status(400).json({
          success: false,
          message: 'Severity with this name or level already exists',
        });
        return;
      }

      const severity = new Severity({
        name,
        level,
        description,
        color,
      });

      await severity.save();

      res.status(201).json({
        success: true,
        message: 'Severity created successfully',
        data: { severity },
      });
    } catch (error) {
      console.error('Create severity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create severity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update severity
  async updateSeverity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, level, description, color, isActive } = req.body;

      // Check if another severity with same name or level exists
      if (name || level) {
        const existingSeverity = await Severity.findOne({
          _id: { $ne: id },
          $or: [
            ...(name ? [{ name }] : []),
            ...(level ? [{ level }] : [])
          ]
        });

        if (existingSeverity) {
          res.status(400).json({
            success: false,
            message: 'Another severity with this name or level already exists',
          });
          return;
        }
      }

      const severity = await Severity.findByIdAndUpdate(
        id,
        { name, level, description, color, isActive },
        { new: true, runValidators: true }
      );

      if (!severity) {
        res.status(404).json({
          success: false,
          message: 'Severity not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Severity updated successfully',
        data: { severity },
      });
    } catch (error) {
      console.error('Update severity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update severity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete severity
  async deleteSeverity(req: Request, res: Response): Promise<void> {
    try {
      const severity = await Severity.findByIdAndDelete(req.params.id);
      
      if (!severity) {
        res.status(404).json({
          success: false,
          message: 'Severity not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Severity deleted successfully',
      });
    } catch (error) {
      console.error('Delete severity error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete severity',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}