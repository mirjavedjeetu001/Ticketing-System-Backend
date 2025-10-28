import { SLARule } from './sla-rule.model';
import { Priority } from './priority.model';
import { Severity } from './severity.model';

export class SLAService {
  /**
   * Calculate SLA times for a ticket based on severity and priority
   */
  static async calculateSLATimes(severityId: string, priorityId?: string): Promise<{
    responseTime?: Date;
    resolutionTime?: Date;
    slaRule?: any;
  }> {
    try {
      let slaRule = null;

      // First try to find SLA rule with both severity and priority
      if (priorityId) {
        slaRule = await SLARule.findOne({
          severityId,
          priorityId,
          isActive: true
        }).populate('severityId priorityId');
      }

      // If no rule found with priority, try with just severity
      if (!slaRule) {
        slaRule = await SLARule.findOne({
          severityId,
          isActive: true
        }).populate('severityId priorityId');
      }

      if (!slaRule) {
        return {};
      }

      const now = new Date();
      const responseTime = new Date(now.getTime() + (slaRule.responseTime * 60 * 1000));
      const resolutionTime = new Date(now.getTime() + (slaRule.resolutionTime * 60 * 1000));

      return {
        responseTime,
        resolutionTime,
        slaRule
      };
    } catch (error) {
      console.error('Error calculating SLA times:', error);
      return {};
    }
  }

  /**
   * Get all active SLA rules with populated references
   */
  static async getActiveSLARules() {
    return SLARule.find({ isActive: true })
      .populate('severityId', 'name level color')
      .populate('priorityId', 'name level color')
      .sort({ 'severityId.level': 1, 'priorityId.level': 1 });
  }

  /**
   * Get suggested priority based on severity and existing SLA rules
   */
  static async getSuggestedPriority(severityId: string): Promise<string | null> {
    try {
      const slaRule = await SLARule.findOne({
        severityId,
        isActive: true
      }).populate('priorityId');

      return slaRule?.priorityId?.toString() || null;
    } catch (error) {
      console.error('Error getting suggested priority:', error);
      return null;
    }
  }

  /**
   * Validate SLA rule creation/update
   */
  static async validateSLARule(severityId: string, priorityId: string, excludeId?: string): Promise<boolean> {
    try {
      const query: any = { severityId, priorityId };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }

      const existingRule = await SLARule.findOne(query);
      return !existingRule; // Return true if no existing rule found
    } catch (error) {
      console.error('Error validating SLA rule:', error);
      return false;
    }
  }
}