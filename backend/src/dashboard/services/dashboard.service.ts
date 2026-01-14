import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DailyStatusService } from '../../daily-status/services/daily-status.service';
import { UtilizationService } from '../../utilization/services/utilization.service';
import { AOGEventsService } from '../../aog-events/services/aog-events.service';
import { WorkOrderSummariesService } from '../../work-order-summaries/services/work-order-summaries.service';
import { WorkOrder } from '../../work-orders/schemas/work-order.schema';
import { BudgetPlan } from '../../budget/schemas/budget-plan.schema';
import { ActualSpend } from '../../budget/schemas/actual-spend.schema';
import { Aircraft } from '../../aircraft/schemas/aircraft.schema';
import { Discrepancy } from '../../discrepancies/schemas/discrepancy.schema';
import { DailyStatus } from '../../daily-status/schemas/daily-status.schema';
import { DailyCounter } from '../../utilization/schemas/daily-counter.schema';
import { AOGEvent, BlockingReason, AOGWorkflowStatus } from '../../aog-events/schemas/aog-event.schema';

export interface KPISummary {
  fleetAvailabilityPercentage: number;
  totalFlightHours: number;
  totalCycles: number;
  activeAOGCount: number;
  totalPosHours: number;
  totalFmcHours: number;
}

export interface AvailabilityTrendPoint {
  period: string;
  availabilityPercentage: number;
  totalPosHours: number;
  totalFmcHours: number;
}

export interface UtilizationTrendPoint {
  period: string;
  flightHours: number;
  cycles: number;
}

export interface DashboardTrends {
  availability: AvailabilityTrendPoint[];
  utilization: UtilizationTrendPoint[];
}

// Executive Dashboard Types
export interface FleetHealthScore {
  score: number;
  status: 'healthy' | 'caution' | 'warning' | 'critical';
  components: {
    availability: { score: number; weight: number; value: number };
    aogImpact: { score: number; weight: number; activeCount: number };
    budgetHealth: { score: number; weight: number; utilizationPercentage: number };
  };
  calculatedAt: string;
}

export interface ExecutiveAlert {
  id: string;
  type: 'aog' | 'aog_blocked' | 'overdue_wo' | 'low_availability' | 'budget_overrun';
  priority: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  aircraftId?: string;
  aircraftRegistration?: string;
  actionUrl?: string;
  createdAt: string;
}

export interface AlertsResponse {
  critical: ExecutiveAlert[];
  warning: ExecutiveAlert[];
  info: ExecutiveAlert[];
  totalCount: number;
  hasAlerts: boolean;
}

export interface PeriodComparison {
  current: {
    startDate: string;
    endDate: string;
    fleetAvailability: number;
    totalFlightHours: number;
    totalCycles: number;
    activeAOGCount: number;
  };
  previous: {
    startDate: string;
    endDate: string;
    fleetAvailability: number;
    totalFlightHours: number;
    totalCycles: number;
    activeAOGCount: number;
  };
  deltas: {
    fleetAvailability: { value: number; percentage: number; trend: 'up' | 'down' | 'flat' };
    totalFlightHours: { value: number; percentage: number; trend: 'up' | 'down' | 'flat' };
    totalCycles: { value: number; percentage: number; trend: 'up' | 'down' | 'flat' };
    activeAOGCount: { value: number; percentage: number; trend: 'up' | 'down' | 'flat' };
  };
}

export interface CostEfficiency {
  costPerFlightHour: number;
  costPerCycle: number;
  totalCost: number;
  totalFlightHours: number;
  totalCycles: number;
  trend: { costPerFlightHour: 'up' | 'down' | 'flat'; costPerCycle: 'up' | 'down' | 'flat' };
  period: { startDate: string; endDate: string };
}

export interface AircraftPerformance {
  aircraftId: string;
  registration: string;
  fleetGroup: string;
  availabilityPercentage: number;
  trend: 'up' | 'down' | 'flat';
  utilizationHours: number;
}

export interface FleetComparisonResponse {
  topPerformers: AircraftPerformance[];
  bottomPerformers: AircraftPerformance[];
  fleetAverage: number;
}

// Operational Efficiency Types (Task 1.6)
export interface OperationalEfficiency {
  mtbf: {
    value: number;
    unit: 'hours';
    trend: 'up' | 'down' | 'flat';
  };
  mttr: {
    value: number;
    unit: 'hours';
    trend: 'up' | 'down' | 'flat';
    warning: boolean;
  };
  dispatchReliability: {
    value: number;
    trend: 'up' | 'down' | 'flat';
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

// Maintenance Forecast Types (Task 1.7)
export interface MaintenanceItem {
  id: string;
  aircraftId: string;
  registration: string;
  maintenanceType: string;
  dueDate: string;
  daysUntilDue: number;
  priority: 'info' | 'warning' | 'critical';
  workOrderRef?: string;
}

export interface MaintenanceForecastResponse {
  items: MaintenanceItem[];
  totalCount: number;
}

// Recent Activity Types (Task 1.8)
export interface ActivityEvent {
  id: string;
  type: 'aog_created' | 'aog_cleared' | 'wo_created' | 'wo_closed' | 'status_updated' | 'budget_updated';
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  aircraftId?: string;
  aircraftRegistration?: string;
  actionUrl?: string;
}

export interface RecentActivityResponse {
  activities: ActivityEvent[];
  totalCount: number;
}

// Insights Types (Task 1.9)
export interface Insight {
  id: string;
  type: 'availability' | 'maintenance' | 'budget' | 'utilization';
  category: 'positive' | 'neutral' | 'concerning';
  title: string;
  description: string;
  metric?: {
    current: number;
    previous: number;
    change: number;
  };
  aircraftId?: string;
  aircraftRegistration?: string;
}

export interface InsightsResponse {
  insights: Insight[];
  generatedAt: string;
}

// Year-over-Year Types (Task 1.10)
export interface YoYMetric {
  name: string;
  currentYear: number;
  previousYear: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'flat';
  favorable: boolean;
}

export interface YoYComparisonResponse {
  metrics: YoYMetric[];
  currentPeriod: { year: number; startDate: string; endDate: string };
  previousPeriod: { year: number; startDate: string; endDate: string };
  hasHistoricalData: boolean;
}

// Defect Patterns Types (Task 1.11)
export interface DefectPattern {
  ataChapter: string;
  ataDescription: string;
  count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  previousCount: number;
  topAircraft?: string[];
}

export interface DefectPatternsResponse {
  patterns: DefectPattern[];
  totalDiscrepancies: number;
  period: { startDate: string; endDate: string };
}

// Data Quality Types (Task 1.12)
export interface DataQualityResponse {
  lastUpdate: string;
  isStale: boolean;
  coverage: {
    dailyStatus: {
      total: number;
      withData: number;
      percentage: number;
    };
    utilization: {
      total: number;
      withData: number;
      percentage: number;
    };
  };
  missingAircraft: string[];
  warnings: string[];
}

// Work Order Count Trend Types (Task 14.2)
export interface WorkOrderCountTrendPoint {
  period: string;
  workOrderCount: number;
  totalCost: number;
}

export interface WorkOrderCountTrendResponse {
  trends: WorkOrderCountTrendPoint[];
  totalCount: number;
  totalCost: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly dailyStatusService: DailyStatusService,
    private readonly utilizationService: UtilizationService,
    private readonly aogEventsService: AOGEventsService,
    private readonly workOrderSummariesService: WorkOrderSummariesService,
    @InjectModel(WorkOrder.name) private workOrderModel: Model<WorkOrder>,
    @InjectModel(BudgetPlan.name) private budgetPlanModel: Model<BudgetPlan>,
    @InjectModel(ActualSpend.name) private actualSpendModel: Model<ActualSpend>,
    @InjectModel(Aircraft.name) private aircraftModel: Model<Aircraft>,
    @InjectModel(Discrepancy.name) private discrepancyModel: Model<Discrepancy>,
    @InjectModel(DailyStatus.name) private dailyStatusModel: Model<DailyStatus>,
    @InjectModel(DailyCounter.name) private dailyCounterModel: Model<DailyCounter>,
    @InjectModel(AOGEvent.name) private aogEventModel: Model<AOGEvent>,
  ) {}

  /**
   * Aggregates fleet-wide KPIs for the executive dashboard
   * Requirements: 8.1, 8.4
   */
  async getKPISummary(startDate?: Date, endDate?: Date): Promise<KPISummary> {
    // Get fleet availability
    const availability = await this.dailyStatusService.computeAvailability(
      undefined,
      startDate,
      endDate,
    );

    // Get total flight hours and cycles from utilization aggregation
    const utilizationData = await this.utilizationService.getAggregatedUtilization({
      period: 'year',
      startDate,
      endDate,
    });

    // Sum up flight hours and cycles across all aircraft
    // Ensure values are never negative (safeguard against data anomalies)
    let totalFlightHours = 0;
    let totalCycles = 0;
    for (const record of utilizationData as { flightHours?: number; cycles?: number }[]) {
      totalFlightHours += Math.max(0, record.flightHours || 0);
      totalCycles += Math.max(0, record.cycles || 0);
    }

    // Get active AOG count
    const activeAOGCount = await this.aogEventsService.countActiveAOGEvents();

    return {
      fleetAvailabilityPercentage: Math.round(availability.availabilityPercentage * 100) / 100,
      totalFlightHours: Math.max(0, Math.round(totalFlightHours * 100) / 100),
      totalCycles: Math.max(0, totalCycles),
      activeAOGCount,
      totalPosHours: availability.totalPosHours,
      totalFmcHours: availability.totalFmcHours,
    };
  }

  /**
   * Generates trend data for charts
   * Requirements: 8.2, 8.4
   */
  async getTrends(
    period: 'day' | 'month' | 'year' = 'day',
    startDate?: Date,
    endDate?: Date,
  ): Promise<DashboardTrends> {
    // Get availability trends
    const availabilityData = await this.dailyStatusService.getAggregatedAvailability({
      period,
      startDate,
      endDate,
    });

    // Aggregate availability by period (across all aircraft)
    const availabilityByPeriod = new Map<string, {
      totalPosHours: number;
      totalFmcHours: number;
    }>();

    for (const record of availabilityData) {
      const existing = availabilityByPeriod.get(record.period);
      if (existing) {
        existing.totalPosHours += record.totalPosHours;
        existing.totalFmcHours += record.totalFmcHours;
      } else {
        availabilityByPeriod.set(record.period, {
          totalPosHours: record.totalPosHours,
          totalFmcHours: record.totalFmcHours,
        });
      }
    }

    const availability: AvailabilityTrendPoint[] = Array.from(
      availabilityByPeriod.entries(),
    ).map(([periodKey, data]) => ({
      period: periodKey,
      totalPosHours: data.totalPosHours,
      totalFmcHours: data.totalFmcHours,
      availabilityPercentage:
        data.totalPosHours > 0
          ? Math.round((data.totalFmcHours / data.totalPosHours) * 10000) / 100
          : 0,
    })).sort((a, b) => a.period.localeCompare(b.period));

    // Get utilization trends
    const utilizationData = await this.utilizationService.getAggregatedUtilization({
      period,
      startDate,
      endDate,
    });

    // Aggregate utilization by period (across all aircraft)
    // Ensure values are never negative (safeguard against data anomalies)
    const utilizationByPeriod = new Map<string, {
      flightHours: number;
      cycles: number;
    }>();

    for (const record of utilizationData as { period: string; flightHours?: number; cycles?: number }[]) {
      const existing = utilizationByPeriod.get(record.period);
      const hours = Math.max(0, record.flightHours || 0);
      const cycles = Math.max(0, record.cycles || 0);
      if (existing) {
        existing.flightHours += hours;
        existing.cycles += cycles;
      } else {
        utilizationByPeriod.set(record.period, {
          flightHours: hours,
          cycles: cycles,
        });
      }
    }

    const utilization: UtilizationTrendPoint[] = Array.from(
      utilizationByPeriod.entries(),
    ).map(([periodKey, data]) => ({
      period: periodKey,
      flightHours: Math.max(0, Math.round(data.flightHours * 100) / 100),
      cycles: Math.max(0, data.cycles),
    })).sort((a, b) => a.period.localeCompare(b.period));

    return {
      availability,
      utilization,
    };
  }

  /**
   * Calculate Fleet Health Score - composite metric for executive view
   * Requirements: CEO Dashboard 1.1, 1.2, 14.3
   * Updated: Removed maintenance efficiency component, adjusted weights
   */
  async getFleetHealthScore(startDate?: Date, endDate?: Date): Promise<FleetHealthScore> {
    // Get availability
    const availability = await this.dailyStatusService.computeAvailability(undefined, startDate, endDate);
    const availabilityScore = Math.min(availability.availabilityPercentage, 100);

    // Get active AOG count
    const activeAOGCount = await this.aogEventsService.countActiveAOGEvents();
    const aogScore = Math.max(0, 100 - (activeAOGCount * 10));

    // Get budget utilization
    const currentYear = new Date().getFullYear();
    const budgetPlans = await this.budgetPlanModel.find({ fiscalYear: currentYear }).exec();
    const actualSpends = await this.actualSpendModel.find({
      period: { $regex: `^${currentYear}` },
    }).exec();
    
    const totalPlanned = budgetPlans.reduce((sum, p) => sum + p.plannedAmount, 0);
    const totalSpent = actualSpends.reduce((sum, s) => sum + s.amount, 0);
    const budgetUtilization = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
    const budgetScore = budgetUtilization <= 100 ? 100 - Math.max(0, budgetUtilization - 80) * 5 : Math.max(0, 100 - (budgetUtilization - 100) * 2);

    // Calculate weighted composite score (updated weights per Requirements 14.3)
    // Removed maintenance efficiency component, redistributed weights
    const weights = { availability: 0.45, aog: 0.30, budget: 0.25 };
    const score = Math.round(
      availabilityScore * weights.availability +
      aogScore * weights.aog +
      budgetScore * weights.budget
    );

    // Determine status
    let status: 'healthy' | 'caution' | 'warning' | 'critical';
    if (score >= 90) status = 'healthy';
    else if (score >= 70) status = 'caution';
    else if (score >= 50) status = 'warning';
    else status = 'critical';

    return {
      score,
      status,
      components: {
        availability: { score: Math.round(availabilityScore), weight: weights.availability, value: availability.availabilityPercentage },
        aogImpact: { score: Math.round(aogScore), weight: weights.aog, activeCount: activeAOGCount },
        budgetHealth: { score: Math.round(budgetScore), weight: weights.budget, utilizationPercentage: budgetUtilization },
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get executive alerts - items requiring attention
   * Requirements: CEO Dashboard 4.1-4.6, 21.1, 21.2
   * Updated: Removed overdue WO alerts, added AOG blocking state alerts
   */
  async getExecutiveAlerts(): Promise<AlertsResponse> {
    const alerts: ExecutiveAlert[] = [];
    const aircraft = await this.aircraftModel.find({ status: 'active' }).exec();
    const aircraftMap = new Map(aircraft.map(a => [a._id.toString(), a]));

    // Active AOG events (Critical) - query directly to get proper _id
    const activeAOGEvents = await this.aogEventModel.find({ clearedAt: null }).limit(10).exec();
    for (const event of activeAOGEvents) {
      const ac = aircraftMap.get(event.aircraftId?.toString());
      const eventId = event._id.toString();
      alerts.push({
        id: eventId,
        type: 'aog',
        priority: 'critical',
        title: `AOG: ${ac?.registration || 'Unknown'}`,
        description: `${event.reasonCode} - ${event.responsibleParty}`,
        aircraftId: event.aircraftId?.toString(),
        aircraftRegistration: ac?.registration,
        actionUrl: `/aog/list?eventId=${eventId}`,
        createdAt: event.detectedAt?.toISOString() || new Date().toISOString(),
      });
    }

    // AOG events in blocking states (Warning) - Requirements 21.2
    const blockingStatuses = [
      AOGWorkflowStatus.FINANCE_APPROVAL_PENDING,
      AOGWorkflowStatus.AT_PORT,
      AOGWorkflowStatus.CUSTOMS_CLEARANCE,
      AOGWorkflowStatus.IN_TRANSIT,
    ];
    const blockedAOGEvents = await this.aogEventModel.find({
      clearedAt: null,
      currentStatus: { $in: blockingStatuses },
      blockingReason: { $exists: true, $ne: null },
    }).limit(10).exec();
    
    for (const event of blockedAOGEvents) {
      const ac = aircraftMap.get(event.aircraftId?.toString());
      const eventId = event._id.toString();
      // Skip if already added as active AOG
      if (alerts.some(a => a.id === eventId)) continue;
      
      const blockingReasonLabel = event.blockingReason || 'Unknown';
      const statusLabel = event.currentStatus?.replace(/_/g, ' ') || 'Unknown';
      
      alerts.push({
        id: `blocked-${eventId}`,
        type: 'aog_blocked',
        priority: 'warning',
        title: `AOG Blocked: ${ac?.registration || 'Unknown'}`,
        description: `Status: ${statusLabel} - Blocked by: ${blockingReasonLabel}`,
        aircraftId: event.aircraftId?.toString(),
        aircraftRegistration: ac?.registration,
        actionUrl: `/aog/list?eventId=${eventId}`,
        createdAt: event.detectedAt?.toISOString() || new Date().toISOString(),
      });
    }

    // Low availability aircraft (Warning)
    const fleetAvailability = await this.dailyStatusService.getFleetAvailability(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date(),
    );
    for (const item of fleetAvailability) {
      if (item.availabilityPercentage < 85) {
        // Convert aircraftId to string - it may be an ObjectId from aggregation
        const aircraftId = item.aircraftId?.toString() || '';
        const ac = aircraftMap.get(aircraftId);
        alerts.push({
          id: `avail-${aircraftId}`,
          type: 'low_availability',
          priority: item.availabilityPercentage < 70 ? 'critical' : 'warning',
          title: `Low Availability: ${ac?.registration || 'Unknown'}`,
          description: `${item.availabilityPercentage.toFixed(1)}% availability (last 30 days)`,
          aircraftId: aircraftId,
          aircraftRegistration: ac?.registration,
          actionUrl: `/aircraft/${aircraftId}`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Categorize alerts
    const critical = alerts.filter(a => a.priority === 'critical');
    const warning = alerts.filter(a => a.priority === 'warning');
    const info = alerts.filter(a => a.priority === 'info');

    return {
      critical,
      warning,
      info,
      totalCount: alerts.length,
      hasAlerts: alerts.length > 0,
    };
  }

  /**
   * Get period comparison for KPI deltas
   * Requirements: CEO Dashboard 2.1-2.5
   */
  async getPeriodComparison(startDate: Date, endDate: Date): Promise<PeriodComparison> {
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

    const [currentKPIs, previousKPIs] = await Promise.all([
      this.getKPISummary(startDate, endDate),
      this.getKPISummary(prevStartDate, prevEndDate),
    ]);

    const calcDelta = (current: number, previous: number, inverse = false) => {
      const value = current - previous;
      const percentage = previous !== 0 ? (value / previous) * 100 : 0;
      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (Math.abs(percentage) > 1) {
        trend = inverse ? (value > 0 ? 'down' : 'up') : (value > 0 ? 'up' : 'down');
      }
      return { value: Math.round(value * 100) / 100, percentage: Math.round(percentage * 10) / 10, trend };
    };

    return {
      current: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        fleetAvailability: currentKPIs.fleetAvailabilityPercentage,
        totalFlightHours: currentKPIs.totalFlightHours,
        totalCycles: currentKPIs.totalCycles,
        activeAOGCount: currentKPIs.activeAOGCount,
      },
      previous: {
        startDate: prevStartDate.toISOString(),
        endDate: prevEndDate.toISOString(),
        fleetAvailability: previousKPIs.fleetAvailabilityPercentage,
        totalFlightHours: previousKPIs.totalFlightHours,
        totalCycles: previousKPIs.totalCycles,
        activeAOGCount: previousKPIs.activeAOGCount,
      },
      deltas: {
        fleetAvailability: calcDelta(currentKPIs.fleetAvailabilityPercentage, previousKPIs.fleetAvailabilityPercentage),
        totalFlightHours: calcDelta(currentKPIs.totalFlightHours, previousKPIs.totalFlightHours),
        totalCycles: calcDelta(currentKPIs.totalCycles, previousKPIs.totalCycles),
        activeAOGCount: calcDelta(currentKPIs.activeAOGCount, previousKPIs.activeAOGCount, true),
      },
    };
  }

  /**
   * Get cost efficiency metrics
   * Requirements: CEO Dashboard 7.1-7.5
   */
  async getCostEfficiency(startDate?: Date, endDate?: Date): Promise<CostEfficiency> {
    const currentYear = new Date().getFullYear();
    const actualSpends = await this.actualSpendModel.find({
      period: { $regex: `^${currentYear}` },
    }).exec();
    const totalCost = actualSpends.reduce((sum, s) => sum + s.amount, 0);

    const utilizationData = await this.utilizationService.getAggregatedUtilization({
      period: 'year',
      startDate,
      endDate,
    });
    let totalFlightHours = 0;
    let totalCycles = 0;
    for (const record of utilizationData as { flightHours?: number; cycles?: number }[]) {
      totalFlightHours += Math.max(0, record.flightHours || 0);
      totalCycles += Math.max(0, record.cycles || 0);
    }

    const costPerFlightHour = totalFlightHours > 0 ? totalCost / totalFlightHours : 0;
    const costPerCycle = totalCycles > 0 ? totalCost / totalCycles : 0;

    return {
      costPerFlightHour: Math.round(costPerFlightHour * 100) / 100,
      costPerCycle: Math.round(costPerCycle * 100) / 100,
      totalCost,
      totalFlightHours: Math.max(0, Math.round(totalFlightHours * 100) / 100),
      totalCycles: Math.max(0, totalCycles),
      trend: { costPerFlightHour: 'flat', costPerCycle: 'flat' },
      period: {
        startDate: startDate?.toISOString() || new Date(currentYear, 0, 1).toISOString(),
        endDate: endDate?.toISOString() || new Date().toISOString(),
      },
    };
  }

  /**
   * Get fleet comparison - top and bottom performers
   * Requirements: CEO Dashboard 8.1-8.5
   */
  async getFleetComparison(startDate?: Date, endDate?: Date): Promise<FleetComparisonResponse> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const fleetAvailability = await this.dailyStatusService.getFleetAvailability(start, end);
    const aircraft = await this.aircraftModel.find({ status: 'active' }).exec();
    const aircraftMap = new Map(aircraft.map(a => [a._id.toString(), a]));

    const performers: AircraftPerformance[] = fleetAvailability.map(item => {
      // Convert aircraftId to string - it may be an ObjectId from aggregation
      const aircraftId = item.aircraftId?.toString() || '';
      const ac = aircraftMap.get(aircraftId);
      return {
        aircraftId: aircraftId,
        registration: ac?.registration || 'Unknown',
        fleetGroup: ac?.fleetGroup || 'Unknown',
        availabilityPercentage: Math.round(item.availabilityPercentage * 10) / 10,
        trend: 'flat' as const,
        utilizationHours: 0,
      };
    }).sort((a, b) => b.availabilityPercentage - a.availabilityPercentage);

    const fleetAverage = performers.length > 0
      ? performers.reduce((sum, p) => sum + p.availabilityPercentage, 0) / performers.length
      : 0;

    return {
      topPerformers: performers.slice(0, 3),
      bottomPerformers: performers.slice(-3).reverse(),
      fleetAverage: Math.round(fleetAverage * 10) / 10,
    };
  }

  /**
   * Get operational efficiency metrics (MTBF, MTTR, Dispatch Reliability)
   * Requirements: CEO Dashboard 11.1-11.5
   */
  async getOperationalEfficiency(startDate?: Date, endDate?: Date): Promise<OperationalEfficiency> {
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Get cleared AOG events for MTTR calculation
    const clearedAOGEvents = await this.aogEventModel.find({
      clearedAt: { $ne: null, $gte: start, $lte: end },
    }).sort({ clearedAt: 1 }).exec();

    // Calculate MTTR (Mean Time To Repair) - average duration of AOG events
    let mttrValue = 0;
    if (clearedAOGEvents.length > 0) {
      const totalRepairTime = clearedAOGEvents.reduce((sum, event) => {
        if (event.clearedAt && event.detectedAt) {
          const duration = (event.clearedAt.getTime() - event.detectedAt.getTime()) / (1000 * 60 * 60);
          return sum + duration;
        }
        return sum;
      }, 0);
      mttrValue = totalRepairTime / clearedAOGEvents.length;
    }

    // Calculate MTBF (Mean Time Between Failures) - average time between AOG events
    const allAOGEvents = await this.aogEventModel.find({
      detectedAt: { $gte: start, $lte: end },
    }).sort({ detectedAt: 1 }).exec();

    let mtbfValue = 0;
    if (allAOGEvents.length > 1) {
      let totalTimeBetween = 0;
      for (let i = 1; i < allAOGEvents.length; i++) {
        const timeBetween = (allAOGEvents[i].detectedAt.getTime() - allAOGEvents[i - 1].detectedAt.getTime()) / (1000 * 60 * 60);
        totalTimeBetween += timeBetween;
      }
      mtbfValue = totalTimeBetween / (allAOGEvents.length - 1);
    } else if (allAOGEvents.length === 0) {
      // No failures in period - use period length as MTBF
      mtbfValue = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    // Calculate Dispatch Reliability from daily status
    const dailyStatuses = await this.dailyStatusModel.find({
      date: { $gte: start, $lte: end },
    }).exec();

    let dispatchReliability = 100;
    if (dailyStatuses.length > 0) {
      const totalPosHours = dailyStatuses.reduce((sum, s) => sum + (s.posHours || 24), 0);
      const totalFmcHours = dailyStatuses.reduce((sum, s) => sum + (s.fmcHours || 24), 0);
      dispatchReliability = totalPosHours > 0 ? (totalFmcHours / totalPosHours) * 100 : 100;
    }

    return {
      mtbf: {
        value: Math.round(mtbfValue * 10) / 10,
        unit: 'hours',
        trend: 'flat',
      },
      mttr: {
        value: Math.round(mttrValue * 10) / 10,
        unit: 'hours',
        trend: 'flat',
        warning: mttrValue > 24,
      },
      dispatchReliability: {
        value: Math.round(dispatchReliability * 10) / 10,
        trend: 'flat',
      },
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    };
  }

  /**
   * Get maintenance forecast - upcoming scheduled maintenance
   * Requirements: CEO Dashboard 12.1-12.4
   */
  async getMaintenanceForecast(): Promise<MaintenanceForecastResponse> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get work orders with due dates in next 30 days
    const upcomingWOs = await this.workOrderModel.find({
      status: { $ne: 'Closed' },
      dueDate: { $gte: now, $lte: thirtyDaysFromNow },
    }).sort({ dueDate: 1 }).limit(20).exec();

    const aircraft = await this.aircraftModel.find({ status: 'active' }).exec();
    const aircraftMap = new Map(aircraft.map(a => [a._id.toString(), a]));

    const items: MaintenanceItem[] = upcomingWOs.map(wo => {
      const ac = aircraftMap.get(wo.aircraftId?.toString());
      const daysUntilDue = wo.dueDate 
        ? Math.ceil((wo.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 30;

      let priority: 'info' | 'warning' | 'critical' = 'info';
      if (daysUntilDue <= 0) priority = 'critical';
      else if (daysUntilDue <= 3) priority = 'warning';
      else if (daysUntilDue <= 7) priority = 'info';

      return {
        id: wo._id.toString(),
        aircraftId: wo.aircraftId?.toString() || '',
        registration: ac?.registration || 'Unknown',
        maintenanceType: wo.description.substring(0, 50),
        dueDate: wo.dueDate?.toISOString() || '',
        daysUntilDue,
        priority,
        workOrderRef: wo.woNumber,
      };
    });

    return {
      items,
      totalCount: items.length,
    };
  }

  /**
   * Get recent activity feed
   * Requirements: CEO Dashboard 13.1-13.3
   */
  async getRecentActivity(): Promise<RecentActivityResponse> {
    const activities: ActivityEvent[] = [];
    const aircraft = await this.aircraftModel.find().exec();
    const aircraftMap = new Map(aircraft.map(a => [a._id.toString(), a]));

    // Get recent AOG events (created or cleared)
    const recentAOGs = await this.aogEventModel.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .exec();

    for (const aog of recentAOGs) {
      const ac = aircraftMap.get(aog.aircraftId?.toString());
      activities.push({
        id: `aog-${aog._id}`,
        type: aog.clearedAt ? 'aog_cleared' : 'aog_created',
        description: aog.clearedAt 
          ? `AOG cleared for ${ac?.registration || 'Unknown'}`
          : `AOG detected for ${ac?.registration || 'Unknown'}: ${aog.reasonCode}`,
        timestamp: (aog.clearedAt || aog.detectedAt)?.toISOString() || new Date().toISOString(),
        aircraftId: aog.aircraftId?.toString(),
        aircraftRegistration: ac?.registration,
        actionUrl: `/aog/list?eventId=${aog._id}`,
      });
    }

    // Get recent work orders
    const recentWOs = await this.workOrderModel.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .exec();

    for (const wo of recentWOs) {
      const ac = aircraftMap.get(wo.aircraftId?.toString());
      activities.push({
        id: `wo-${wo._id}`,
        type: wo.status === 'Closed' ? 'wo_closed' : 'wo_created',
        description: wo.status === 'Closed'
          ? `Work order ${wo.woNumber} closed`
          : `Work order ${wo.woNumber} created: ${wo.description.substring(0, 50)}`,
        timestamp: wo.updatedAt?.toISOString() || new Date().toISOString(),
        aircraftId: wo.aircraftId?.toString(),
        aircraftRegistration: ac?.registration,
        actionUrl: '/work-orders',
      });
    }

    // Sort by timestamp and limit to 10
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      activities: activities.slice(0, 10),
      totalCount: Math.min(activities.length, 10),
    };
  }

  /**
   * Get automated insights
   * Requirements: CEO Dashboard 14.1-14.5
   */
  async getInsights(): Promise<InsightsResponse> {
    const insights: Insight[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get current and previous period availability
    const currentAvailability = await this.dailyStatusService.computeAvailability(undefined, thirtyDaysAgo, now);
    const previousAvailability = await this.dailyStatusService.computeAvailability(undefined, sixtyDaysAgo, thirtyDaysAgo);

    // Availability change insight
    const availabilityChange = currentAvailability.availabilityPercentage - previousAvailability.availabilityPercentage;
    if (Math.abs(availabilityChange) > 5) {
      insights.push({
        id: 'availability-change',
        type: 'availability',
        category: availabilityChange > 0 ? 'positive' : 'concerning',
        title: availabilityChange > 0 ? 'Fleet Availability Improved' : 'Fleet Availability Declined',
        description: `Fleet availability ${availabilityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(availabilityChange).toFixed(1)}% compared to previous period`,
        metric: {
          current: currentAvailability.availabilityPercentage,
          previous: previousAvailability.availabilityPercentage,
          change: availabilityChange,
        },
      });
    }

    // Check for aircraft in extended maintenance
    const aircraft = await this.aircraftModel.find({ status: 'active' }).exec();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const ac of aircraft) {
      const recentStatuses = await this.dailyStatusModel.find({
        aircraftId: ac._id,
        date: { $gte: sevenDaysAgo, $lte: now },
        fmcHours: { $lt: 12 }, // Less than 50% availability
      }).exec();

      if (recentStatuses.length >= 7) {
        insights.push({
          id: `extended-maintenance-${ac._id}`,
          type: 'maintenance',
          category: 'concerning',
          title: 'Extended Maintenance Period',
          description: `${ac.registration} has been in maintenance for more than 7 consecutive days`,
          aircraftId: ac._id.toString(),
          aircraftRegistration: ac.registration,
        });
      }
    }

    // Budget pacing insight
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const budgetPlans = await this.budgetPlanModel.find({ fiscalYear: currentYear }).exec();
    const actualSpends = await this.actualSpendModel.find({
      period: { $regex: `^${currentYear}` },
    }).exec();

    const totalPlanned = budgetPlans.reduce((sum, p) => sum + p.plannedAmount, 0);
    const totalSpent = actualSpends.reduce((sum, s) => sum + s.amount, 0);
    const budgetUtilization = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

    if (budgetUtilization > 80 && currentMonth < 9) {
      insights.push({
        id: 'budget-pacing',
        type: 'budget',
        category: 'concerning',
        title: 'Budget Pacing Ahead of Schedule',
        description: `${budgetUtilization.toFixed(1)}% of annual budget utilized by month ${currentMonth}`,
        metric: {
          current: budgetUtilization,
          previous: (currentMonth / 12) * 100,
          change: budgetUtilization - (currentMonth / 12) * 100,
        },
      });
    }

    return {
      insights,
      generatedAt: now.toISOString(),
    };
  }

  /**
   * Get year-over-year comparison
   * Requirements: CEO Dashboard 15.1-15.5
   */
  async getYoYComparison(startDate?: Date, endDate?: Date): Promise<YoYComparisonResponse> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const currentYear = end.getFullYear();
    const previousYear = currentYear - 1;

    // Calculate same period last year
    const prevYearStart = new Date(start);
    prevYearStart.setFullYear(previousYear);
    const prevYearEnd = new Date(end);
    prevYearEnd.setFullYear(previousYear);

    // Get current year KPIs
    const currentKPIs = await this.getKPISummary(start, end);
    
    // Get previous year KPIs
    const previousKPIs = await this.getKPISummary(prevYearStart, prevYearEnd);

    // Check for historical data - use availability as primary indicator since it doesn't depend on deltas
    // Also check if there's any daily status data for the previous year period
    const hasHistoricalData = previousKPIs.fleetAvailabilityPercentage > 0 || 
                              previousKPIs.totalFlightHours > 0 || 
                              previousKPIs.totalCycles > 0 ||
                              previousKPIs.totalPosHours > 0;

    const createMetric = (name: string, current: number, previous: number, higherIsBetter: boolean): YoYMetric => {
      const change = current - previous;
      const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;
      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (Math.abs(changePercentage) > 5) {
        trend = change > 0 ? 'up' : 'down';
      }
      const favorable = higherIsBetter ? change >= 0 : change <= 0;

      return {
        name,
        currentYear: Math.round(current * 100) / 100,
        previousYear: Math.round(previous * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercentage: Math.round(changePercentage * 10) / 10,
        trend,
        favorable,
      };
    };

    const metrics: YoYMetric[] = [
      createMetric('Fleet Availability', currentKPIs.fleetAvailabilityPercentage, previousKPIs.fleetAvailabilityPercentage, true),
      createMetric('Flight Hours', currentKPIs.totalFlightHours, previousKPIs.totalFlightHours, true),
      createMetric('Cycles', currentKPIs.totalCycles, previousKPIs.totalCycles, true),
    ];

    return {
      metrics,
      currentPeriod: { year: currentYear, startDate: start.toISOString(), endDate: end.toISOString() },
      previousPeriod: { year: previousYear, startDate: prevYearStart.toISOString(), endDate: prevYearEnd.toISOString() },
      hasHistoricalData,
    };
  }

  /**
   * Get defect patterns by ATA chapter
   * Requirements: CEO Dashboard 16.1-16.3
   */
  async getDefectPatterns(startDate?: Date, endDate?: Date): Promise<DefectPatternsResponse> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));

    // Aggregate discrepancies by ATA chapter for current period
    const currentPatterns = await this.discrepancyModel.aggregate([
      { $match: { dateDetected: { $gte: start, $lte: end } } },
      { $group: { _id: '$ataChapter', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]).exec();

    // Get previous period counts for trend calculation
    const previousPatterns = await this.discrepancyModel.aggregate([
      { $match: { dateDetected: { $gte: prevStart, $lt: start } } },
      { $group: { _id: '$ataChapter', count: { $sum: 1 } } },
    ]).exec();

    const prevCountMap = new Map(previousPatterns.map(p => [p._id, p.count]));

    // ATA chapter descriptions
    const ataDescriptions: Record<string, string> = {
      '21': 'Air Conditioning',
      '22': 'Auto Flight',
      '23': 'Communications',
      '24': 'Electrical Power',
      '25': 'Equipment/Furnishings',
      '26': 'Fire Protection',
      '27': 'Flight Controls',
      '28': 'Fuel',
      '29': 'Hydraulic Power',
      '30': 'Ice and Rain Protection',
      '31': 'Instruments',
      '32': 'Landing Gear',
      '33': 'Lights',
      '34': 'Navigation',
      '35': 'Oxygen',
      '36': 'Pneumatic',
      '38': 'Water/Waste',
      '49': 'Airborne Auxiliary Power',
      '52': 'Doors',
      '71': 'Power Plant',
      '72': 'Engine',
      '73': 'Engine Fuel and Control',
      '74': 'Ignition',
      '75': 'Air',
      '76': 'Engine Controls',
      '77': 'Engine Indicating',
      '78': 'Exhaust',
      '79': 'Oil',
      '80': 'Starting',
    };

    const patterns: DefectPattern[] = currentPatterns.map(p => {
      const prevCount = prevCountMap.get(p._id) || 0;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (p.count > prevCount * 1.1) trend = 'increasing';
      else if (p.count < prevCount * 0.9) trend = 'decreasing';

      return {
        ataChapter: p._id,
        ataDescription: ataDescriptions[p._id] || `ATA ${p._id}`,
        count: p.count,
        trend,
        previousCount: prevCount,
      };
    });

    const totalDiscrepancies = await this.discrepancyModel.countDocuments({
      dateDetected: { $gte: start, $lte: end },
    }).exec();

    return {
      patterns,
      totalDiscrepancies,
      period: { startDate: start.toISOString(), endDate: end.toISOString() },
    };
  }

  /**
   * Get data quality metrics
   * Requirements: CEO Dashboard 17.1-17.5
   */
  async getDataQuality(): Promise<DataQualityResponse> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all active aircraft
    const aircraft = await this.aircraftModel.find({ status: 'active' }).exec();
    const totalAircraft = aircraft.length;

    // Check daily status coverage
    const aircraftWithDailyStatus = await this.dailyStatusModel.distinct('aircraftId', {
      date: { $gte: sevenDaysAgo },
    }).exec();

    // Check utilization coverage
    const aircraftWithUtilization = await this.dailyCounterModel.distinct('aircraftId', {
      date: { $gte: sevenDaysAgo },
    }).exec();

    // Find most recent update
    const latestDailyStatus = await this.dailyStatusModel.findOne()
      .sort({ updatedAt: -1 })
      .exec();
    const latestUtilization = await this.dailyCounterModel.findOne()
      .sort({ updatedAt: -1 })
      .exec();

    const lastUpdate = latestDailyStatus?.updatedAt || latestUtilization?.updatedAt || now;
    const isStale = lastUpdate < twentyFourHoursAgo;

    // Find aircraft missing data
    const aircraftWithStatusSet = new Set(aircraftWithDailyStatus.map(id => id.toString()));
    const missingAircraft = aircraft
      .filter(ac => !aircraftWithStatusSet.has(ac._id.toString()))
      .map(ac => ac.registration);

    const warnings: string[] = [];
    if (isStale) {
      warnings.push('Data has not been updated in the last 24 hours');
    }
    if (missingAircraft.length > 0) {
      warnings.push(`${missingAircraft.length} aircraft missing recent daily status entries`);
    }

    return {
      lastUpdate: lastUpdate.toISOString(),
      isStale,
      coverage: {
        dailyStatus: {
          total: totalAircraft,
          withData: aircraftWithDailyStatus.length,
          percentage: totalAircraft > 0 ? Math.round((aircraftWithDailyStatus.length / totalAircraft) * 100) : 0,
        },
        utilization: {
          total: totalAircraft,
          withData: aircraftWithUtilization.length,
          percentage: totalAircraft > 0 ? Math.round((aircraftWithUtilization.length / totalAircraft) * 100) : 0,
        },
      },
      missingAircraft,
      warnings,
    };
  }

  /**
   * Get work order count trend from WorkOrderSummary
   * Requirements: 14.2
   */
  async getWorkOrderCountTrend(startDate?: Date, endDate?: Date): Promise<WorkOrderCountTrendResponse> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000); // Default to last year

    // Convert dates to period format (YYYY-MM)
    const startPeriod = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const endPeriod = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;

    // Get trends from WorkOrderSummariesService
    const trends = await this.workOrderSummariesService.getTrends({
      startPeriod,
      endPeriod,
    });

    // Transform to response format
    const trendPoints: WorkOrderCountTrendPoint[] = trends.map(t => ({
      period: t.period,
      workOrderCount: t.totalWorkOrderCount,
      totalCost: t.totalCost,
    }));

    // Calculate totals
    const totalCount = trendPoints.reduce((sum, t) => sum + t.workOrderCount, 0);
    const totalCost = trendPoints.reduce((sum, t) => sum + t.totalCost, 0);

    return {
      trends: trendPoints,
      totalCount,
      totalCost,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
    };
  }
}
