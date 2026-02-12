import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetAnalyticsService } from '../services/budget-analytics.service';
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
 * Budget Analytics Controller
 * 
 * Provides endpoints for budget analytics and visualizations.
 * All endpoints require authentication.
 * 
 * Task 8.6: Implement analytics endpoints
 * Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10
 */
@Controller('budget-analytics')
@UseGuards(JwtAuthGuard)
export class BudgetAnalyticsController {
  constructor(private readonly analyticsService: BudgetAnalyticsService) {}

  /**
   * Get KPI summary for a budget project
   * 
   * @param projectId - Budget project ID
   * @param filters - Optional filters (date range, aircraft type, term search)
   * @returns KPI summary with burn rate and forecast
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.10
   */
  @Get(':projectId/kpis')
  async getKPIs(
    @Param('projectId') projectId: string,
    @Query() filters: AnalyticsFiltersDto,
  ): Promise<BudgetKPIsDto> {
    return this.analyticsService.getKPIs(projectId, filters);
  }

  /**
   * Get monthly spend by term for stacked bar chart
   * 
   * @param projectId - Budget project ID
   * @param filters - Optional filters
   * @returns Array of monthly spend data grouped by term
   * 
   * Requirements: 5.4, 5.10
   */
  @Get(':projectId/monthly-spend')
  async getMonthlySpend(
    @Param('projectId') projectId: string,
    @Query() filters: AnalyticsFiltersDto,
  ): Promise<MonthlySpendByTermDto[]> {
    return this.analyticsService.getMonthlySpendByTerm(projectId, filters);
  }

  /**
   * Get cumulative spend vs budget for line chart
   * 
   * @param projectId - Budget project ID
   * @returns Array of cumulative spend data over time
   * 
   * Requirements: 5.5
   */
  @Get(':projectId/cumulative-spend')
  async getCumulativeSpend(
    @Param('projectId') projectId: string,
  ): Promise<CumulativeSpendDataDto[]> {
    return this.analyticsService.getCumulativeSpendVsBudget(projectId);
  }

  /**
   * Get spend distribution by category for donut/pie chart
   * 
   * @param projectId - Budget project ID
   * @param filters - Optional filters
   * @returns Array of spend distribution by category
   * 
   * Requirements: 5.6, 5.10
   */
  @Get(':projectId/spend-distribution')
  async getSpendDistribution(
    @Param('projectId') projectId: string,
    @Query() filters: AnalyticsFiltersDto,
  ): Promise<SpendDistributionDto[]> {
    return this.analyticsService.getSpendDistribution(projectId, filters);
  }

  /**
   * Get budgeted vs spent by aircraft type for grouped bar chart
   * 
   * @param projectId - Budget project ID
   * @returns Array of budgeted vs spent data by aircraft type
   * 
   * Requirements: 5.7
   */
  @Get(':projectId/budgeted-vs-spent')
  async getBudgetedVsSpent(
    @Param('projectId') projectId: string,
  ): Promise<BudgetedVsSpentByAircraftDto[]> {
    return this.analyticsService.getBudgetedVsSpentByAircraftType(projectId);
  }

  /**
   * Get top 5 overspend terms for ranked list
   * 
   * @param projectId - Budget project ID
   * @returns Array of top 5 overspend terms
   * 
   * Requirements: 5.8
   */
  @Get(':projectId/top-overspend')
  async getTopOverspend(@Param('projectId') projectId: string): Promise<OverspendTermDto[]> {
    return this.analyticsService.getTop5OverspendTerms(projectId);
  }

  /**
   * Get spending heatmap data (optional)
   * 
   * @param projectId - Budget project ID
   * @returns Array of heatmap data (terms × months)
   * 
   * Requirements: 5.9
   */
  @Get(':projectId/heatmap')
  async getHeatmap(@Param('projectId') projectId: string): Promise<HeatmapDataDto[]> {
    return this.analyticsService.getSpendingHeatmap(projectId);
  }
}
