import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  BudgetPlanRepository,
  BudgetPlanFilter,
} from '../repositories/budget-plan.repository';
import {
  ActualSpendRepository,
  ActualSpendFilter,
} from '../repositories/actual-spend.repository';
import { BudgetPlan, BudgetPlanDocument } from '../schemas/budget-plan.schema';
import { ActualSpend, ActualSpendDocument } from '../schemas/actual-spend.schema';
import { CreateBudgetPlanDto } from '../dto/create-budget-plan.dto';
import { UpdateBudgetPlanDto } from '../dto/update-budget-plan.dto';
import { CreateActualSpendDto } from '../dto/create-actual-spend.dto';
import { UpdateActualSpendDto } from '../dto/update-actual-spend.dto';

export interface BudgetVarianceResult {
  clauseId: number;
  clauseDescription: string;
  aircraftGroup: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  remainingBudget: number;
  utilizationPercentage: number;
}

export interface BurnRateResult {
  fiscalYear: number;
  aircraftGroup?: string;
  totalPlanned: number;
  totalSpent: number;
  monthsWithData: number;
  averageMonthlySpend: number;
  remainingBudget: number;
  projectedMonthsRemaining: number;
}

export interface CostEfficiencyResult {
  aircraftGroup?: string;
  aircraftId?: string;
  totalCost: number;
  totalFlightHours: number;
  totalCycles: number;
  costPerFlightHour: number;
  costPerCycle: number;
}

export interface BudgetPlanImportRow {
  fiscalYear: number;
  clauseId: number;
  clauseDescription: string;
  aircraftGroup: string;
  plannedAmount: number;
  currency?: string;
}

@Injectable()
export class BudgetService {
  constructor(
    private readonly budgetPlanRepository: BudgetPlanRepository,
    private readonly actualSpendRepository: ActualSpendRepository,
  ) {}

  // ==================== Budget Plan Methods ====================

  /**
   * Creates a new budget plan
   * Requirements: 7.1
   */
  async createBudgetPlan(dto: CreateBudgetPlanDto): Promise<BudgetPlanDocument> {
    const planData: Partial<BudgetPlan> = {
      fiscalYear: dto.fiscalYear,
      clauseId: dto.clauseId,
      clauseDescription: dto.clauseDescription,
      aircraftGroup: dto.aircraftGroup,
      plannedAmount: dto.plannedAmount,
      currency: dto.currency || 'USD',
    };

    try {
      return await this.budgetPlanRepository.create(planData);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Budget plan already exists for fiscal year ${dto.fiscalYear}, clause ${dto.clauseId}, aircraft group ${dto.aircraftGroup}`,
        );
      }
      throw error;
    }
  }

  /**
   * Imports budget plans from Excel data
   * Requirements: 7.1
   */
  async importBudgetPlans(
    rows: BudgetPlanImportRow[],
    replaceExisting = false,
  ): Promise<{ imported: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;

    for (const row of rows) {
      try {
        if (replaceExisting) {
          await this.budgetPlanRepository.upsert(
            row.fiscalYear,
            row.clauseId,
            row.aircraftGroup,
            {
              clauseDescription: row.clauseDescription,
              plannedAmount: row.plannedAmount,
              currency: row.currency || 'USD',
            },
          );
          updated++;
        } else {
          await this.budgetPlanRepository.create({
            fiscalYear: row.fiscalYear,
            clauseId: row.clauseId,
            clauseDescription: row.clauseDescription,
            aircraftGroup: row.aircraftGroup,
            plannedAmount: row.plannedAmount,
            currency: row.currency || 'USD',
          });
          imported++;
        }
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          errors.push(
            `Duplicate: fiscal year ${row.fiscalYear}, clause ${row.clauseId}, group ${row.aircraftGroup}`,
          );
        } else {
          errors.push(`Error importing row: ${(error as Error).message}`);
        }
      }
    }

    return { imported, updated, errors };
  }

  async findBudgetPlanById(id: string): Promise<BudgetPlanDocument> {
    const plan = await this.budgetPlanRepository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Budget plan with ID ${id} not found`);
    }
    return plan;
  }

  async findAllBudgetPlans(filter?: BudgetPlanFilter): Promise<BudgetPlanDocument[]> {
    return this.budgetPlanRepository.findAll(filter);
  }

  async updateBudgetPlan(
    id: string,
    dto: UpdateBudgetPlanDto,
  ): Promise<BudgetPlanDocument> {
    const plan = await this.budgetPlanRepository.update(id, dto);
    if (!plan) {
      throw new NotFoundException(`Budget plan with ID ${id} not found`);
    }
    return plan;
  }

  async deleteBudgetPlan(id: string): Promise<BudgetPlanDocument> {
    const plan = await this.budgetPlanRepository.delete(id);
    if (!plan) {
      throw new NotFoundException(`Budget plan with ID ${id} not found`);
    }
    return plan;
  }

  // ==================== Actual Spend Methods ====================

  /**
   * Records actual spend
   * Requirements: 7.2
   */
  async createActualSpend(
    dto: CreateActualSpendDto,
    userId: string,
  ): Promise<ActualSpendDocument> {
    const spendData: Partial<ActualSpend> = {
      period: dto.period,
      aircraftGroup: dto.aircraftGroup,
      aircraftId: dto.aircraftId ? new Types.ObjectId(dto.aircraftId) : undefined,
      clauseId: dto.clauseId,
      amount: dto.amount,
      currency: dto.currency || 'USD',
      vendor: dto.vendor,
      notes: dto.notes,
      updatedBy: new Types.ObjectId(userId),
    };

    return this.actualSpendRepository.create(spendData);
  }

  async findActualSpendById(id: string): Promise<ActualSpendDocument> {
    const spend = await this.actualSpendRepository.findById(id);
    if (!spend) {
      throw new NotFoundException(`Actual spend with ID ${id} not found`);
    }
    return spend;
  }

  async findAllActualSpend(filter?: ActualSpendFilter): Promise<ActualSpendDocument[]> {
    return this.actualSpendRepository.findAll(filter);
  }

  async updateActualSpend(
    id: string,
    dto: UpdateActualSpendDto,
    userId: string,
  ): Promise<ActualSpendDocument> {
    const updateData: Partial<ActualSpend> = {
      ...dto,
      aircraftId: dto.aircraftId ? new Types.ObjectId(dto.aircraftId) : undefined,
      updatedBy: new Types.ObjectId(userId),
    };

    const spend = await this.actualSpendRepository.update(id, updateData);
    if (!spend) {
      throw new NotFoundException(`Actual spend with ID ${id} not found`);
    }
    return spend;
  }

  async deleteActualSpend(id: string): Promise<ActualSpendDocument> {
    const spend = await this.actualSpendRepository.delete(id);
    if (!spend) {
      throw new NotFoundException(`Actual spend with ID ${id} not found`);
    }
    return spend;
  }

  // ==================== Analytics Methods ====================

  /**
   * Computes budget variance (planned - actual) and remaining budget
   * Requirements: 7.3
   */
  async getBudgetVariance(
    fiscalYear: number,
    clauseId?: number,
    aircraftGroup?: string,
  ): Promise<BudgetVarianceResult[]> {
    // Get all budget plans for the fiscal year
    const plans = await this.budgetPlanRepository.findAll({
      fiscalYear,
      clauseId,
      aircraftGroup,
    });

    // Get actual spend by clause
    const actualByClause = await this.actualSpendRepository.getTotalByClause(
      fiscalYear,
      aircraftGroup,
    );

    // Create a map of actual spend by clause
    const actualMap = new Map<number, number>();
    for (const item of actualByClause) {
      actualMap.set(item.clauseId, item.totalAmount);
    }

    // Calculate variance for each plan
    const results: BudgetVarianceResult[] = [];
    for (const plan of plans) {
      const actualAmount = actualMap.get(plan.clauseId) || 0;
      const variance = plan.plannedAmount - actualAmount;
      const utilizationPercentage =
        plan.plannedAmount > 0
          ? Math.round((actualAmount / plan.plannedAmount) * 10000) / 100
          : 0;

      results.push({
        clauseId: plan.clauseId,
        clauseDescription: plan.clauseDescription,
        aircraftGroup: plan.aircraftGroup,
        plannedAmount: plan.plannedAmount,
        actualAmount: Math.round(actualAmount * 100) / 100,
        variance: Math.round(variance * 100) / 100,
        remainingBudget: Math.round(Math.max(0, variance) * 100) / 100,
        utilizationPercentage,
      });
    }

    return results.sort((a, b) => a.clauseId - b.clauseId);
  }

  /**
   * Calculates burn rate and projects remaining budget duration
   * Requirements: 7.5
   */
  async getBurnRate(
    fiscalYear: number,
    aircraftGroup?: string,
  ): Promise<BurnRateResult> {
    const totalPlanned = await this.budgetPlanRepository.getTotalPlannedByFiscalYear(
      fiscalYear,
      aircraftGroup,
    );

    const totalSpent = await this.actualSpendRepository.getTotalSpendForFiscalYear(
      fiscalYear,
      aircraftGroup,
    );

    const monthsWithData = await this.actualSpendRepository.getDistinctPeriodCount(
      fiscalYear,
      aircraftGroup,
    );

    const averageMonthlySpend =
      monthsWithData > 0 ? totalSpent / monthsWithData : 0;

    const remainingBudget = Math.max(0, totalPlanned - totalSpent);

    const projectedMonthsRemaining =
      averageMonthlySpend > 0
        ? Math.round((remainingBudget / averageMonthlySpend) * 10) / 10
        : remainingBudget > 0
          ? Infinity
          : 0;

    return {
      fiscalYear,
      aircraftGroup,
      totalPlanned: Math.round(totalPlanned * 100) / 100,
      totalSpent: Math.round(totalSpent * 100) / 100,
      monthsWithData,
      averageMonthlySpend: Math.round(averageMonthlySpend * 100) / 100,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      projectedMonthsRemaining:
        projectedMonthsRemaining === Infinity ? -1 : projectedMonthsRemaining,
    };
  }

  /**
   * Computes cost per flight hour and cost per cycle
   * Requirements: 7.6
   * Note: This method requires utilization data to be passed in
   */
  computeCostEfficiency(
    totalCost: number,
    totalFlightHours: number,
    totalCycles: number,
    aircraftGroup?: string,
    aircraftId?: string,
  ): CostEfficiencyResult {
    const costPerFlightHour =
      totalFlightHours > 0
        ? Math.round((totalCost / totalFlightHours) * 100) / 100
        : 0;

    const costPerCycle =
      totalCycles > 0 ? Math.round((totalCost / totalCycles) * 100) / 100 : 0;

    return {
      aircraftGroup,
      aircraftId,
      totalCost: Math.round(totalCost * 100) / 100,
      totalFlightHours: Math.round(totalFlightHours * 100) / 100,
      totalCycles: Math.round(totalCycles * 100) / 100,
      costPerFlightHour,
      costPerCycle,
    };
  }

  /**
   * Gets spend breakdown by period
   * Requirements: 7.4
   */
  async getSpendByPeriod(
    startPeriod?: string,
    endPeriod?: string,
    aircraftGroup?: string,
  ) {
    return this.actualSpendRepository.getTotalByPeriod(
      startPeriod,
      endPeriod,
      aircraftGroup,
    );
  }

  /**
   * Gets spend breakdown by aircraft group
   * Requirements: 7.4
   */
  async getSpendByAircraftGroup(
    fiscalYear?: number,
    startPeriod?: string,
    endPeriod?: string,
  ) {
    return this.actualSpendRepository.getTotalByAircraftGroup(
      fiscalYear,
      startPeriod,
      endPeriod,
    );
  }

  /**
   * Gets distinct clauses for dropdown/filter
   */
  async getDistinctClauses(fiscalYear?: number) {
    return this.budgetPlanRepository.getDistinctClauses(fiscalYear);
  }

  /**
   * Gets distinct aircraft groups for dropdown/filter
   */
  async getDistinctAircraftGroups(fiscalYear?: number) {
    return this.budgetPlanRepository.getDistinctAircraftGroups(fiscalYear);
  }

  /**
   * Clone budget plans from one fiscal year to another
   * Requirements: 19.2
   * @param sourceYear - The fiscal year to clone from
   * @param targetYear - The fiscal year to clone to
   * @param adjustmentPercentage - Optional percentage adjustment (e.g., 5 for 5% increase)
   */
  async cloneBudgetPlans(
    sourceYear: number,
    targetYear: number,
    adjustmentPercentage: number = 0,
  ): Promise<{ clonedCount: number; skippedCount: number; sourceYear: number; targetYear: number; adjustmentPercentage: number }> {
    // Validate source year has plans
    const hasSourcePlans = await this.budgetPlanRepository.hasPlansForYear(sourceYear);
    if (!hasSourcePlans) {
      throw new BadRequestException(`No budget plans found for fiscal year ${sourceYear}`);
    }

    // Validate source and target years are different
    if (sourceYear === targetYear) {
      throw new BadRequestException('Source and target fiscal years must be different');
    }

    const result = await this.budgetPlanRepository.cloneFromYear(
      sourceYear,
      targetYear,
      adjustmentPercentage,
    );

    return {
      ...result,
      sourceYear,
      targetYear,
      adjustmentPercentage,
    };
  }

  /**
   * Check if budget plans exist for a fiscal year
   */
  async hasPlansForYear(fiscalYear: number): Promise<boolean> {
    return this.budgetPlanRepository.hasPlansForYear(fiscalYear);
  }

  /**
   * Get available years that have budget plans
   */
  async getAvailableYears(): Promise<number[]> {
    const plans = await this.budgetPlanRepository.findAll();
    const years = [...new Set(plans.map(p => p.fiscalYear))];
    return years.sort((a, b) => b - a); // Sort descending (most recent first)
  }

  /**
   * Gets total spend for a period range
   */
  async getTotalSpend(
    startPeriod?: string,
    endPeriod?: string,
    aircraftGroup?: string,
    aircraftId?: string,
  ): Promise<number> {
    const spends = await this.actualSpendRepository.findAll({
      startPeriod,
      endPeriod,
      aircraftGroup,
      aircraftId,
    });

    return spends.reduce((sum, spend) => sum + spend.amount, 0);
  }
}
