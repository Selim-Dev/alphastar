import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { 
  DashboardService, 
  KPISummary, 
  DashboardTrends,
  FleetHealthScore,
  AlertsResponse,
  PeriodComparison,
  FleetComparisonResponse,
  MaintenanceForecastResponse,
  RecentActivityResponse,
  YoYComparisonResponse,
  DefectPatternsResponse,
  DataQualityResponse,
  WorkOrderCountTrendResponse,
} from './services/dashboard.service';
import { HealthCheckService } from './services/health-check.service';
import { DashboardQueryDto, TrendQueryDto } from './dto/dashboard-query.dto';
import { HealthCheckResponseDto, SeedTriggerResponseDto } from './dto/health-check.dto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  /**
   * Get executive KPI summary
   * Requirements: 8.1, 8.4
   */
  @Get('kpis')
  @ApiOperation({
    summary: 'Get executive KPI summary',
    description: 'Returns fleet availability percentage, total flight hours, total cycles, and active AOG count',
  })
  @ApiResponse({
    status: 200,
    description: 'KPI summary retrieved successfully',
  })
  async getKPISummary(@Query() query: DashboardQueryDto): Promise<KPISummary> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.dashboardService.getKPISummary(startDate, endDate);
  }

  /**
   * Get trend data for charts
   * Requirements: 8.2, 8.4
   */
  @Get('trends')
  @ApiOperation({
    summary: 'Get trend data for charts',
    description: 'Returns availability and utilization trends over the selected time period',
  })
  @ApiResponse({
    status: 200,
    description: 'Trend data retrieved successfully',
  })
  async getTrends(@Query() query: TrendQueryDto): Promise<DashboardTrends> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const period = query.period || 'day';
    return this.dashboardService.getTrends(period, startDate, endDate);
  }

  /**
   * Get health check with collection counts
   * Requirements: 4.1, 4.2
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get data health check',
    description: 'Returns counts for all collections and API status',
  })
  @ApiResponse({
    status: 200,
    description: 'Health check data retrieved successfully',
    type: HealthCheckResponseDto,
  })
  async getHealthCheck(): Promise<HealthCheckResponseDto> {
    return this.healthCheckService.getHealthCheck();
  }

  /**
   * Get Fleet Health Score - composite executive metric
   * Requirements: CEO Dashboard 1.1-1.5
   */
  @Get('health-score')
  @ApiOperation({
    summary: 'Get Fleet Health Score',
    description: 'Returns composite fleet health score (0-100) with component breakdown',
  })
  @ApiResponse({ status: 200, description: 'Fleet Health Score retrieved successfully' })
  async getFleetHealthScore(@Query() query: DashboardQueryDto): Promise<FleetHealthScore> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.dashboardService.getFleetHealthScore(startDate, endDate);
  }

  /**
   * Get Executive Alerts
   * Requirements: CEO Dashboard 4.1-4.6
   */
  @Get('alerts')
  @ApiOperation({
    summary: 'Get Executive Alerts',
    description: 'Returns categorized alerts for executive dashboard',
  })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getExecutiveAlerts(): Promise<AlertsResponse> {
    return this.dashboardService.getExecutiveAlerts();
  }

  /**
   * Get Period Comparison
   * Requirements: CEO Dashboard 2.1-2.5
   */
  @Get('period-comparison')
  @ApiOperation({
    summary: 'Get Period Comparison',
    description: 'Returns current vs previous period KPIs with deltas',
  })
  @ApiResponse({ status: 200, description: 'Period comparison retrieved successfully' })
  async getPeriodComparison(@Query() query: DashboardQueryDto): Promise<PeriodComparison> {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    return this.dashboardService.getPeriodComparison(startDate, endDate);
  }

  /**
   * Get Fleet Comparison
   * Requirements: CEO Dashboard 8.1-8.5
   */
  @Get('fleet-comparison')
  @ApiOperation({
    summary: 'Get Fleet Comparison',
    description: 'Returns top and bottom performing aircraft by availability',
  })
  @ApiResponse({ status: 200, description: 'Fleet comparison retrieved successfully' })
  async getFleetComparison(@Query() query: DashboardQueryDto): Promise<FleetComparisonResponse> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.dashboardService.getFleetComparison(startDate, endDate);
  }

  /**
   * Get Maintenance Forecast
   * Requirements: CEO Dashboard 12.1-12.4
   */
  @Get('maintenance-forecast')
  @ApiOperation({
    summary: 'Get Maintenance Forecast',
    description: 'Returns upcoming scheduled maintenance items',
  })
  @ApiResponse({ status: 200, description: 'Maintenance forecast retrieved successfully' })
  async getMaintenanceForecast(): Promise<MaintenanceForecastResponse> {
    return this.dashboardService.getMaintenanceForecast();
  }

  /**
   * Get Recent Activity
   * Requirements: CEO Dashboard 13.1-13.3
   */
  @Get('recent-activity')
  @ApiOperation({
    summary: 'Get Recent Activity',
    description: 'Returns last 10 system events',
  })
  @ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
  async getRecentActivity(): Promise<RecentActivityResponse> {
    return this.dashboardService.getRecentActivity();
  }

  /**
   * Get Year-over-Year Comparison
   * Requirements: CEO Dashboard 15.1-15.5
   */
  @Get('yoy-comparison')
  @ApiOperation({
    summary: 'Get Year-over-Year Comparison',
    description: 'Returns current vs previous year metrics comparison',
  })
  @ApiResponse({ status: 200, description: 'YoY comparison retrieved successfully' })
  async getYoYComparison(@Query() query: DashboardQueryDto): Promise<YoYComparisonResponse> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.dashboardService.getYoYComparison(startDate, endDate);
  }

  /**
   * Get Defect Patterns
   * Requirements: CEO Dashboard 16.1-16.3
   */
  @Get('defect-patterns')
  @ApiOperation({
    summary: 'Get Defect Patterns',
    description: 'Returns top ATA chapters by discrepancy count with trends',
  })
  @ApiResponse({ status: 200, description: 'Defect patterns retrieved successfully' })
  async getDefectPatterns(@Query() query: DashboardQueryDto): Promise<DefectPatternsResponse> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.dashboardService.getDefectPatterns(startDate, endDate);
  }

  /**
   * Get Data Quality Metrics
   * Requirements: CEO Dashboard 17.1-17.5
   */
  @Get('data-quality')
  @ApiOperation({
    summary: 'Get Data Quality Metrics',
    description: 'Returns data freshness and completeness metrics',
  })
  @ApiResponse({ status: 200, description: 'Data quality metrics retrieved successfully' })
  async getDataQuality(): Promise<DataQualityResponse> {
    return this.dashboardService.getDataQuality();
  }

  /**
   * Get Work Order Count Trend
   * Requirements: 14.2
   */
  @Get('work-order-trend')
  @ApiOperation({
    summary: 'Get Work Order Count Trend',
    description: 'Returns work order count trend from monthly summaries',
  })
  @ApiResponse({ status: 200, description: 'Work order count trend retrieved successfully' })
  async getWorkOrderCountTrend(@Query() query: DashboardQueryDto): Promise<WorkOrderCountTrendResponse> {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    return this.dashboardService.getWorkOrderCountTrend(startDate, endDate);
  }

  /**
   * Trigger seed script (Admin only)
   * Requirements: 4.4
   */
  @Post('seed')
  @UseGuards(RolesGuard)
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'Trigger seed script',
    description: 'Runs the seed script to populate demo data (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Seed operation completed',
    type: SeedTriggerResponseDto,
  })
  async triggerSeed(): Promise<SeedTriggerResponseDto> {
    try {
      await execAsync('npm run seed', { cwd: process.cwd() });
      return {
        success: true,
        message: 'Seed script completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Seed script failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
