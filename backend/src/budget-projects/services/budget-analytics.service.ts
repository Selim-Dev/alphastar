import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { BudgetProjectRepository } from '../repositories/budget-project.repository';
import { BudgetPlanRowRepository } from '../repositories/budget-plan-row.repository';
import { BudgetActualRepository } from '../repositories/budget-actual.repository';
import { AnalyticsFiltersDto } from '../dto/analytics-filters.dto';
import {
  BudgetKPIsDto,
  MonthlySpendByTermDto,
  CumulativeSpendDataDto,
  SpendDistributionDto,
  BudgetedVsSpentByAircraftDto,
  OverspendTermDto,
  HeatmapDataDto,
} from '../dto/budget-kpis.dto';

/**
 * Budget Analytics Service
 * 
 * Provides comprehensive analytics and KPI calculations for budget projects.
 * Supports filtering by date range, aircraft type, and term search.
 */
@Injectable()
export class BudgetAnalyticsService {
  constructor(
    private readonly projectRepository: BudgetProjectRepository,
    private readonly planRowRepository: BudgetPlanRowRepository,
    private readonly actualRepository: BudgetActualRepository,
  ) {}

  /**
   * Task 8.1: Get KPI summary with burn rate and forecast
   * Requirements: 5.1, 5.2, 5.3
   */
  async getKPIs(projectId: string, filters?: AnalyticsFiltersDto): Promise<BudgetKPIsDto> {
    // Verify project exists
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${projectId} not found`);
    }

    // Build aggregation match conditions
    const matchConditions: any = { projectId: new Types.ObjectId(projectId) };

    // Apply filters
    if (filters?.aircraftType) {
      matchConditions.aircraftType = filters.aircraftType;
    }

    if (filters?.termSearch) {
      matchConditions.termName = { $regex: filters.termSearch, $options: 'i' };
    }

    // Calculate total budgeted from plan rows
    const planRowsMatch = { ...matchConditions };
    delete planRowsMatch.period; // Plan rows don't have period

    const budgetedResult = await this.planRowRepository['budgetPlanRowModel']
      .aggregate([
        { $match: planRowsMatch },
        { $group: { _id: null, total: { $sum: '$plannedAmount' } } },
      ])
      .exec();

    const totalBudgeted = budgetedResult.length > 0 ? budgetedResult[0].total : 0;

    // Calculate total spent from actuals with date range filter
    const actualsMatch = { ...matchConditions };
    if (filters?.startDate || filters?.endDate) {
      actualsMatch.period = {};
      if (filters.startDate) {
        actualsMatch.period.$gte = filters.startDate;
      }
      if (filters.endDate) {
        actualsMatch.period.$lte = filters.endDate;
      }
    }

    const spentResult = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: actualsMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();

    const totalSpent = spentResult.length > 0 ? spentResult[0].total : 0;

    // Calculate remaining budget
    const remainingBudget = Math.max(0, totalBudgeted - totalSpent);

    // Calculate budget utilization percentage
    const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    // Calculate burn rate (average monthly spend)
    const periodsResult = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: actualsMatch },
        { $group: { _id: '$period', total: { $sum: '$amount' } } },
      ])
      .exec();

    const periodsWithData = periodsResult.length;
    const burnRate = periodsWithData > 0 ? totalSpent / periodsWithData : 0;
    const averageMonthlySpend = burnRate;

    // Calculate forecast
    let forecastMonthsRemaining = 0;
    let forecastDepletionDate: Date | null = null;

    if (burnRate > 0 && remainingBudget > 0) {
      forecastMonthsRemaining = remainingBudget / burnRate;
      
      // Calculate depletion date from current date
      const currentDate = new Date();
      forecastDepletionDate = new Date(currentDate);
      forecastDepletionDate.setMonth(currentDate.getMonth() + Math.ceil(forecastMonthsRemaining));
    }

    return {
      totalBudgeted,
      totalSpent,
      remainingBudget,
      budgetUtilization: Math.round(budgetUtilization * 100) / 100, // Round to 2 decimals
      burnRate: Math.round(burnRate * 100) / 100,
      averageMonthlySpend: Math.round(averageMonthlySpend * 100) / 100,
      forecastMonthsRemaining: Math.round(forecastMonthsRemaining * 100) / 100,
      forecastDepletionDate,
    };
  }

  /**
   * Task 8.4: Get monthly spend by term for stacked bar chart
   * Requirements: 5.4
   */
  async getMonthlySpendByTerm(
    projectId: string,
    filters?: AnalyticsFiltersDto,
  ): Promise<MonthlySpendByTermDto[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${projectId} not found`);
    }

    const matchConditions: any = { projectId: new Types.ObjectId(projectId) };

    if (filters?.startDate || filters?.endDate) {
      matchConditions.period = {};
      if (filters.startDate) {
        matchConditions.period.$gte = filters.startDate;
      }
      if (filters.endDate) {
        matchConditions.period.$lte = filters.endDate;
      }
    }

    if (filters?.aircraftType) {
      matchConditions.aircraftType = filters.aircraftType;
    }

    // Aggregate by period and term
    const result = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: { period: '$period', termId: '$termId' },
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.period': 1, '_id.termId': 1 } },
      ])
      .exec();

    // Get term details from plan rows
    const planRows = await this.planRowRepository.findByProjectId(projectId);
    const termMap = new Map(
      planRows.map((row) => [
        row.termId,
        { termName: row.termName, termCategory: row.termCategory },
      ]),
    );

    // Apply term search filter if provided
    const filteredResult = filters?.termSearch
      ? result.filter((item) => {
          const termInfo = termMap.get(item._id.termId);
          return termInfo?.termName.toLowerCase().includes(filters.termSearch!.toLowerCase());
        })
      : result;

    return filteredResult.map((item) => {
      const termInfo = termMap.get(item._id.termId) || {
        termName: item._id.termId,
        termCategory: 'Unknown',
      };
      return {
        period: item._id.period,
        termId: item._id.termId,
        termName: termInfo.termName,
        termCategory: termInfo.termCategory,
        amount: Math.round(item.amount * 100) / 100,
      };
    });
  }

  /**
   * Task 8.4: Get cumulative spend vs budget for line chart
   * Requirements: 5.5
   */
  async getCumulativeSpendVsBudget(projectId: string): Promise<CumulativeSpendDataDto[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${projectId} not found`);
    }

    // Get all periods with spending
    const periodsResult = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        {
          $group: {
            _id: '$period',
            spent: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    // Get total budgeted
    const totalBudgeted = await this.planRowRepository.getTotalPlannedByProject(projectId);

    // Calculate cumulative values
    let cumulativeSpent = 0;
    const result: CumulativeSpendDataDto[] = [];

    for (const periodData of periodsResult) {
      cumulativeSpent += periodData.spent;
      result.push({
        period: periodData._id,
        cumulativeSpent: Math.round(cumulativeSpent * 100) / 100,
        cumulativeBudgeted: Math.round(totalBudgeted * 100) / 100,
      });
    }

    return result;
  }

  /**
   * Task 8.4: Get spend distribution by category for donut/pie chart
   * Requirements: 5.6
   */
  async getSpendDistribution(
    projectId: string,
    filters?: AnalyticsFiltersDto,
  ): Promise<SpendDistributionDto[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${projectId} not found`);
    }

    const matchConditions: any = { projectId: new Types.ObjectId(projectId) };

    if (filters?.startDate || filters?.endDate) {
      matchConditions.period = {};
      if (filters.startDate) {
        matchConditions.period.$gte = filters.startDate;
      }
      if (filters.endDate) {
        matchConditions.period.$lte = filters.endDate;
      }
    }

    if (filters?.aircraftType) {
      matchConditions.aircraftType = filters.aircraftType;
    }

    // Get actuals grouped by term
    const actualsResult = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$termId',
            amount: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    // Get term categories from plan rows
    const planRows = await this.planRowRepository.findByProjectId(projectId);
    const termCategoryMap = new Map(planRows.map((row) => [row.termId, row.termCategory]));

    // Group by category
    const categoryMap = new Map<string, number>();
    let totalSpent = 0;

    for (const item of actualsResult) {
      const category = termCategoryMap.get(item._id) || 'Unknown';
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + item.amount);
      totalSpent += item.amount;
    }

    // Apply term search filter if provided
    if (filters?.termSearch) {
      const filteredCategories = new Map<string, number>();
      let filteredTotal = 0;

      for (const row of planRows) {
        if (row.termName.toLowerCase().includes(filters.termSearch.toLowerCase())) {
          const categoryAmount = categoryMap.get(row.termCategory) || 0;
          if (categoryAmount > 0) {
            filteredCategories.set(row.termCategory, categoryAmount);
            filteredTotal += categoryAmount;
          }
        }
      }

      categoryMap.clear();
      for (const [cat, amt] of filteredCategories) {
        categoryMap.set(cat, amt);
      }
      totalSpent = filteredTotal;
    }

    // Convert to array with percentages
    const result: SpendDistributionDto[] = [];
    for (const [category, amount] of categoryMap) {
      result.push({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 10000) / 100 : 0,
      });
    }

    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);

    return result;
  }

  /**
   * Task 8.4: Get budgeted vs spent by aircraft type for grouped bar chart
   * Requirements: 5.7
   */
  async getBudgetedVsSpentByAircraftType(
    projectId: string,
  ): Promise<BudgetedVsSpentByAircraftDto[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${projectId} not found`);
    }

    // Get budgeted by aircraft type
    const budgetedResult = await this.planRowRepository['budgetPlanRowModel']
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        {
          $group: {
            _id: '$aircraftType',
            budgeted: { $sum: '$plannedAmount' },
          },
        },
      ])
      .exec();

    // Get spent by aircraft type
    const spentResult = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        {
          $group: {
            _id: '$aircraftType',
            spent: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    // Combine results
    const aircraftTypeMap = new Map<string, { budgeted: number; spent: number }>();

    for (const item of budgetedResult) {
      const aircraftType = item._id || 'Unassigned';
      aircraftTypeMap.set(aircraftType, {
        budgeted: item.budgeted,
        spent: 0,
      });
    }

    for (const item of spentResult) {
      const aircraftType = item._id || 'Unassigned';
      const existing = aircraftTypeMap.get(aircraftType) || { budgeted: 0, spent: 0 };
      existing.spent = item.spent;
      aircraftTypeMap.set(aircraftType, existing);
    }

    // Convert to array
    const result: BudgetedVsSpentByAircraftDto[] = [];
    for (const [aircraftType, data] of aircraftTypeMap) {
      result.push({
        aircraftType,
        budgeted: Math.round(data.budgeted * 100) / 100,
        spent: Math.round(data.spent * 100) / 100,
        variance: Math.round((data.budgeted - data.spent) * 100) / 100,
      });
    }

    // Sort by budgeted amount descending
    result.sort((a, b) => b.budgeted - a.budgeted);

    return result;
  }

  /**
   * Task 8.4: Get top 5 overspend terms for ranked list
   * Requirements: 5.8
   */
  async getTop5OverspendTerms(projectId: string): Promise<OverspendTermDto[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${projectId} not found`);
    }

    // Get all plan rows
    const planRows = await this.planRowRepository.findByProjectId(projectId);

    // Get all actuals grouped by term
    const actualsResult = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        {
          $group: {
            _id: '$termId',
            spent: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    // Create map of spent by term
    const spentMap = new Map(actualsResult.map((item) => [item._id, item.spent]));

    // Calculate variance for each term
    const termVariances: OverspendTermDto[] = [];

    // Group plan rows by term (sum across aircraft)
    const termBudgetMap = new Map<string, { name: string; category: string; budgeted: number }>();
    for (const row of planRows) {
      const existing = termBudgetMap.get(row.termId);
      if (existing) {
        existing.budgeted += row.plannedAmount;
      } else {
        termBudgetMap.set(row.termId, {
          name: row.termName,
          category: row.termCategory,
          budgeted: row.plannedAmount,
        });
      }
    }

    for (const [termId, termData] of termBudgetMap) {
      const spent = spentMap.get(termId) || 0;
      const variance = termData.budgeted - spent;
      const variancePercent = termData.budgeted > 0 ? (variance / termData.budgeted) * 100 : 0;

      // Only include overspend (negative variance)
      if (variance < 0) {
        termVariances.push({
          termId,
          termName: termData.name,
          termCategory: termData.category,
          budgeted: Math.round(termData.budgeted * 100) / 100,
          spent: Math.round(spent * 100) / 100,
          variance: Math.round(variance * 100) / 100,
          variancePercent: Math.round(variancePercent * 100) / 100,
        });
      }
    }

    // Sort by variance (most negative first) and take top 5
    termVariances.sort((a, b) => a.variance - b.variance);
    return termVariances.slice(0, 5);
  }

  /**
   * Task 8.4: Get spending heatmap data (optional)
   * Requirements: 5.9
   */
  async getSpendingHeatmap(projectId: string): Promise<HeatmapDataDto[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project with ID ${projectId} not found`);
    }

    // Get all actuals
    const actualsResult = await this.actualRepository['budgetActualModel']
      .aggregate([
        { $match: { projectId: new Types.ObjectId(projectId) } },
        {
          $group: {
            _id: { termId: '$termId', period: '$period' },
            amount: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.termId': 1, '_id.period': 1 } },
      ])
      .exec();

    // Get term names
    const planRows = await this.planRowRepository.findByProjectId(projectId);
    const termNameMap = new Map(planRows.map((row) => [row.termId, row.termName]));

    // Group by term
    const heatmapMap = new Map<string, Array<{ period: string; amount: number }>>();

    for (const item of actualsResult) {
      const termId = item._id.termId;
      const period = item._id.period;
      const amount = item.amount;

      if (!heatmapMap.has(termId)) {
        heatmapMap.set(termId, []);
      }

      heatmapMap.get(termId)!.push({
        period,
        amount: Math.round(amount * 100) / 100,
      });
    }

    // Convert to array
    const result: HeatmapDataDto[] = [];
    for (const [termId, monthlyData] of heatmapMap) {
      result.push({
        termId,
        termName: termNameMap.get(termId) || termId,
        monthlyData,
      });
    }

    return result;
  }
}
