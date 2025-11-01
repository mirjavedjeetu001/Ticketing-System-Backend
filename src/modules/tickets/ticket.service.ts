import { Ticket, ITicket } from './ticket.model';
import { User } from '../users/user.model';
import { IssueCategory } from '../categories/category.model';
import { SLARule } from '../system-settings/sla-rule.model';
import { SLAService } from '../system-settings/sla.service';
import { TicketIdService } from './ticketId.service';
import { NotFoundError, ValidationError, AuthorizationError } from '../../common/errors/AppError';
import { Types, Schema } from 'mongoose';

export interface TicketFilter {
  status?: string | string[];
  priority?: string | string[];
  assignee?: string;
  createdBy?: string;
  department?: string;
  product?: string;
  tags?: string[];
  search?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  createdDate?: {
    from?: Date;
    to?: Date;
  };
  isOverdue?: boolean;
}

export interface TicketListOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class TicketService {
  static async createTicket(ticketData: {
    title: string;
    description?: string;
    createdBy: string;
    severityId?: string;
    department?: string;
    productId?: string;
    categoryId?: string;
    assigneeId?: string;
    assignToProductTeam?: boolean;
    departmentId?: string;
    tags?: string[];
    mentions?: string[];
    estimatedHours?: number;
    dueDate?: Date;
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      uploadedAt: Date;
    }>;
  }): Promise<ITicket> {
    // Validate required fields
    if (!ticketData.productId) {
      throw new ValidationError('Product is required');
    }
    if (!ticketData.categoryId) {
      throw new ValidationError('Category is required');
    }
    if (!ticketData.severityId) {
      throw new ValidationError('Severity is required');
    }

    // Skip user validation for now to avoid the findById error
    // const creator = await User.findById(ticketData.createdBy);
    // if (!creator) {
    //   throw new NotFoundError('Creator not found');
    // }

    // Get default priority from category or suggest one based on severity
    let defaultPriorityId: string | undefined;
    let responseTime: Date | undefined;
    let resolutionTime: Date | undefined;

    try {
      // First try to get default priority from category
      const category = await IssueCategory.findById(ticketData.categoryId);
      if (category && category.defaultPriorityId) {
        defaultPriorityId = category.defaultPriorityId.toString();
      } else {
        // Suggest priority based on severity and existing SLA rules
        const suggestedPriority = await SLAService.getSuggestedPriority(ticketData.severityId);
        defaultPriorityId = suggestedPriority || undefined;
      }

      // Calculate SLA times using the new service
      if (defaultPriorityId) {
        const slaData = await SLAService.calculateSLATimes(ticketData.severityId, defaultPriorityId);
        responseTime = slaData.responseTime;
        resolutionTime = slaData.resolutionTime;
      }
    } catch (error) {
      console.warn('Could not calculate SLA times:', error);
      // Continue with fallback values
    }

    // Generate unique ticket ID
    const ticketId = await TicketIdService.generateTicketId(ticketData.productId);

    // Process mentions to get mentioned user IDs
    const mentionedUserIds = await this.processMentions(ticketData.mentions || []);

    // Create ticket
    const ticket = new Ticket({
      title: ticketData.title,
      description: ticketData.description,
      createdBy: ticketData.createdBy,
      assignee: ticketData.assigneeId || (mentionedUserIds.length === 1 ? mentionedUserIds[0] : undefined),
      assignedBy: (ticketData.assigneeId || mentionedUserIds.length > 0) ? ticketData.createdBy : undefined,
      severityId: ticketData.severityId,
      priorityId: defaultPriorityId,
      department: ticketData.department,
      productId: ticketData.productId,
      categoryId: ticketData.categoryId,
      assignToProductTeam: ticketData.assignToProductTeam || false,
      assignedDepartmentId: ticketData.departmentId || undefined,
      tags: ticketData.tags || [],
      mentions: ticketData.mentions || [],
      mentionedUsers: mentionedUserIds,
      estimatedHours: ticketData.estimatedHours,
      dueDate: ticketData.dueDate || resolutionTime, // Use SLA resolution time as due date if no custom due date
      slaResponseDue: responseTime,
      slaResolutionDue: resolutionTime,
      status: 'open',
      ticketId,
      attachments: ticketData.attachments || [],
    });

    // Add initial activity log
    await this.addActivityLog(
      ticket,
      ticketData.createdBy,
      'ticket_created',
      `Ticket created`
    );

    // Add activity log for mentions
    if (mentionedUserIds.length > 0) {
      await this.addActivityLog(
        ticket,
        ticketData.createdBy,
        'users_mentioned',
        `Mentioned ${mentionedUserIds.length} user(s) in ticket`
      );
    }

    await ticket.save();
    return this.getTicketById(ticket._id);
  }

  // Helper method to find ticket by either ticketId or MongoDB _id
  private static async findTicket(id: string): Promise<ITicket | null> {
    // First try to find by ticketId (e.g., SBE-1)
    let ticket = await Ticket.findOne({ ticketId: id });
    
    if (!ticket) {
      // Try by MongoDB _id if ticketId doesn't work
      try {
        ticket = await Ticket.findById(id);
      } catch (error) {
        // If ID is not a valid ObjectId, return null
        return null;
      }
    }
    
    return ticket;
  }

  static async getTicketById(id: string): Promise<ITicket> {
    // First try to find by ticketId (e.g., SBE-1), then by MongoDB _id
    let ticket = await Ticket.findOne({ ticketId: id })
      .populate('createdBy', 'firstName lastName email role department')
      .populate('assignee', 'firstName lastName email role department')
      .populate('assignedBy', 'firstName lastName email role department')
      .populate('mentionedUsers', 'firstName lastName email role department')
      .populate('productId', 'name abbreviation category color')
      .populate('categoryId', 'name description color')
      .populate('severityId', 'level name description color')
      .populate('priorityId', 'level name description color')
      .populate('comments.author', 'firstName lastName email role')
      .populate('activityLog.user', 'firstName lastName email role');

    if (!ticket) {
      // Try by MongoDB _id if ticketId doesn't work
      try {
        ticket = await Ticket.findById(id)
          .populate('createdBy', 'firstName lastName email role department')
          .populate('assignee', 'firstName lastName email role department')
          .populate('assignedBy', 'firstName lastName email role department')
          .populate('mentionedUsers', 'firstName lastName email role department')
          .populate('productId', 'name abbreviation category color')
          .populate('categoryId', 'name description color')
          .populate('severityId', 'level name description color')
          .populate('priorityId', 'level name description color')
          .populate('comments.author', 'firstName lastName email role')
          .populate('activityLog.user', 'firstName lastName email role');
      } catch (error) {
        // If ID is not valid ObjectId, throw not found error
        throw new NotFoundError('Ticket not found');
      }
    }

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    return ticket;
  }

  static async updateTicket(
    id: string,
    updateData: Partial<ITicket>,
    userId: string,
    userRole: string
  ): Promise<ITicket> {
    const ticket = await this.findTicket(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Check permissions
    const canUpdate = await this.canUserModifyTicket(ticket, userId, userRole);
    if (!canUpdate) {
      throw new AuthorizationError('Not authorized to update this ticket');
    }

    // Track changes for activity logging
    const changes: Array<{field: string, oldValue: string, newValue: string, description: string}> = [];

    // Handle status transitions
    if (updateData.status && updateData.status !== ticket.status) {
      this.validateStatusTransition(ticket.status, updateData.status, userRole);
      changes.push({
        field: 'status',
        oldValue: ticket.status,
        newValue: updateData.status,
        description: `Status changed from ${ticket.status} to ${updateData.status}`
      });
    }

    // Track title changes
    if (updateData.title && updateData.title !== ticket.title) {
      changes.push({
        field: 'title',
        oldValue: ticket.title,
        newValue: updateData.title,
        description: `Title updated`
      });
    }

    // Track description changes
    if (updateData.description && updateData.description !== ticket.description) {
      changes.push({
        field: 'description',
        oldValue: ticket.description || '',
        newValue: updateData.description,
        description: `Description updated`
      });
    }

    // Update assignee validation - made more resilient
    if (updateData.assignee) {
      try {
        const assignee = await User.findById(updateData.assignee);
        if (!assignee || assignee.role === 'user') {
          throw new ValidationError('Invalid assignee - must be an agent or admin');
        }
        if (updateData.assignee.toString() !== ticket.assignee?.toString()) {
          const oldAssignee = ticket.assignee ? await User.findById(ticket.assignee) : null;
          changes.push({
            field: 'assignee',
            oldValue: oldAssignee ? `${oldAssignee.firstName} ${oldAssignee.lastName}` : 'Unassigned',
            newValue: `${assignee.firstName} ${assignee.lastName}`,
            description: `Assigned to ${assignee.firstName} ${assignee.lastName}`
          });
        }
      } catch (error) {
        console.error('Error validating assignee:', error);
        // Continue with update even if assignee validation fails
      }
    }

    // Update ticket
    Object.assign(ticket, updateData);

    // Add activity logs for changes
    for (const change of changes) {
      await this.addActivityLog(
        ticket,
        userId,
        `${change.field}_changed`,
        change.description,
        change.field,
        change.oldValue,
        change.newValue
      );
    }

    await ticket.save();

    return this.getTicketById(id);
  }

  static async deleteTicket(id: string, userId: string, userRole: string): Promise<void> {
    const ticket = await this.findTicket(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Only admins or ticket creator can delete
    if (userRole !== 'admin' && userRole !== 'super_admin' && ticket.createdBy.toString() !== userId) {
      throw new AuthorizationError('Not authorized to delete this ticket');
    }

    await Ticket.findByIdAndDelete(ticket._id);
  }

  static async listTickets(
    filter: TicketFilter = {},
    options: TicketListOptions = {},
    userId?: string,
    userRole?: string
  ): Promise<{
    tickets: ITicket[];
    total: number;
    page: number;
    totalPages: number;
    stats: {
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
    };
  }> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build query
    const query = await this.buildQuery(filter, userId, userRole);

    // Calculate skip
    const skip = (page - 1) * limit;

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries
    const [tickets, total, stats] = await Promise.all([
      Ticket.find(query)
        .populate('createdBy', 'firstName lastName email role department')
        .populate('assignee', 'firstName lastName email role department')
        .populate('assignedBy', 'firstName lastName email role department')
        .populate('mentionedUsers', 'firstName lastName email role department')
        .populate('productId', 'name abbreviation category color')
        .populate('categoryId', 'name description color')
        .populate('severityId', 'level name description color')
        .populate('priorityId', 'level name description color')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query),
      this.getTicketStats(filter, userId, userRole),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tickets,
      total,
      page,
      totalPages,
      stats,
    };
  }

  static async assignTicket(
    ticketId: string,
    assigneeId: string,
    assignerId: string,
    assignerRole: string
  ): Promise<ITicket> {
    // Only agents and admins can assign tickets
    if (!['agent', 'admin'].includes(assignerRole)) {
      throw new AuthorizationError('Only agents and admins can assign tickets');
    }

    // Validate assignee
    const assignee = await User.findById(assigneeId);
    if (!assignee || !['agent', 'admin'].includes(assignee.role)) {
      throw new ValidationError('Invalid assignee - must be an agent or admin');
    }

    // Update ticket
    return this.updateTicket(
      ticketId,
      { assignee: assigneeId as any },
      assignerId,
      assignerRole
    );
  }

  static async addComment(
    ticketId: string,
    content: string,
    authorId: string,
    isInternal = false,
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      uploadedAt: Date;
    }>
  ): Promise<ITicket> {
    const ticket = await this.findTicket(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Extract mentions from comment content
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex);
    const commentMentions = matches ? matches.map(m => m.substring(1)) : [];

    // Process mentions to get user IDs
    const newMentionedUserIds = await this.processMentions(commentMentions);

    // Add new mentioned users to the ticket's mentionedUsers array (avoid duplicates)
    if (newMentionedUserIds.length > 0) {
      const existingMentionedUsers = ticket.mentionedUsers?.map(id => id.toString()) || [];
      const uniqueNewMentions = newMentionedUserIds.filter(id => !existingMentionedUsers.includes(id));
      
      if (uniqueNewMentions.length > 0) {
        if (!ticket.mentionedUsers) ticket.mentionedUsers = [];
        ticket.mentionedUsers.push(...uniqueNewMentions as any);
        
        // Add to mentions array as well
        const newMentionNames = commentMentions.filter((mention, index) => 
          newMentionedUserIds[index] && !(ticket.mentions || []).includes(mention)
        );
        if (!ticket.mentions) ticket.mentions = [];
        ticket.mentions.push(...newMentionNames);
      }
    }

    // Add comment attachments to ticket attachments
    if (attachments && attachments.length > 0) {
      if (!ticket.attachments) ticket.attachments = [];
      ticket.attachments.push(...attachments);
    }

    // Add comment
    ticket.comments.push({
      author: authorId as any,
      content,
      createdAt: new Date(),
      isInternal,
    });

    // Add activity log for the comment
    const commentText = content || (attachments && attachments.length > 0 ? `${attachments.length} attachment(s)` : '');
    await this.addActivityLog(
      ticket,
      authorId,
      'comment_added',
      `Added ${isInternal ? 'internal ' : ''}comment: "${commentText.length > 50 ? commentText.substring(0, 50) + '...' : commentText}"`
    );

    // Add activity log for new mentions in comment
    if (newMentionedUserIds.length > 0) {
      await this.addActivityLog(
        ticket,
        authorId,
        'users_mentioned',
        `Mentioned ${newMentionedUserIds.length} user(s) in comment`
      );
    }

    await ticket.save();
    return this.getTicketById(ticketId);
  }

  static async getTicketStats(
    filter: TicketFilter = {},
    userId?: string,
    userRole?: string
  ): Promise<{
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    const baseQuery = await this.buildQuery(filter, userId, userRole);

    const [open, inProgress, resolved, closed] = await Promise.all([
      Ticket.countDocuments({ ...baseQuery, status: 'open' }),
      Ticket.countDocuments({ ...baseQuery, status: 'in_progress' }),
      Ticket.countDocuments({ ...baseQuery, status: 'resolved' }),
      Ticket.countDocuments({ ...baseQuery, status: 'closed' }),
    ]);

    return { open, inProgress, resolved, closed };
  }

  private static async buildQuery(
    filter: TicketFilter,
    userId?: string,
    userRole?: string
  ): Promise<any> {
    const query: any = {};

    // Role-based filtering with department and product access support
    if (userRole === 'user') {
      // Users see tickets they created OR where they were mentioned
      query.$or = [
        { createdBy: userId },
        { mentionedUsers: userId }
      ];
    } else if (userRole === 'agent' && userId) {
      // Get user's department and product access
      const user = await User.findById(userId).populate('departmentId productAccess');
      if (!user) {
        query._id = null; // Return no results if user not found
        return query;
      }

      const conditions: any[] = [
        // 1. Tickets created by them
        { createdBy: userId },
        // 2. Tickets assigned to them directly
        { assignee: userId },
        // 3. Tickets where they were mentioned
        { mentionedUsers: userId },
      ];

      // 4. Tickets assigned to their department
      if (user.departmentId) {
        conditions.push({ assignedDepartmentId: user.departmentId });
      }

      // 5. Tickets assigned to product teams they have access to
      if (user.productAccess && user.productAccess.length > 0) {
        conditions.push({
          assignToProductTeam: true,
          productId: { $in: user.productAccess }
        });
      }

      query.$or = conditions;
    }
    // Admins see all tickets (no additional filtering)

    // Apply filters
    if (filter.status) {
      query.status = Array.isArray(filter.status) 
        ? { $in: filter.status }
        : filter.status;
    }

    if (filter.priority) {
      query.priority = Array.isArray(filter.priority)
        ? { $in: filter.priority }
        : filter.priority;
    }

    if (filter.assignee) {
      query.assignee = filter.assignee;
    }

    if (filter.createdBy) {
      query.createdBy = filter.createdBy;
    }

    if (filter.department) {
      query.department = filter.department;
    }

    if (filter.product) {
      query.productId = filter.product;
    }

    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags };
    }

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    if (filter.dueDate) {
      const dueDateQuery: any = {};
      if (filter.dueDate.from) dueDateQuery.$gte = filter.dueDate.from;
      if (filter.dueDate.to) dueDateQuery.$lte = filter.dueDate.to;
      if (Object.keys(dueDateQuery).length > 0) {
        query.dueDate = dueDateQuery;
      }
    }

    if (filter.createdDate) {
      const createdDateQuery: any = {};
      if (filter.createdDate.from) createdDateQuery.$gte = filter.createdDate.from;
      if (filter.createdDate.to) createdDateQuery.$lte = filter.createdDate.to;
      if (Object.keys(createdDateQuery).length > 0) {
        query.createdAt = createdDateQuery;
      }
    }

    if (filter.isOverdue) {
      query.dueDate = { $lt: new Date() };
      query.status = { $nin: ['resolved', 'closed'] };
    }

    return query;
  }

  private static async canUserModifyTicket(
    ticket: ITicket,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    // Admins can modify any ticket
    if (userRole === 'admin' || userRole === 'super_admin') {
      return true;
    }

    // Ticket creators can modify their own tickets
    if (ticket.createdBy.toString() === userId) {
      return true;
    }

    // Assigned agents can modify tickets assigned to them
    if (ticket.assignee?.toString() === userId) {
      return true;
    }

    // Mentioned users can modify tickets they're mentioned in
    if (ticket.mentions && ticket.mentions.some((m: any) => m.toString() === userId)) {
      return true;
    }

    // Department members can modify tickets assigned to their department
    if (ticket.assignedDepartmentId) {
      const user = await User.findById(userId);
      if (user?.departmentId?.toString() === ticket.assignedDepartmentId.toString()) {
        return true;
      }
    }

    // Product team members can modify tickets assigned to product team
    if (ticket.assignToProductTeam) {
      const user = await User.findById(userId).populate('productAccess');
      if (user?.productAccess?.some((p: any) => p.toString() === ticket.productId.toString())) {
        return true;
      }
    }

    return false;
  }

  static async resolveTicket(
    ticketId: string,
    resolution: string,
    userId: string,
    userRole: string
  ): Promise<ITicket> {
    const ticket = await this.findTicket(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Check permissions: Only assignees (including department members) and admins can resolve tickets
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      const canResolve = await this.canUserResolveTicket(ticket, userId);
      if (!canResolve) {
        throw new AuthorizationError('Only assigned members can resolve tickets');
      }
    }

    // Validate current status
    if (ticket.status === 'closed') {
      throw new ValidationError('Cannot resolve a closed ticket');
    }
    if (ticket.status === 'resolved') {
      throw new ValidationError('Ticket is already resolved');
    }

    // Update ticket
    ticket.status = 'resolved';
    ticket.resolution = resolution;
    ticket.resolvedAt = new Date();

    await ticket.save();
    return await ticket.populate([
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'assignee', select: 'firstName lastName email' },
      { path: 'productId', select: 'name' },
      { path: 'categoryId', select: 'name' },
      { path: 'assignedDepartmentId', select: 'name' }
    ]);
  }

  static async closeTicket(
    ticketId: string,
    userId: string,
    userRole: string
  ): Promise<ITicket> {
    const ticket = await this.findTicket(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Check permissions: Only ticket creators and admins can close tickets
    if (userRole !== 'admin' && userRole !== 'super_admin' && ticket.createdBy.toString() !== userId) {
      throw new AuthorizationError('Only ticket creators can close tickets');
    }

    // Validate current status - can only close resolved tickets
    if (ticket.status !== 'resolved') {
      throw new ValidationError('Can only close resolved tickets');
    }

    // Update ticket
    ticket.status = 'closed';
    ticket.closedAt = new Date();

    await ticket.save();
    return await ticket.populate([
      { path: 'createdBy', select: 'firstName lastName email' },
      { path: 'assignee', select: 'firstName lastName email' },
      { path: 'productId', select: 'name' },
      { path: 'categoryId', select: 'name' },
      { path: 'assignedDepartmentId', select: 'name' }
    ]);
  }

  private static async canUserResolveTicket(ticket: ITicket, userId: string): Promise<boolean> {
    // Direct assignee can resolve
    if (ticket.assignee?.toString() === userId) {
      return true;
    }

    // Department members can resolve if assigned to their department
    if (ticket.assignedDepartmentId) {
      const user = await User.findById(userId);
      if (user?.departmentId?.toString() === ticket.assignedDepartmentId.toString()) {
        return true;
      }
    }

    // Product team members can resolve if assigned to product team
    if (ticket.assignToProductTeam) {
      const user = await User.findById(userId).populate('productAccess');
      if (user?.productAccess?.some((p: any) => p.toString() === ticket.productId.toString())) {
        return true;
      }
    }

    return false;
  }

  private static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    userRole: string
  ): void {
    // Allow any status transitions - users can change status anytime
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new ValidationError(`Invalid status: ${newStatus}`);
    }

    // No restrictions - allow all status changes for all users
    return;
  }

  // Helper method to process mentions and return user IDs
  private static async processMentions(mentions: string[]): Promise<string[]> {
    if (!mentions || mentions.length === 0) return [];

    const userIds: string[] = [];
    const processedEmails = new Set<string>(); // Track processed emails to avoid duplicates
    
    for (const mention of mentions) {
      try {
        const cleanMention = mention.trim();
        
        // Check if mention looks like an email
        if (cleanMention.includes('@') && cleanMention.includes('.')) {
          // Skip if we already processed this email
          if (processedEmails.has(cleanMention.toLowerCase())) {
            continue;
          }
          
          const user = await User.findOne({ 
            email: { $regex: new RegExp(`^${cleanMention}$`, 'i') }, 
            isActive: true 
          });
          
          if (user) {
            userIds.push(user._id.toString());
            processedEmails.add(cleanMention.toLowerCase());
          } else {
            console.log(`User not found for email: ${cleanMention}`);
          }
        } else {
          // Try to find user by username or name (firstName or lastName)
          const users = await User.find({
            isActive: true,
            $or: [
              { username: { $regex: cleanMention, $options: 'i' } },
              { firstName: { $regex: cleanMention, $options: 'i' } },
              { lastName: { $regex: cleanMention, $options: 'i' } }
            ]
          }).limit(5); // Limit to prevent too many matches
          
          for (const user of users) {
            const userId = user._id.toString();
            if (!userIds.includes(userId)) {
              userIds.push(userId);
            }
          }
        }
      } catch (error) {
        console.error('Error processing mention:', mention, error);
      }
    }
    
    // Remove duplicates and return
    return [...new Set(userIds)];
  }

  // Helper method to add activity log entries
  private static async addActivityLog(
    ticket: ITicket,
    userId: string,
    action: string,
    description: string,
    field?: string,
    oldValue?: string,
    newValue?: string
  ): Promise<void> {
    ticket.activityLog.push({
      user: userId as any,
      action,
      field,
      oldValue,
      newValue,
      description,
      createdAt: new Date(),
    });
  }
}