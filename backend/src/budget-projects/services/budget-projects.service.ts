import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BudgetProjectRepository } from '../repositories/budget-project.repository';
import { BudgetPlanRowRepository } from '../repositories/budget-plan-row.repository';
import { BudgetActualRepository } from '../repositories/budget-actual.repository';
import { BudgetAuditLogRepository } from '../repositories/budget-audit-log.repository';
import { BudgetTemplatesService } from './budget-templates.service';
import { AircraftService } from '../../aircraft/services/aircraft.service';
import { CreateBudgetProjectDto } from '../dto/create-budget-project.dto';
import { UpdateBudgetProjectDto } from '../dto/update-budget-project.dto';
import { BudgetProjectFiltersDto } from '../dto/budget-project-filters.dto';
import { UpdatePlanRowDto } from '../dto/update-plan-row.dto';
import { UpdateActualDto } from '../dto/update-actual.dto';
import { BudgetProjectDocument } from '../schemas/budget-project.schema';

@Injectable()
export class BudgetProjectsService {
  constructor(
    private readonly projectRepository: BudgetProjectRepository,
    private readonly planRowRepository: BudgetPlanRowRepository,
    private readonly actualRepository: BudgetActualRepository,
    private readonly auditLogRepository: BudgetAuditLogRepository,
    private readonly templatesService: BudgetTemplatesService,
    private readonly aircraftService: AircraftService,
  ) {}

  /**
   * Create a new budget project with plan rows
   */
  async create(
    dto: CreateBudgetProjectDto,
    userId: string,
  ): Promise<BudgetProjectDocument> {
    // Validate template type
    if (!this.templatesService.validateTemplateType(dto.templateType)) {
      throw new BadRequestException(`Invalid template type: ${dto.templateType}`);
    }

    // Check for duplicate name
    const exists = await this.projectRepository.existsByName(dto.name);
    if (exists) {
      throw new ConflictException(`Budget project with name '${dto.name}' already exists`);
    }

    // Validate date range
    const startDate = new Date(dto.dateRange.start);
    const endDate = new Date(dto.dateRange.end);
    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Resolve aircraft scope
    const aircraftIds = await this.resolveAircraftScope(dto.aircraftScope);

    // Create project
    const project = await this.projectRepository.create({
      name: dto.name,
      templateType: dto.templateType,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      currency: dto.currency,
      aircraftScope: {
        type: dto.aircraftScope.type,
        aircraftIds: dto.aircraftScope.aircraftIds?.map((id) => new Types.ObjectId(id)),
        aircraftTypes: dto.aircraftScope.aircraftTypes,
        fleetGroups: dto.aircraftScope.fleetGroups,
      },
      status: dto.status || 'draft',
      createdBy: new Types.ObjectId(userId),
    });

    // Generate plan rows
    await this.generatePlanRows(project._id.toString(), dto.templateType, aircraftIds);

    // Log audit entry
    await this.auditLogRepository.create({
      projectId: project._id,
      entityType: 'project',
      entityId: project._id,
      action: 'create',
      userId: new Types.ObjectId(userId),
    });

    return project;
  }

  /**
   * Find all projects with optional filters
   */
  async findAll(filters: BudgetProjectFiltersDto): Promise<BudgetProjectDocument[]> {
    return this.projectRepository.findAll(filters);
  }

  /**
   * Find a project by ID
   */
  async findOne(id: string): Promise<BudgetProjectDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid project ID format: ${id}`);
    }

    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${id} not found`);
    }

    return project;
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    dto: UpdateBudgetProjectDto,
    userId: string,
  ): Promise<BudgetProjectDocument> {
    const project = await this.findOne(id);

    // Check for duplicate name if name is being changed
    if (dto.name && dto.name !== project.name) {
      const exists = await this.projectRepository.existsByNameExcludingId(dto.name, id);
      if (exists) {
        throw new ConflictException(`Budget project with name '${dto.name}' already exists`);
      }
    }

    // Validate date range if provided
    if (dto.dateRange) {
      const startDate = new Date(dto.dateRange.start);
      const endDate = new Date(dto.dateRange.end);
      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.status) updateData.status = dto.status;
    if (dto.dateRange) {
      updateData.dateRange = {
        start: new Date(dto.dateRange.start),
        end: new Date(dto.dateRange.end),
      };
    }

    const updated = await this.projectRepository.update(id, updateData);

    // Log audit entries for each changed field
    if (dto.name && dto.name !== project.name) {
      await this.auditLogRepository.create({
        projectId: new Types.ObjectId(id),
        entityType: 'project',
        entityId: new Types.ObjectId(id),
        action: 'update',
        fieldChanged: 'name',
        oldValue: project.name,
        newValue: dto.name,
        userId: new Types.ObjectId(userId),
      });
    }

    if (dto.status && dto.status !== project.status) {
      await this.auditLogRepository.create({
        projectId: new Types.ObjectId(id),
        entityType: 'project',
        entityId: new Types.ObjectId(id),
        action: 'update',
        fieldChanged: 'status',
        oldValue: project.status,
        newValue: dto.status,
        userId: new Types.ObjectId(userId),
      });
    }

    if (dto.dateRange) {
      const oldStart = project.dateRange.start.toISOString();
      const oldEnd = project.dateRange.end.toISOString();
      const newStart = new Date(dto.dateRange.start).toISOString();
      const newEnd = new Date(dto.dateRange.end).toISOString();

      if (oldStart !== newStart || oldEnd !== newEnd) {
        await this.auditLogRepository.create({
          projectId: new Types.ObjectId(id),
          entityType: 'project',
          entityId: new Types.ObjectId(id),
          action: 'update',
          fieldChanged: 'dateRange',
          oldValue: { start: oldStart, end: oldEnd },
          newValue: { start: newStart, end: newEnd },
          userId: new Types.ObjectId(userId),
        });
      }
    }

    return updated!;
  }

  /**
   * Delete a project and all related data
   */
  async delete(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    // Log audit entry BEFORE deletion
    await this.auditLogRepository.create({
      projectId: new Types.ObjectId(id),
      entityType: 'project',
      entityId: new Types.ObjectId(id),
      action: 'delete',
      oldValue: {
        name: project.name,
        templateType: project.templateType,
        status: project.status,
      },
      userId: new Types.ObjectId(userId),
    });

    // Delete plan rows
    await this.planRowRepository.deleteByProjectId(id);

    // Delete actuals
    await this.actualRepository.deleteByProjectId(id);

    // Delete audit logs (after logging the deletion)
    await this.auditLogRepository.deleteByProjectId(id);

    // Delete project
    await this.projectRepository.delete(id);
  }

  /**
   * Update a plan row's planned amount
   */
  async updatePlanRow(
    projectId: string,
    rowId: string,
    dto: UpdatePlanRowDto,
    userId: string,
  ): Promise<void> {
    // Verify project exists
    await this.findOne(projectId);

    // Verify row exists and belongs to project
    const row = await this.planRowRepository.findById(rowId);
    if (!row) {
      throw new NotFoundException(`Plan row with ID ${rowId} not found`);
    }

    if (row.projectId.toString() !== projectId) {
      throw new BadRequestException('Plan row does not belong to this project');
    }

    const oldValue = row.plannedAmount;

    // Update row
    await this.planRowRepository.update(rowId, {
      plannedAmount: dto.plannedAmount,
    });

    // Log audit entry
    await this.auditLogRepository.create({
      projectId: new Types.ObjectId(projectId),
      entityType: 'planRow',
      entityId: new Types.ObjectId(rowId),
      action: 'update',
      fieldChanged: 'plannedAmount',
      oldValue,
      newValue: dto.plannedAmount,
      userId: new Types.ObjectId(userId),
    });
  }

  /**
   * Update or create an actual spend entry
   */
  async updateActual(
    projectId: string,
    period: string,
    dto: UpdateActualDto,
    userId: string,
  ): Promise<void> {
    // Verify project exists
    const project = await this.findOne(projectId);

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new BadRequestException('Period must be in YYYY-MM format');
    }

    // Validate period is within project date range
    const periodDate = new Date(`${period}-01`);
    if (periodDate < project.dateRange.start || periodDate > project.dateRange.end) {
      throw new BadRequestException('Period is outside project date range');
    }

    // Find existing actual
    const existing = await this.actualRepository.findByProjectTermAndPeriod(
      projectId,
      dto.termId,
      period,
      dto.aircraftId,
    );

    const oldValue = existing?.amount;

    // Upsert actual
    const actual = await this.actualRepository.upsert(
      projectId,
      dto.termId,
      period,
      dto.amount,
      userId,
      dto.aircraftId,
      dto.aircraftType,
      dto.notes,
    );

    // Log audit entry
    await this.auditLogRepository.create({
      projectId: new Types.ObjectId(projectId),
      entityType: 'actual',
      entityId: actual._id,
      action: existing ? 'update' : 'create',
      fieldChanged: 'amount',
      oldValue,
      newValue: dto.amount,
      userId: new Types.ObjectId(userId),
    });
  }

  /**
   * Get table data for a project (plan rows + actuals formatted for display)
   */
  async getTableData(projectId: string): Promise<any> {
    // Verify project exists
    const project = await this.findOne(projectId);

    // Get all plan rows
    const planRows = await this.planRowRepository.findByProjectId(projectId);

    // Get all actuals
    const actuals = await this.actualRepository.findByProjectId(projectId);

    // Generate periods from project date range
    const periods = this.generatePeriods(project.dateRange.start, project.dateRange.end);

    // Build actuals map: termKey -> period -> amount
    const actualsMap = new Map<string, Map<string, number>>();
    for (const actual of actuals) {
      const termKey = actual.aircraftId
        ? `${actual.termId}_${actual.aircraftId.toString()}`
        : actual.termId;

      if (!actualsMap.has(termKey)) {
        actualsMap.set(termKey, new Map<string, number>());
      }

      const periodMap = actualsMap.get(termKey)!;
      const currentAmount = periodMap.get(actual.period) || 0;
      periodMap.set(actual.period, currentAmount + actual.amount);
    }

    // Build table rows
    const rows = planRows.map((planRow) => {
      const termKey = planRow.aircraftId
        ? `${planRow.termId}_${planRow.aircraftId.toString()}`
        : planRow.termId;

      const periodMap = actualsMap.get(termKey) || new Map<string, number>();
      const actualsRecord: Record<string, number> = {};
      let totalSpent = 0;

      for (const period of periods) {
        const amount = periodMap.get(period) || 0;
        actualsRecord[period] = amount;
        totalSpent += amount;
      }

      const remaining = planRow.plannedAmount - totalSpent;
      const variance = remaining;
      const variancePercent =
        planRow.plannedAmount > 0 ? (variance / planRow.plannedAmount) * 100 : 0;

      return {
        rowId: planRow._id.toString(),
        termId: planRow.termId,
        termName: planRow.termName,
        termCategory: planRow.termCategory,
        aircraftId: planRow.aircraftId?.toString(),
        aircraftType: planRow.aircraftType,
        plannedAmount: planRow.plannedAmount,
        actuals: actualsRecord,
        totalSpent,
        remaining,
        variance,
        variancePercent,
      };
    });

    // Calculate column totals (sum of all terms for each period)
    const columnTotals: Record<string, number> = {};
    for (const period of periods) {
      columnTotals[period] = rows.reduce((sum, row) => sum + (row.actuals[period] || 0), 0);
    }

    // Calculate grand totals
    const totalBudgeted = rows.reduce((sum, row) => sum + row.plannedAmount, 0);
    const totalSpent = rows.reduce((sum, row) => sum + row.totalSpent, 0);
    const totalRemaining = totalBudgeted - totalSpent;

    return {
      projectId,
      periods,
      rows,
      columnTotals,
      grandTotal: {
        budgeted: totalBudgeted,
        spent: totalSpent,
        remaining: totalRemaining,
      },
    };
  }

  /**
   * Generate list of periods (YYYY-MM) from start to end date
   */
  private generatePeriods(startDate: Date, endDate: Date): string[] {
    const periods: string[] = [];
    const current = new Date(startDate);
    current.setDate(1); // Set to first day of month

    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }

    return periods;
  }

  /**
   * Resolve aircraft scope to list of aircraft IDs
   */
  private async resolveAircraftScope(scope: any): Promise<string[]> {
    if (scope.type === 'individual' && scope.aircraftIds) {
      // Validate all aircraft IDs exist
      for (const id of scope.aircraftIds) {
        await this.aircraftService.findById(id);
      }
      return scope.aircraftIds;
    }

    if (scope.type === 'type' && scope.aircraftTypes) {
      // Find all aircraft of specified types
      const allAircraft = await this.aircraftService.findAll({});
      return allAircraft.data
        .filter((a) => scope.aircraftTypes.includes(a.aircraftType))
        .map((a) => a._id.toString());
    }

    if (scope.type === 'group' && scope.fleetGroups) {
      // Find all aircraft in specified fleet groups
      const allAircraft = await this.aircraftService.findAll({});
      return allAircraft.data
        .filter((a) => scope.fleetGroups.includes(a.fleetGroup))
        .map((a) => a._id.toString());
    }

    return [];
  }

  /**
   * Generate plan rows for all term × aircraft combinations
   */
  private async generatePlanRows(
    projectId: string,
    templateType: string,
    aircraftIds: string[],
  ): Promise<void> {
    const terms = this.templatesService.getSpendingTerms(templateType);
    const rows: any[] = [];

    for (const term of terms) {
      if (aircraftIds.length === 0) {
        // No aircraft scope - create one row per term
        rows.push({
          projectId: new Types.ObjectId(projectId),
          termId: term.id,
          termName: term.name,
          termCategory: term.category,
          plannedAmount: 0,
        });
      } else {
        // Create one row per term × aircraft combination
        for (const aircraftId of aircraftIds) {
          const aircraft = await this.aircraftService.findById(aircraftId);
          rows.push({
            projectId: new Types.ObjectId(projectId),
            termId: term.id,
            termName: term.name,
            termCategory: term.category,
            aircraftId: new Types.ObjectId(aircraftId),
            aircraftType: aircraft.aircraftType,
            plannedAmount: 0,
          });
        }
      }
    }

    await this.planRowRepository.createMany(rows);
  }
}
