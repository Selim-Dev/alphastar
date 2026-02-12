import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  BudgetAuditLog,
  BudgetAuditLogDocument,
} from '../schemas/budget-audit-log.schema';

export interface CreateAuditLogDto {
  projectId: Types.ObjectId;
  entityType: 'project' | 'planRow' | 'actual';
  entityId: Types.ObjectId;
  action: 'create' | 'update' | 'delete';
  fieldChanged?: string;
  oldValue?: any;
  newValue?: any;
  userId: Types.ObjectId;
}

export interface AuditLogFilters {
  projectId: Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  userId?: Types.ObjectId;
  action?: 'create' | 'update' | 'delete';
  entityType?: 'project' | 'planRow' | 'actual';
}

export interface AuditLogSummary {
  totalChanges: number;
  changesByUser: Array<{
    userId: Types.ObjectId;
    userName: string;
    changeCount: number;
  }>;
  changesByType: Array<{
    action: string;
    count: number;
  }>;
  recentChanges: BudgetAuditLogDocument[];
}

@Injectable()
export class BudgetAuditLogRepository {
  constructor(
    @InjectModel(BudgetAuditLog.name)
    private auditLogModel: Model<BudgetAuditLogDocument>,
  ) {}

  /**
   * Create a new audit log entry
   */
  async create(dto: CreateAuditLogDto): Promise<BudgetAuditLogDocument> {
    const auditLog = new this.auditLogModel({
      ...dto,
      timestamp: new Date(),
    });
    return auditLog.save();
  }

  /**
   * Find audit logs with filters
   */
  async findAll(filters: AuditLogFilters): Promise<BudgetAuditLogDocument[]> {
    const query: any = {
      projectId: filters.projectId,
    };

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.entityType) {
      query.entityType = filters.entityType;
    }

    return this.auditLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'name email')
      .exec();
  }

  /**
   * Get audit log summary for a project
   */
  async getSummary(projectId: Types.ObjectId): Promise<AuditLogSummary> {
    const logs = await this.auditLogModel
      .find({ projectId })
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .exec();

    // Count total changes
    const totalChanges = logs.length;

    // Group by user
    const userChanges = new Map<string, { name: string; count: number }>();
    logs.forEach((log) => {
      const userId = log.userId.toString();
      const userName = (log.userId as any).name || 'Unknown User';
      if (userChanges.has(userId)) {
        userChanges.get(userId)!.count++;
      } else {
        userChanges.set(userId, { name: userName, count: 1 });
      }
    });

    const changesByUser = Array.from(userChanges.entries()).map(
      ([userId, data]) => ({
        userId: new Types.ObjectId(userId),
        userName: data.name,
        changeCount: data.count,
      }),
    );

    // Group by action type
    const actionCounts = new Map<string, number>();
    logs.forEach((log) => {
      const action = log.action;
      actionCounts.set(action, (actionCounts.get(action) || 0) + 1);
    });

    const changesByType = Array.from(actionCounts.entries()).map(
      ([action, count]) => ({
        action,
        count,
      }),
    );

    // Get recent changes (last 10)
    const recentChanges = logs.slice(0, 10);

    return {
      totalChanges,
      changesByUser,
      changesByType,
      recentChanges,
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async findByEntity(
    entityType: 'project' | 'planRow' | 'actual',
    entityId: Types.ObjectId,
  ): Promise<BudgetAuditLogDocument[]> {
    return this.auditLogModel
      .find({ entityType, entityId })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email')
      .exec();
  }

  /**
   * Delete all audit logs for a project (when project is deleted)
   */
  async deleteByProjectId(projectId: string): Promise<void> {
    await this.auditLogModel.deleteMany({ projectId: new Types.ObjectId(projectId) }).exec();
  }
}
