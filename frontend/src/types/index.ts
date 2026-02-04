// User and Auth types
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Aircraft types
export interface Aircraft {
  _id: string;
  id?: string; // Backend returns 'id' instead of '_id'
  registration: string;
  fleetGroup: string;
  aircraftType: string;
  msn: string;
  owner: string;
  manufactureDate: string;
  certificationDate?: string;
  inServiceDate?: string;
  enginesCount: number;
  status: 'active' | 'parked' | 'leased';
  createdAt: string;
  updatedAt: string;
}

// Daily Counter types
export interface DailyCounter {
  _id: string;
  aircraftId: string;
  date: string;
  airframeHoursTtsn: number;
  airframeCyclesTcsn: number;
  engine1Hours: number;
  engine1Cycles: number;
  engine2Hours: number;
  engine2Cycles: number;
  engine3Hours?: number;
  engine3Cycles?: number;
  engine4Hours?: number;
  engine4Cycles?: number;
  apuHours: number;
  apuCycles?: number;
  lastFlightDate?: string;
  createdAt: string;
}

// Daily Status types
export interface DailyStatus {
  _id: string;
  aircraftId: string;
  date: string;
  posHours: number;
  fmcHours: number;
  nmcmSHours: number;
  nmcmUHours: number;
  nmcsHours?: number;
  notes?: string;
  createdAt: string;
}


// AOG Workflow Status - 18 states for tracking AOG event progression
export type AOGWorkflowStatus =
  | 'REPORTED'
  | 'TROUBLESHOOTING'
  | 'ISSUE_IDENTIFIED'
  | 'RESOLVED_NO_PARTS'
  | 'PART_REQUIRED'
  | 'PROCUREMENT_REQUESTED'
  | 'FINANCE_APPROVAL_PENDING'
  | 'ORDER_PLACED'
  | 'IN_TRANSIT'
  | 'AT_PORT'
  | 'CUSTOMS_CLEARANCE'
  | 'RECEIVED_IN_STORES'
  | 'ISSUED_TO_MAINTENANCE'
  | 'INSTALLED_AND_TESTED'
  | 'ENGINE_RUN_REQUESTED'
  | 'ENGINE_RUN_COMPLETED'
  | 'BACK_IN_SERVICE'
  | 'CLOSED';

// Blocking Reason - reasons why an AOG is waiting
export type BlockingReason =
  | 'Finance'
  | 'Port'
  | 'Customs'
  | 'Vendor'
  | 'Ops'
  | 'Other';

// Part Request Status - tracking procurement lifecycle
export type PartRequestStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'ORDERED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'ISSUED';

// Status History Entry - append-only timeline of workflow transitions
export interface StatusHistoryEntry {
  fromStatus: AOGWorkflowStatus;
  toStatus: AOGWorkflowStatus;
  timestamp: string;
  actorId: string;
  actorRole: string;
  notes?: string;
  partRequestId?: string;
  financeRef?: string;
  shippingRef?: string;
  opsRunRef?: string;
}

// Part Request - tracking parts within an AOG event
export interface PartRequest {
  _id: string;
  partNumber: string;
  partDescription: string;
  quantity: number;
  estimatedCost?: number;
  actualCost?: number;
  vendor?: string;
  requestedDate: string;
  status: PartRequestStatus;
  invoiceRef?: string;
  trackingNumber?: string;
  eta?: string;
  receivedDate?: string;
  issuedDate?: string;
}

// Cost Audit Entry - tracking cost field changes
export interface CostAuditEntry {
  field: string;
  previousValue: number;
  newValue: number;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

// Attachment Metadata - enhanced attachment tracking
export interface AttachmentMeta {
  s3Key: string;
  filename: string;
  attachmentType: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize?: number;
  mimeType?: string;
}

// Milestone History Entry - tracking milestone timestamp changes
export interface MilestoneHistoryEntry {
  milestone: string;
  timestamp: string;
  recordedAt: string;
  recordedBy: string;
}

// AOG Event types (extended with workflow fields)
export interface AOGEvent {
  _id: string;
  aircraftId: string;
  detectedAt: string;
  clearedAt?: string;
  category: 'scheduled' | 'unscheduled' | 'aog' | 'mro' | 'cleaning';
  reasonCode: string;
  location?: string; // ICAO airport code (e.g., OERK, LFSB)
  responsibleParty: 'Internal' | 'OEM' | 'Customs' | 'Finance' | 'Other';
  actionTaken: string;
  manpowerCount: number;
  manHours: number;
  // Existing cost fields
  costLabor?: number;
  costParts?: number;
  costExternal?: number;
  // Workflow status fields
  currentStatus?: AOGWorkflowStatus;
  blockingReason?: BlockingReason;
  statusHistory?: StatusHistoryEntry[];
  partRequests?: PartRequest[];
  // Estimated costs
  estimatedCostLabor?: number;
  estimatedCostParts?: number;
  estimatedCostExternal?: number;
  // Budget integration
  budgetClauseId?: number;
  budgetPeriod?: string;
  isBudgetAffecting?: boolean;
  linkedActualSpendId?: string;
  // Cost audit trail
  costAuditTrail?: CostAuditEntry[];
  // Attachments
  attachments: string[];
  attachmentsMeta?: AttachmentMeta[];
  // Legacy indicator
  isLegacy?: boolean;
  isDemo?: boolean;
  // Milestone timestamps (simplified workflow)
  reportedAt?: string;
  procurementRequestedAt?: string;
  availableAtStoreAt?: string;
  issuedBackAt?: string;
  installationCompleteAt?: string;
  testStartAt?: string;
  upAndRunningAt?: string;
  // Computed downtime metrics
  technicalTimeHours?: number;
  procurementTimeHours?: number;
  opsTimeHours?: number;
  totalDowntimeHours?: number;
  // Simplified cost fields
  internalCost?: number;
  externalCost?: number;
  // Milestone history
  milestoneHistory?: MilestoneHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
}

// Maintenance Task types
export interface MaintenanceTask {
  _id: string;
  aircraftId: string;
  date: string;
  shift: 'Morning' | 'Evening' | 'Night' | 'Other';
  taskType: string;
  taskDescription: string;
  manpowerCount: number;
  manHours: number;
  cost?: number;
  workOrderRef?: string;
  createdAt: string;
}

// Work Order types
export interface WorkOrder {
  _id: string;
  woNumber: string;
  aircraftId: string;
  description: string;
  status: 'Open' | 'InProgress' | 'Closed' | 'Deferred';
  dateIn: string;
  dateOut?: string;
  dueDate?: string;
  crsNumber?: string;
  mrNumber?: string;
  isOverdue?: boolean;
  createdAt: string;
}

// Work Order Summary types (Requirements: 11.1)
// Monthly aggregated work order count per aircraft
export interface WorkOrderSummary {
  _id: string;
  aircraftId: string;
  period: string; // YYYY-MM format
  workOrderCount: number;
  totalCost?: number;
  currency: string;
  notes?: string;
  sourceRef?: string; // Reference to external system
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Work Order Summary with populated aircraft data
export interface WorkOrderSummaryWithAircraft extends WorkOrderSummary {
  aircraft?: Aircraft;
}

// Create/Update Work Order Summary DTO
export interface CreateWorkOrderSummaryDto {
  aircraftId: string;
  period: string; // YYYY-MM format
  workOrderCount: number;
  totalCost?: number;
  currency?: string;
  notes?: string;
  sourceRef?: string;
}

export interface UpdateWorkOrderSummaryDto {
  workOrderCount?: number;
  totalCost?: number;
  currency?: string;
  notes?: string;
  sourceRef?: string;
}

// Work Order Summary Filter
export interface WorkOrderSummaryFilter {
  aircraftId?: string;
  fleetGroup?: string;
  startPeriod?: string; // YYYY-MM
  endPeriod?: string; // YYYY-MM
}

// Work Order Summary Trend Response
export interface WorkOrderSummaryTrendPoint {
  period: string;
  workOrderCount: number;
  totalCost: number;
  aircraftCount: number;
}

export interface WorkOrderSummaryTrendResponse {
  trends: WorkOrderSummaryTrendPoint[];
  totalWorkOrders: number;
  totalCost: number;
  period: {
    startPeriod: string;
    endPeriod: string;
  };
}

// Discrepancy types
export interface Discrepancy {
  _id: string;
  aircraftId: string;
  dateDetected: string;
  ataChapter: string;
  discrepancyText: string;
  dateCorrected?: string;
  correctiveAction?: string;
  responsibility?: 'Internal' | 'OEM' | 'Customs' | 'Finance' | 'AOG' | 'Other';
  type?: 'AD' | 'ADDR' | 'AOG' | 'CADD' | 'CDL' | 'CORR' | 'DMI';
  downtimeHours?: number;
  createdAt: string;
}

// Budget types
export interface BudgetPlan {
  _id: string;
  fiscalYear: number;
  clauseId: number;
  clauseDescription: string;
  aircraftGroup: string;
  plannedAmount: number;
  currency: string;
  createdAt: string;
}

export interface ActualSpend {
  _id: string;
  period: string;
  aircraftGroup?: string;
  aircraftId?: string;
  clauseId: number;
  amount: number;
  currency: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
}

// Dashboard KPI types
export interface DashboardKPIs {
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

// Fleet Availability types
export interface FleetAvailabilityItem {
  aircraftId: string;
  totalPosHours: number;
  totalFmcHours: number;
  availabilityPercentage: number;
  recordCount: number;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Filter types
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

// Health Check types
export interface CollectionCount {
  name: string;
  count: number;
  status: 'ok' | 'warning' | 'empty';
}

export interface HealthCheckResponse {
  collections: CollectionCount[];
  lastFetch: string;
  apiStatus: 'connected' | 'error';
}

export interface SeedTriggerResponse {
  success: boolean;
  message: string;
}


// Executive Dashboard Types (CEO Enhancements)
export interface FleetHealthScore {
  score: number;
  status: 'healthy' | 'caution' | 'warning' | 'critical';
  components: {
    availability: {
      score: number;
      weight: number;
      value: number;
    };
    aogImpact: {
      score: number;
      weight: number;
      activeCount: number;
    };
    budgetHealth: {
      score: number;
      weight: number;
      utilizationPercentage: number;
    };
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

export interface PeriodComparisonKPIs {
  startDate: string;
  endDate: string;
  fleetAvailability: number;
  totalFlightHours: number;
  totalCycles: number;
  activeAOGCount: number;
}

export interface DeltaValue {
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'flat';
}

export interface PeriodComparison {
  current: PeriodComparisonKPIs;
  previous: PeriodComparisonKPIs;
  deltas: {
    fleetAvailability: DeltaValue;
    totalFlightHours: DeltaValue;
    totalCycles: DeltaValue;
    activeAOGCount: DeltaValue;
  };
}

export interface CostEfficiency {
  costPerFlightHour: number;
  costPerCycle: number;
  totalCost: number;
  totalFlightHours: number;
  totalCycles: number;
  previousPeriod?: {
    costPerFlightHour: number;
    costPerCycle: number;
  };
  trend: {
    costPerFlightHour: 'up' | 'down' | 'flat';
    costPerCycle: 'up' | 'down' | 'flat';
  };
  period: {
    startDate: string;
    endDate: string;
  };
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

export interface FleetStatusSummary {
  active: number;
  inMaintenance: number;
  aog: number;
  total: number;
}


// Operational Efficiency Types (CEO Dashboard)
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


// Maintenance Forecast Types (CEO Dashboard)
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


// Recent Activity Types (CEO Dashboard)
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


// Insights Types (CEO Dashboard)
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


// Year-over-Year Types (CEO Dashboard)
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


// Defect Patterns Types (CEO Dashboard)
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


// Data Quality Types (CEO Dashboard)
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

// Work Order Count Trend Types (Requirements 14.2)
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


// Demo API Types
export interface DemoCollectionCounts {
  aircraft: number;
  dailyStatus: number;
  dailyCounters: number;
  aogEvents: number;
  maintenanceTasks: number;
  workOrders: number;
  discrepancies: number;
  budgetPlans: number;
  actualSpend: number;
}

export interface DemoSeedResponse {
  success: boolean;
  message: string;
  counts: DemoCollectionCounts;
  duration: number;
}

export interface DemoResetResponse {
  success: boolean;
  message: string;
  deletedCounts: DemoCollectionCounts;
}

export interface DemoStatusResponse {
  hasDemoData: boolean;
  counts: DemoCollectionCounts;
}


// AOG Workflow DTOs (for API operations)
export interface CreateTransitionDto {
  toStatus: AOGWorkflowStatus;
  notes?: string;
  blockingReason?: BlockingReason;
  metadata?: {
    partRequestId?: string;
    financeRef?: string;
    shippingRef?: string;
    opsRunRef?: string;
  };
}

export interface CreatePartRequestDto {
  partNumber: string;
  partDescription: string;
  quantity: number;
  estimatedCost?: number;
  vendor?: string;
  requestedDate: string;
}

export interface UpdatePartRequestDto {
  partNumber?: string;
  partDescription?: string;
  quantity?: number;
  estimatedCost?: number;
  actualCost?: number;
  vendor?: string;
  status?: PartRequestStatus;
  invoiceRef?: string;
  trackingNumber?: string;
  eta?: string;
  receivedDate?: string;
  issuedDate?: string;
}

export interface GenerateSpendDto {
  budgetClauseId: number;
  budgetPeriod: string;
  notes?: string;
}

// AOG Analytics Types
export interface AOGStageBreakdown {
  status: AOGWorkflowStatus;
  count: number;
  percentage: number;
}

export interface AOGBlockingBreakdown {
  reason: BlockingReason;
  count: number;
  percentage: number;
}

export interface AOGStagesAnalyticsResponse {
  byStatus: AOGStageBreakdown[];
  byBlockingReason: AOGBlockingBreakdown[];
  totalActive: number;
  totalBlocked: number;
}

export interface AOGBottleneckMetric {
  status: AOGWorkflowStatus;
  averageTimeHours: number;
  count: number;
}

export interface AOGBottlenecksAnalyticsResponse {
  byStatus: AOGBottleneckMetric[];
  byBlockingReason: {
    reason: BlockingReason;
    averageTimeHours: number;
    count: number;
  }[];
  overallAverageResolutionHours: number;
}

// Category Breakdown Types (Requirements: 8.1, 16.4)
export interface CategoryBreakdownItem {
  category: string;
  count: number;
  percentage: number;
  totalHours: number;
}

export interface CategoryBreakdownResponse {
  categories: CategoryBreakdownItem[];
}

// Location Heatmap Types (Requirements: 8.2, 16.3)
export interface LocationHeatmapItem {
  location: string;
  count: number;
  percentage: number;
}

export interface LocationHeatmapResponse {
  locations: LocationHeatmapItem[];
}

// Duration Distribution Types (Requirements: 8.3, 6.5)
export interface DurationDistributionItem {
  range: string;
  count: number;
  percentage: number;
}

export interface DurationDistributionResponse {
  ranges: DurationDistributionItem[];
}

// Aircraft Reliability Types (Requirements: 8.4, 16.1)
export interface AircraftReliabilityItem {
  aircraftId: string;
  registration: string;
  eventCount: number;
  totalHours: number;
}

export interface AircraftReliabilityResponse {
  mostReliable: AircraftReliabilityItem[];
  needsAttention: AircraftReliabilityItem[];
}

// Monthly Trend Types (Requirements: 8.5, 16.5)
export interface MonthlyTrendItem {
  month: string;
  count: number;
  totalHours: number;
}

export interface MonthlyTrendResponse {
  months: MonthlyTrendItem[];
}

// Insights Types (Requirements: 16.1-16.8)
export interface AOGInsightsResponse {
  topProblemAircraft: Array<{
    registration: string;
    eventCount: number;
    totalHours: number;
  }>;
  mostCommonIssues: Array<{
    issue: string;
    count: number;
  }>;
  busiestLocations: Array<{
    location: string;
    count: number;
  }>;
  averageResolutionTime: {
    aog: number;
    scheduled: number;
    unscheduled: number;
    mro: number;
    cleaning: number;
  };
  fleetHealthScore: number;
}

// ============================================
// AOG Analytics Enhancement Types (FR-2.2, FR-2.6, FR-1.3)
// ============================================

/**
 * Monthly Trend Data Point
 * Requirements: FR-2.2
 */
export interface MonthlyTrendDataPoint {
  month: string; // YYYY-MM format
  eventCount: number;
  totalDowntimeHours: number;
  averageDowntimeHours: number;
}

/**
 * Monthly Trend Response with Moving Average
 * Requirements: FR-2.2
 */
export interface MonthlyTrendResponseDto {
  trends: MonthlyTrendDataPoint[];
  movingAverage: Array<{
    month: string;
    value: number;
  }>;
}

/**
 * Forecast Data Point
 * Requirements: FR-2.6
 */
export interface ForecastDataPoint {
  month: string;
  predicted: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

/**
 * Forecast Response with Historical and Predicted Data
 * Requirements: FR-2.6
 */
export interface ForecastData {
  historical: Array<{
    month: string;
    actual: number;
  }>;
  forecast: ForecastDataPoint[];
}

/**
 * Automated Insight
 * Requirements: FR-2.6
 */
export interface AutomatedInsight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  metric?: number;
  recommendation?: string;
}

/**
 * Data Quality Metrics
 * Requirements: FR-1.3
 */
export interface DataQualityMetrics {
  completenessPercentage: number;
  legacyEventCount: number;
  totalEvents: number;
  eventsWithMilestones?: number;
}

/**
 * Insights Response with Data Quality
 * Requirements: FR-2.6, FR-1.3
 */
export interface InsightsResponseDto {
  insights: AutomatedInsight[];
  dataQuality: DataQualityMetrics;
}

/**
 * Analytics Filter Interface
 * Used across all analytics endpoints
 * Requirements: FR-2.2, FR-2.6, FR-1.3
 */
export interface AnalyticsFilters {
  aircraftId?: string;
  fleetGroup?: string;
  startDate?: string;
  endDate?: string;
}

// AOG Analytics Types
export interface AOGStageBreakdown {
  status: AOGWorkflowStatus;
  count: number;
  percentage: number;
}

export interface AOGBlockingBreakdown {
  reason: BlockingReason;
  count: number;
  percentage: number;
}

export interface AOGStagesAnalyticsResponse {
  byStatus: AOGStageBreakdown[];
  byBlockingReason: AOGBlockingBreakdown[];
  totalActive: number;
  totalBlocked: number;
}

export interface AOGBottleneckMetric {
  status: AOGWorkflowStatus;
  averageTimeHours: number;
  count: number;
}

export interface AOGBottlenecksAnalyticsResponse {
  byStatus: AOGBottleneckMetric[];
  byBlockingReason: {
    reason: BlockingReason;
    averageTimeHours: number;
    count: number;
  }[];
  overallAverageResolutionHours: number;
}

// Three-Bucket Analytics Types (AOG Analytics Simplification)
// Requirements: 5.2, 5.3, 5.4

/**
 * Summary statistics for three-bucket analytics
 */
export interface ThreeBucketSummary {
  totalEvents: number;
  activeEvents: number;
  totalDowntimeHours: number;
  averageDowntimeHours: number;
}

/**
 * AOG Data Quality Metrics
 * Requirements: FR-1.3
 * 
 * Tracks completeness of milestone data for AOG events.
 * An event is "complete" if it has:
 * - reportedAt (or detectedAt as fallback)
 * - installationCompleteAt
 * - upAndRunningAt (or clearedAt as fallback)
 */
export interface AOGDataQualityMetrics {
  totalEvents: number;
  eventsWithMilestones: number;
  completenessPercentage: number;
  legacyEventCount: number;
}

/**
 * Individual bucket metrics
 */
export interface BucketMetrics {
  totalHours: number;
  averageHours: number;
  percentage: number;
}

/**
 * Three-bucket breakdown (Technical, Procurement, Ops)
 */
export interface ThreeBucketBreakdown {
  technical: BucketMetrics;
  procurement: BucketMetrics;
  ops: BucketMetrics;
}

/**
 * Per-aircraft breakdown for three-bucket analytics
 */
export interface AircraftBucketBreakdown {
  aircraftId: string;
  registration: string;
  technicalHours: number;
  procurementHours: number;
  opsHours: number;
  totalHours: number;
}

/**
 * Complete three-bucket analytics response
 * Requirements: 5.2, 5.3, 5.4, FR-1.1, FR-1.3
 */
export interface ThreeBucketAnalytics {
  summary: ThreeBucketSummary;
  buckets: ThreeBucketBreakdown;
  byAircraft: AircraftBucketBreakdown[];
  // Legacy data handling (FR-1.1, FR-1.3)
  legacyEventCount?: number;
  legacyDowntimeHours?: number;
}

/**
 * Filter parameters for three-bucket analytics
 * Requirements: 5.1
 */
export interface ThreeBucketAnalyticsFilter {
  aircraftId?: string;
  fleetGroup?: string;
  startDate?: string;
  endDate?: string;
}

// AOG Workflow Constants
export const AOG_WORKFLOW_STATUS_LABELS: Record<AOGWorkflowStatus, string> = {
  REPORTED: 'Reported',
  TROUBLESHOOTING: 'Troubleshooting',
  ISSUE_IDENTIFIED: 'Issue Identified',
  RESOLVED_NO_PARTS: 'Resolved (No Parts)',
  PART_REQUIRED: 'Part Required',
  PROCUREMENT_REQUESTED: 'Procurement Requested',
  FINANCE_APPROVAL_PENDING: 'Finance Approval Pending',
  ORDER_PLACED: 'Order Placed',
  IN_TRANSIT: 'In Transit',
  AT_PORT: 'At Port',
  CUSTOMS_CLEARANCE: 'Customs Clearance',
  RECEIVED_IN_STORES: 'Received in Stores',
  ISSUED_TO_MAINTENANCE: 'Issued to Maintenance',
  INSTALLED_AND_TESTED: 'Installed & Tested',
  ENGINE_RUN_REQUESTED: 'Engine Run Requested',
  ENGINE_RUN_COMPLETED: 'Engine Run Completed',
  BACK_IN_SERVICE: 'Back in Service',
  CLOSED: 'Closed',
};

export const BLOCKING_REASON_LABELS: Record<BlockingReason, string> = {
  Finance: 'Finance',
  Port: 'Port',
  Customs: 'Customs',
  Vendor: 'Vendor',
  Ops: 'Operations',
  Other: 'Other',
};

export const PART_REQUEST_STATUS_LABELS: Record<PartRequestStatus, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  ORDERED: 'Ordered',
  SHIPPED: 'Shipped',
  RECEIVED: 'Received',
  ISSUED: 'Issued',
};

// Statuses that require blocking reason
export const BLOCKING_STATUSES: AOGWorkflowStatus[] = [
  'FINANCE_APPROVAL_PENDING',
  'AT_PORT',
  'CUSTOMS_CLEARANCE',
  'IN_TRANSIT',
];

// ============================================
// Vacation Plan Types (Requirements: 15.1)
// ============================================

/**
 * VacationTeam type
 * Represents the two teams that have vacation plans
 */
export type VacationTeam = 'Engineering' | 'TPL';

/**
 * VacationEmployee interface
 * Represents an employee's vacation schedule with 48 weekly cells
 */
export interface VacationEmployee {
  name: string;
  cells: number[]; // 48 weeks of values (4 weeks per month × 12 months)
  total: number; // Computed sum of cells
}

/**
 * VacationPlan interface
 * Annual vacation schedule for a team with 48 weekly columns
 */
export interface VacationPlan {
  _id: string;
  year: number;
  team: VacationTeam;
  employees: VacationEmployee[];
  overlaps: string[]; // 'Ok' or 'Check' per week (48 elements)
  updatedBy: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Create Vacation Plan DTO
 */
export interface CreateVacationPlanDto {
  year: number;
  team: VacationTeam;
  employees?: VacationEmployee[];
}

/**
 * Update Vacation Plan DTO
 */
export interface UpdateVacationPlanDto {
  employees?: VacationEmployee[];
}

/**
 * Update Cell DTO - for single cell edits
 */
export interface UpdateCellDto {
  employeeName: string;
  weekIndex: number;
  value: number;
}

/**
 * Vacation Plan Filter
 */
export interface VacationPlanFilter {
  year?: number;
  team?: VacationTeam;
}

/**
 * Vacation Team Labels
 */
export const VACATION_TEAM_LABELS: Record<VacationTeam, string> = {
  Engineering: 'Engineering',
  TPL: 'Technical Planning',
};

/**
 * Month names for grid headers
 */
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Week labels for grid headers (W1-W4 for each month)
 */
export const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4'];

// Terminal statuses (AOG resolved)
export const TERMINAL_STATUSES: AOGWorkflowStatus[] = [
  'BACK_IN_SERVICE',
  'CLOSED',
];

// Allowed transitions map
export const ALLOWED_TRANSITIONS: Record<AOGWorkflowStatus, AOGWorkflowStatus[]> = {
  REPORTED: ['TROUBLESHOOTING'],
  TROUBLESHOOTING: ['ISSUE_IDENTIFIED'],
  ISSUE_IDENTIFIED: ['RESOLVED_NO_PARTS', 'PART_REQUIRED'],
  RESOLVED_NO_PARTS: ['BACK_IN_SERVICE'],
  PART_REQUIRED: ['PROCUREMENT_REQUESTED'],
  PROCUREMENT_REQUESTED: ['FINANCE_APPROVAL_PENDING'],
  FINANCE_APPROVAL_PENDING: ['ORDER_PLACED'],
  ORDER_PLACED: ['IN_TRANSIT'],
  IN_TRANSIT: ['AT_PORT', 'RECEIVED_IN_STORES'],
  AT_PORT: ['CUSTOMS_CLEARANCE'],
  CUSTOMS_CLEARANCE: ['RECEIVED_IN_STORES'],
  RECEIVED_IN_STORES: ['ISSUED_TO_MAINTENANCE'],
  ISSUED_TO_MAINTENANCE: ['INSTALLED_AND_TESTED'],
  INSTALLED_AND_TESTED: ['ENGINE_RUN_REQUESTED', 'BACK_IN_SERVICE'],
  ENGINE_RUN_REQUESTED: ['ENGINE_RUN_COMPLETED'],
  ENGINE_RUN_COMPLETED: ['BACK_IN_SERVICE'],
  BACK_IN_SERVICE: ['CLOSED'],
  CLOSED: [],
};
