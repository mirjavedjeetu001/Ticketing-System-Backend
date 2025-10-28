import { Request, Response } from 'express';
import { SLARule } from './sla-rule.model';
import { SLAService } from './sla.service';

export class SLAController {
  // Get system settings overview (severities, priorities, SLA rules)
  async getSystemOverview(req: Request, res: Response): Promise<void> {
    try {
      const [severities, priorities, slaRules] = await Promise.all([
        import('./severity.model').then(m => m.Severity.find({ isActive: true }).sort({ level: 1 })),
        import('./priority.model').then(m => m.Priority.find({ isActive: true }).sort({ level: 1 })),
        SLAService.getActiveSLARules()
      ]);

      res.json({
        success: true,
        data: {
          severities,
          priorities,
          slaRules,
        },
      });
    } catch (error) {
      console.error('Get system overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch system overview',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get all SLA rules
  async getSLARules(req: Request, res: Response): Promise<void> {
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

      const slaRules = await SLARule.find(query)
        .populate('severityId', 'name level color')
        .populate('priorityId', 'name level color')
        .populate('escalationRules.escalateTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await SLARule.countDocuments(query);

      res.json({
        success: true,
        data: {
          slaRules,
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Get SLA rules error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch SLA rules',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get SLA rule by ID
  async getSLARuleById(req: Request, res: Response): Promise<void> {
    try {
      const slaRule = await SLARule.findById(req.params.id)
        .populate('severityId', 'name level color')
        .populate('priorityId', 'name level color')
        .populate('escalationRules.escalateTo', 'firstName lastName email');
      
      if (!slaRule) {
        res.status(404).json({
          success: false,
          message: 'SLA rule not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { slaRule },
      });
    } catch (error) {
      console.error('Get SLA rule by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch SLA rule',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create SLA rule
  async createSLARule(req: Request, res: Response): Promise<void> {
    try {
      const { 
        name, 
        description, 
        severityId, 
        priorityId, 
        responseTime, 
        resolutionTime, 
        escalationRules 
      } = req.body;

      // Validate SLA rule using the service
      const isValid = await SLAService.validateSLARule(severityId, priorityId);
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'SLA rule for this severity and priority combination already exists',
        });
        return;
      }

      const slaRule = new SLARule({
        name,
        description,
        severityId,
        priorityId,
        responseTime,
        resolutionTime,
        escalationRules: escalationRules || [],
      });

      await slaRule.save();

      // Populate the created rule
      await slaRule.populate([
        { path: 'severityId', select: 'name level color' },
        { path: 'priorityId', select: 'name level color' },
        { path: 'escalationRules.escalateTo', select: 'firstName lastName email' }
      ]);

      res.status(201).json({
        success: true,
        message: 'SLA rule created successfully',
        data: { slaRule },
      });
    } catch (error) {
      console.error('Create SLA rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create SLA rule',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update SLA rule
  async updateSLARule(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { 
        name, 
        description, 
        severityId, 
        priorityId, 
        responseTime, 
        resolutionTime, 
        escalationRules,
        isActive 
      } = req.body;

      // Validate SLA rule update using the service
      if (severityId && priorityId) {
        const isValid = await SLAService.validateSLARule(severityId, priorityId, id);
        if (!isValid) {
          res.status(400).json({
            success: false,
            message: 'Another SLA rule for this severity and priority combination already exists',
          });
          return;
        }
      }

      const slaRule = await SLARule.findByIdAndUpdate(
        id,
        { 
          name, 
          description, 
          severityId, 
          priorityId, 
          responseTime, 
          resolutionTime, 
          escalationRules,
          isActive 
        },
        { new: true, runValidators: true }
      ).populate([
        { path: 'severityId', select: 'name level color' },
        { path: 'priorityId', select: 'name level color' },
        { path: 'escalationRules.escalateTo', select: 'firstName lastName email' }
      ]);

      if (!slaRule) {
        res.status(404).json({
          success: false,
          message: 'SLA rule not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'SLA rule updated successfully',
        data: { slaRule },
      });
    } catch (error) {
      console.error('Update SLA rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update SLA rule',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Delete SLA rule
  async deleteSLARule(req: Request, res: Response): Promise<void> {
    try {
      const slaRule = await SLARule.findByIdAndDelete(req.params.id);
      
      if (!slaRule) {
        res.status(404).json({
          success: false,
          message: 'SLA rule not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'SLA rule deleted successfully',
      });
    } catch (error) {
      console.error('Delete SLA rule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete SLA rule',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}