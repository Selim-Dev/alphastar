import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetAuditLogRepository } from '../repositories/budget-audit-log.repository';
import { AuditLogFiltersDto } from '../dto/audit-log-filters.dto';

@Controller('budget-audit')
@UseGuards(JwtAuthGuard)
export class BudgetAuditController {
  constructor(
    private readonly auditLogRepository: BudgetAuditLogRepository,
  ) {}

  /**
   * Get audit log for a project with optional filters
   * GET /api/budget-audit/:projectId
   */
  @Get(':projectId')
  async getAuditLog(
    @Param('projectId') projectId: string,
    @Query() filters: AuditLogFiltersDto,
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException(`Invalid project ID format: ${projectId}`);
    }

    const auditFilters = {
      projectId: new Types.ObjectId(projectId),
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      userId: filters.userId ? new Types.ObjectId(filters.userId) : undefined,
      action: filters.action,
      entityType: filters.entityType,
    };

    const logs = await this.auditLogRepository.findAll(auditFilters);

    return {
      projectId,
      totalCount: logs.length,
      logs: logs.map((log) => ({
        id: log._id.toString(),
        entityType: log.entityType,
        entityId: log.entityId.toString(),
        action: log.action,
        fieldChanged: log.fieldChanged,
        oldValue: log.oldValue,
        newValue: log.newValue,
        userId: log.userId.toString(),
        userName: (log.userId as any).name || 'Unknown User',
        userEmail: (log.userId as any).email || '',
        timestamp: log.timestamp,
      })),
    };
  }

  /**
   * Get audit log summary for a project
   * GET /api/budget-audit/:projectId/summary
   */
  @Get(':projectId/summary')
  async getAuditSummary(@Param('projectId') projectId: string) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException(`Invalid project ID format: ${projectId}`);
    }

    const summary = await this.auditLogRepository.getSummary(
      new Types.ObjectId(projectId),
    );

    return {
      projectId,
      totalChanges: summary.totalChanges,
      changesByUser: summary.changesByUser.map((item) => ({
        userId: item.userId.toString(),
        userName: item.userName,
        changeCount: item.changeCount,
      })),
      changesByType: summary.changesByType,
      recentChanges: summary.recentChanges.map((log) => ({
        id: log._id.toString(),
        entityType: log.entityType,
        entityId: log.entityId.toString(),
        action: log.action,
        fieldChanged: log.fieldChanged,
        oldValue: log.oldValue,
        newValue: log.newValue,
        userId: log.userId.toString(),
        userName: (log.userId as any).name || 'Unknown User',
        timestamp: log.timestamp,
      })),
    };
  }
}
