# AOG Analytics Developer Guide

## Overview

This guide provides technical documentation for developers working on the AOG Analytics enhancement project. It covers component architecture, data flow, performance optimization techniques, and how to add new visualizations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Structure](#component-structure)
3. [Data Flow](#data-flow)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Performance Optimization](#performance-optimization)
7. [Adding New Visualizations](#adding-new-visualizations)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AOGAnalyticsPage                                      │ │
│  │  ├── Filters & Data Quality                           │ │
│  │  ├── Summary Cards                                     │ │
│  │  ├── Three-Bucket Section (4 charts)                  │ │
│  │  ├── Trend Analysis Section (3 charts)                │ │
│  │  ├── Aircraft Performance Section (2 charts)          │ │
│  │  ├── Root Cause Section (3 charts)                    │ │
│  │  ├── Cost Analysis Section (2 charts)                 │ │
│  │  └── Predictive Analytics Section (3 components)      │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Custom Hooks (TanStack Query)                        │ │
│  │  ├── useThreeBucketAnalytics                          │ │
│  │  ├── useMonthlyTrend                                  │ │
│  │  ├── useForecast                                      │ │
│  │  └── useInsights                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AOGEventsController                                   │ │
│  │  ├── GET /analytics/buckets                           │ │
│  │  ├── GET /analytics/monthly-trend                     │ │
│  │  ├── GET /analytics/insights                          │ │
│  │  └── GET /analytics/forecast                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AOGEventsService                                      │ │
│  │  ├── getThreeBucketAnalytics()                        │ │
│  │  ├── getMonthlyTrend()                                │ │
│  │  ├── generateInsights()                               │ │
│  │  └── generateForecast()                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  MongoDB Aggregation Pipelines                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                     MongoDB Database                         │
│  Collection: aogevents                                       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend Framework | React | 18.x | UI components |
| Type Safety | TypeScript | 5.x | Static typing |
| State Management | TanStack Query | 5.x | Server state caching |
| Charts | Recharts | 2.x | Data visualization |
| PDF Generation | jsPDF + html2canvas | Latest | PDF export |
| Backend Framework | NestJS | 10.x | REST API |
| Database | MongoDB | 6.x | Document storage |
| ODM | Mongoose | 8.x | Schema validation |



## Component Structure

### Frontend Component Hierarchy

```
AOGAnalyticsPage.tsx
├── Filters
│   ├── DateRangePicker
│   ├── AircraftSelect
│   └── FleetGroupSelect
├── AOGDataQualityIndicator.tsx
├── Summary Cards (4x)
├── Three-Bucket Section
│   ├── BucketSummaryCards
│   ├── ThreeBucketBarChart.tsx
│   ├── ThreeBucketPieChart.tsx
│   ├── BucketTrendChart.tsx (NEW)
│   └── WaterfallChart.tsx (NEW)
├── Trend Analysis Section
│   ├── MonthlyTrendChart.tsx (NEW)
│   ├── MovingAverageChart.tsx (NEW)
│   └── YearOverYearChart.tsx (NEW)
├── Aircraft Performance Section
│   ├── AircraftHeatmap.tsx (NEW)
│   └── ReliabilityScoreCards.tsx (NEW)
├── Root Cause Section
│   ├── ParetoChart.tsx (NEW)
│   ├── CategoryBreakdownPie.tsx (NEW)
│   └── ResponsibilityDistributionChart.tsx (NEW)
├── Cost Analysis Section
│   ├── CostBreakdownChart.tsx (NEW)
│   └── CostEfficiencyMetrics.tsx (NEW)
├── Predictive Analytics Section
│   ├── ForecastChart.tsx (NEW)
│   ├── RiskScoreGauge.tsx (NEW)
│   └── InsightsPanel.tsx (NEW)
└── EnhancedAOGAnalyticsPDFExport.tsx (NEW)
```

### Component Responsibilities

| Component | Responsibility | Props | State |
|-----------|---------------|-------|-------|
| AOGAnalyticsPage | Page container, filter management | None | filters, dateRange |
| AOGDataQualityIndicator | Display data completeness | totalEvents, eventsWithMilestones | None |
| BucketTrendChart | Stacked area chart for bucket trends | data, isLoading | None |
| MonthlyTrendChart | Combo chart for monthly trends | data, isLoading | None |
| AircraftHeatmap | Grid heatmap for aircraft performance | data, onCellClick | hoveredCell |
| ParetoChart | Combo chart for reason code analysis | data, isLoading | None |
| ForecastChart | Line chart with confidence interval | historical, forecast | None |
| InsightsPanel | Display automated insights | insights, isLoading | None |

### Shared UI Components

Located in `frontend/src/components/ui/`:

- **ChartSkeleton.tsx**: Loading skeleton for charts
- **ChartEmptyState.tsx**: Empty state when no data
- **AnalyticsSectionErrorBoundary.tsx**: Error boundary for chart sections
- **InfoTooltip.tsx**: Tooltip with info icon

## Data Flow

### Request Flow

```
1. User Action (filter change, page load)
   ↓
2. React Component (AOGAnalyticsPage)
   ↓
3. Custom Hook (useThreeBucketAnalytics, useMonthlyTrend, etc.)
   ↓
4. TanStack Query (fetch, cache, invalidate)
   ↓
5. API Request (GET /api/aog-events/analytics/*)
   ↓
6. NestJS Controller (AOGEventsController)
   ↓
7. Service Layer (AOGEventsService)
   ↓
8. MongoDB Aggregation Pipeline
   ↓
9. Response (JSON)
   ↓
10. TanStack Query Cache
   ↓
11. React Component Re-render
   ↓
12. Chart Visualization (Recharts)
```

### Data Transformation Pipeline

```typescript
// Backend: MongoDB → Service → DTO
MongoDB Document (AOGEvent)
  ↓ Aggregation Pipeline
Aggregated Data (raw)
  ↓ Service Layer Processing
Response DTO (typed)
  ↓ HTTP Response
JSON

// Frontend: API → Hook → Component
JSON Response
  ↓ TanStack Query
Cached Data (typed)
  ↓ Custom Hook
Transformed Data (chart-ready)
  ↓ Component Props
Chart Component
  ↓ Recharts
SVG Visualization
```

### Cache Strategy

```typescript
// TanStack Query Configuration
{
  queryKey: ['aog-analytics', 'buckets', filters],
  queryFn: () => fetchThreeBucketAnalytics(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: true,
}

// Cache Invalidation
// Triggered on: AOG event create, update, delete
queryClient.invalidateQueries(['aog-analytics']);
```

## Backend Implementation

### MongoDB Aggregation Pipeline Example

```typescript
// Three-Bucket Analytics Pipeline
async getThreeBucketAnalytics(filters: AnalyticsFilterDto) {
  const pipeline = [
    // Stage 1: Match by filters
    {
      $match: {
        detectedAt: {
          $gte: filters.startDate || new Date('2020-01-01'),
          $lte: filters.endDate || new Date(),
        },
        ...(filters.aircraftId && { 
          aircraftId: new Types.ObjectId(filters.aircraftId) 
        }),
        ...(filters.fleetGroup && { 
          'aircraft.fleetGroup': filters.fleetGroup 
        }),
      },
    },
    
    // Stage 2: Lookup aircraft details
    {
      $lookup: {
        from: 'aircraft',
        localField: 'aircraftId',
        foreignField: '_id',
        as: 'aircraft',
      },
    },
    
    // Stage 3: Unwind aircraft array
    { $unwind: { path: '$aircraft', preserveNullAndEmptyArrays: true } },
    
    // Stage 4: Group and aggregate
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        activeEvents: {
          $sum: { $cond: [{ $eq: ['$clearedAt', null] }, 1, 0] },
        },
        totalDowntimeHours: { 
          $sum: { $ifNull: ['$totalDowntimeHours', 0] } 
        },
        technicalHours: { 
          $sum: { $ifNull: ['$technicalTimeHours', 0] } 
        },
        procurementHours: { 
          $sum: { $ifNull: ['$procurementTimeHours', 0] } 
        },
        opsHours: { 
          $sum: { $ifNull: ['$opsTimeHours', 0] } 
        },
      },
    },
    
    // Stage 5: Project final shape
    {
      $project: {
        _id: 0,
        summary: {
          totalEvents: '$totalEvents',
          activeEvents: '$activeEvents',
          totalDowntimeHours: { $round: ['$totalDowntimeHours', 2] },
          averageDowntimeHours: {
            $round: [
              { $divide: ['$totalDowntimeHours', '$totalEvents'] },
              2,
            ],
          },
        },
        buckets: {
          technical: {
            totalHours: { $round: ['$technicalHours', 2] },
            averageHours: {
              $round: [{ $divide: ['$technicalHours', '$totalEvents'] }, 2],
            },
            percentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$technicalHours', '$totalDowntimeHours'] },
                    100,
                  ],
                },
                1,
              ],
            },
          },
          procurement: {
            totalHours: { $round: ['$procurementHours', 2] },
            averageHours: {
              $round: [
                { $divide: ['$procurementHours', '$totalEvents'] },
                2,
              ],
            },
            percentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$procurementHours', '$totalDowntimeHours'] },
                    100,
                  ],
                },
                1,
              ],
            },
          },
          ops: {
            totalHours: { $round: ['$opsHours', 2] },
            averageHours: {
              $round: [{ $divide: ['$opsHours', '$totalEvents'] }, 2],
            },
            percentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$opsHours', '$totalDowntimeHours'] },
                    100,
                  ],
                },
                1,
              ],
            },
          },
        },
      },
    },
  ];

  const result = await this.aogEventModel.aggregate(pipeline);
  return result[0] || this.getEmptyAnalytics();
}
```

### Insight Generation Algorithm

```typescript
async generateInsights(filters: AnalyticsFilterDto): Promise<AutomatedInsight[]> {
  const insights: AutomatedInsight[] = [];
  
  // Get analytics data
  const bucketData = await this.getThreeBucketAnalytics(filters);
  const events = await this.findAll(filters);
  
  // Insight 1: High Procurement Time
  if (bucketData.buckets.procurement.percentage > 50) {
    insights.push({
      type: 'warning',
      title: 'Procurement Delays Detected',
      description: `Parts procurement accounts for ${bucketData.buckets.procurement.percentage}% of total downtime, significantly above the 30% target.`,
      metric: bucketData.buckets.procurement.percentage,
      recommendation: 'Review supplier contracts and consider increasing critical parts inventory.',
    });
  }
  
  // Insight 2: Recurring Issues
  const reasonCodeCounts = this.countByReasonCode(events);
  const recurringIssues = reasonCodeCounts.filter(rc => rc.count >= 3);
  
  if (recurringIssues.length > 0) {
    const topIssue = recurringIssues[0];
    insights.push({
      type: 'warning',
      title: `Recurring Issue: ${topIssue.reasonCode}`,
      description: `This issue has occurred ${topIssue.count} times in the selected period.`,
      metric: topIssue.count,
      recommendation: 'Consider root cause analysis and preventive maintenance.',
    });
  }
  
  // Insight 3: Cost Spike
  const currentMonthCost = this.getCurrentMonthCost(events);
  const avgCost = this.getAverageMonthlyCost(events);
  
  if (currentMonthCost > avgCost * 1.5) {
    const percentageIncrease = ((currentMonthCost - avgCost) / avgCost) * 100;
    insights.push({
      type: 'warning',
      title: 'Unusual Cost Increase',
      description: `AOG costs are ${percentageIncrease.toFixed(0)}% higher than the 3-month average.`,
      metric: percentageIncrease,
      recommendation: 'Review recent high-cost events and identify cost drivers.',
    });
  }
  
  // Insight 4: Improving Trend
  const previousPeriodDowntime = await this.getPreviousPeriodDowntime(filters);
  const currentDowntime = bucketData.summary.totalDowntimeHours;
  
  if (previousPeriodDowntime > 0) {
    const improvement = ((previousPeriodDowntime - currentDowntime) / previousPeriodDowntime) * 100;
    
    if (improvement > 20) {
      insights.push({
        type: 'success',
        title: 'Downtime Reduction Success',
        description: `Downtime decreased by ${improvement.toFixed(0)}% compared to the previous period.`,
        metric: improvement,
        recommendation: 'Document successful practices for replication across the fleet.',
      });
    }
  }
  
  // Insight 5: Data Quality Issue
  const dataQuality = this.calculateDataQuality(events);
  
  if (dataQuality.completenessPercentage < 70) {
    insights.push({
      type: 'info',
      title: 'Incomplete Data Detected',
      description: `${(100 - dataQuality.completenessPercentage).toFixed(0)}% of events lack milestone timestamps, limiting analytics accuracy.`,
      metric: dataQuality.completenessPercentage,
      recommendation: 'Update recent events with milestone data using the AOG Detail page.',
    });
  }
  
  // Return top 5 insights sorted by priority
  return insights
    .sort((a, b) => this.getInsightPriority(a) - this.getInsightPriority(b))
    .slice(0, 5);
}

private getInsightPriority(insight: AutomatedInsight): number {
  const priorities = { warning: 1, info: 2, success: 3 };
  return priorities[insight.type];
}
```

### Forecast Algorithm

```typescript
async generateForecast(filters: AnalyticsFilterDto, months: number = 3): Promise<ForecastData> {
  // Get last 12 months of historical data
  const historicalData = await this.getMonthlyTrend({
    ...filters,
    startDate: subMonths(new Date(), 12),
    endDate: new Date(),
  });
  
  if (historicalData.trends.length < 6) {
    throw new BadRequestException('Insufficient historical data for forecast (minimum 6 months required)');
  }
  
  // Simple linear regression
  const { slope, intercept } = this.calculateLinearRegression(
    historicalData.trends.map((t, i) => ({ x: i, y: t.totalDowntimeHours }))
  );
  
  // Generate forecast
  const forecast = [];
  const lastIndex = historicalData.trends.length - 1;
  
  for (let i = 1; i <= months; i++) {
    const predicted = slope * (lastIndex + i) + intercept;
    const confidenceInterval = predicted * 0.2; // ±20%
    
    forecast.push({
      month: format(addMonths(new Date(), i), 'yyyy-MM'),
      predicted: Math.max(0, predicted),
      confidenceInterval: {
        lower: Math.max(0, predicted - confidenceInterval),
        upper: predicted + confidenceInterval,
      },
    });
  }
  
  return {
    historical: historicalData.trends.map(t => ({
      month: t.month,
      actual: t.totalDowntimeHours,
    })),
    forecast,
    algorithm: 'linear_regression',
    confidence: 0.80,
  };
}

private calculateLinearRegression(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}
```



## Frontend Implementation

### Custom Hooks Pattern

```typescript
// hooks/useAOGEvents.ts

export function useThreeBucketAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-analytics', 'buckets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.aircraftId) params.append('aircraftId', filters.aircraftId);
      if (filters.fleetGroup) params.append('fleetGroup', filters.fleetGroup);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      
      const response = await fetch(`/api/aog-events/analytics/buckets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always enabled (Priority 1)
  });
}

export function useMonthlyTrend(filters: AnalyticsFilters) {
  const { data: bucketData } = useThreeBucketAnalytics(filters);
  
  return useQuery({
    queryKey: ['aog-analytics', 'monthly-trend', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.aircraftId) params.append('aircraftId', filters.aircraftId);
      if (filters.fleetGroup) params.append('fleetGroup', filters.fleetGroup);
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      
      const response = await fetch(`/api/aog-events/analytics/monthly-trend?${params}`);
      if (!response.ok) throw new Error('Failed to fetch monthly trend');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!bucketData, // Priority 2: Wait for bucket data
  });
}

export function useForecast(filters: AnalyticsFilters, months: number = 3) {
  const { data: trendData } = useMonthlyTrend(filters);
  
  return useQuery({
    queryKey: ['aog-analytics', 'forecast', filters, months],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.aircraftId) params.append('aircraftId', filters.aircraftId);
      if (filters.fleetGroup) params.append('fleetGroup', filters.fleetGroup);
      params.append('months', months.toString());
      
      const response = await fetch(`/api/aog-events/analytics/forecast?${params}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (less frequent updates)
    enabled: !!trendData && trendData.trends.length >= 6, // Priority 3: Requires trend data
  });
}
```

### Progressive Loading Strategy

```typescript
// AOGAnalyticsPage.tsx

export function AOGAnalyticsPage() {
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  
  // Priority 1: Critical data (loads immediately)
  const { data: bucketData, isLoading: bucketsLoading } = useThreeBucketAnalytics(filters);
  const { data: events, isLoading: eventsLoading } = useAOGEvents(filters);
  
  // Priority 2: Important visualizations (loads after Priority 1)
  const { data: trendData, isLoading: trendLoading } = useMonthlyTrend(filters);
  const { data: reliabilityData } = useAircraftReliability(filters);
  
  // Priority 3: Nice-to-have analytics (loads after Priority 2)
  const { data: forecastData } = useForecast(filters);
  const { data: insightsData } = useInsights(filters);
  
  return (
    <div className="space-y-8">
      {/* Priority 1: Always visible */}
      <SummaryCards data={bucketData} isLoading={bucketsLoading} />
      
      {/* Priority 2: Show skeleton while loading */}
      {trendLoading ? (
        <ChartSkeleton />
      ) : (
        <MonthlyTrendChart data={trendData} />
      )}
      
      {/* Priority 3: Show empty state if no data */}
      {forecastData ? (
        <ForecastChart data={forecastData} />
      ) : (
        <ChartEmptyState message="Forecast requires 6+ months of data" />
      )}
    </div>
  );
}
```

### Data Sampling Utility

```typescript
// lib/sampleData.ts

export function sampleData<T>(data: T[], maxPoints: number = 100): T[] {
  if (data.length <= maxPoints) {
    return data;
  }
  
  // Use systematic sampling to preserve distribution
  const step = data.length / maxPoints;
  const sampled: T[] = [];
  
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.floor(i * step);
    sampled.push(data[index]);
  }
  
  return sampled;
}

// Usage in component
const sampledData = useMemo(
  () => sampleData(rawData, 100),
  [rawData]
);
```

### Error Boundary Implementation

```typescript
// components/ui/AnalyticsSectionErrorBoundary.tsx

export class AnalyticsSectionErrorBoundary extends React.Component<
  { children: React.ReactNode; sectionName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.sectionName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">
            {this.props.sectionName} Error
          </h3>
          <p className="mt-2 text-sm text-red-700">
            Unable to load this section. Please try refreshing the page.
          </p>
          {this.state.error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-red-600">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-red-800">
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<AnalyticsSectionErrorBoundary sectionName="Trend Analysis">
  <MonthlyTrendChart data={trendData} />
</AnalyticsSectionErrorBoundary>
```

## Performance Optimization

### Backend Optimization

#### 1. MongoDB Indexing

```typescript
// aog-event.schema.ts

@Schema({ timestamps: true })
export class AOGEvent {
  // ... fields ...
}

// Indexes for analytics queries
AOGEventSchema.index({ detectedAt: -1 }); // Date range queries
AOGEventSchema.index({ aircraftId: 1, detectedAt: -1 }); // Aircraft filtering
AOGEventSchema.index({ 'aircraft.fleetGroup': 1, detectedAt: -1 }); // Fleet filtering
AOGEventSchema.index({ reportedAt: 1 }); // Milestone queries
AOGEventSchema.index({ responsibleParty: 1, detectedAt: -1 }); // Responsibility analytics
```

#### 2. Aggregation Pipeline Optimization

```typescript
// Optimization techniques:

// 1. Match early (reduce documents processed)
{ $match: { detectedAt: { $gte: startDate, $lte: endDate } } }

// 2. Project only needed fields
{ $project: { 
  technicalTimeHours: 1, 
  procurementTimeHours: 1, 
  opsTimeHours: 1 
} }

// 3. Use $lookup sparingly (expensive operation)
// Only lookup when aircraft details are needed

// 4. Limit results when possible
{ $limit: 1000 }

// 5. Use $facet for multiple aggregations in one query
{
  $facet: {
    summary: [{ $group: { ... } }],
    byAircraft: [{ $group: { ... } }],
    byMonth: [{ $group: { ... } }],
  }
}
```

#### 3. Caching Strategy

```typescript
// aog-events.module.ts

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // Maximum 100 cached items
    }),
  ],
  // ...
})
export class AOGEventsModule {}

// aog-events.controller.ts

@Controller('aog-events')
@UseInterceptors(CacheInterceptor)
export class AOGEventsController {
  @Get('analytics/buckets')
  @CacheKey('analytics-buckets')
  @CacheTTL(300)
  async getThreeBucketAnalytics(@Query() filters: AnalyticsFilterDto) {
    return this.aogEventsService.getThreeBucketAnalytics(filters);
  }
}
```

### Frontend Optimization

#### 1. Memoization

```typescript
// Memoize expensive calculations
const reliabilityScores = useMemo(() => {
  return aircraft.map(a => ({
    ...a,
    score: calculateReliabilityScore(a.eventCount, a.totalDowntimeHours),
  }));
}, [aircraft]);

// Memoize data transformations
const chartData = useMemo(() => {
  return transformDataForChart(rawData);
}, [rawData]);

// Memoize sampled data
const sampledData = useMemo(() => {
  return sampleData(largeDataset, 100);
}, [largeDataset]);
```

#### 2. Code Splitting

```typescript
// Lazy load heavy components
const ForecastChart = lazy(() => import('./components/ui/ForecastChart'));
const AircraftHeatmap = lazy(() => import('./components/ui/AircraftHeatmap'));

// Usage with Suspense
<Suspense fallback={<ChartSkeleton />}>
  <ForecastChart data={forecastData} />
</Suspense>
```

#### 3. Virtualization for Large Lists

```typescript
// Use react-window for large datasets
import { FixedSizeList } from 'react-window';

function AircraftList({ aircraft }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {aircraft[index].registration}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={aircraft.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

#### 4. Debouncing Filter Changes

```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function Filters() {
  const [filters, setFilters] = useState({});
  const debouncedFilters = useDebouncedValue(filters, 300); // 300ms delay
  
  // Use debounced filters for API calls
  const { data } = useThreeBucketAnalytics(debouncedFilters);
}
```

## Adding New Visualizations

### Step-by-Step Guide

#### 1. Define Data Interface

```typescript
// types/index.ts

export interface NewVisualizationData {
  labels: string[];
  values: number[];
  metadata?: Record<string, any>;
}
```

#### 2. Create Backend Endpoint

```typescript
// aog-events.controller.ts

@Get('analytics/new-visualization')
async getNewVisualization(@Query() filters: AnalyticsFilterDto) {
  return this.aogEventsService.getNewVisualizationData(filters);
}

// aog-events.service.ts

async getNewVisualizationData(filters: AnalyticsFilterDto): Promise<NewVisualizationData> {
  const pipeline = [
    // Your aggregation pipeline
  ];
  
  const result = await this.aogEventModel.aggregate(pipeline);
  
  return {
    labels: result.map(r => r.label),
    values: result.map(r => r.value),
  };
}
```

#### 3. Create Custom Hook

```typescript
// hooks/useAOGEvents.ts

export function useNewVisualization(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-analytics', 'new-visualization', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Add filter params
      
      const response = await fetch(`/api/aog-events/analytics/new-visualization?${params}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

#### 4. Create Chart Component

```typescript
// components/ui/NewVisualizationChart.tsx

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface NewVisualizationChartProps {
  data: NewVisualizationData;
  isLoading?: boolean;
}

export function NewVisualizationChart({ data, isLoading }: NewVisualizationChartProps) {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.values.length === 0) {
    return <ChartEmptyState message="No data available" />;
  }

  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

#### 5. Add to Analytics Page

```typescript
// pages/aog/AOGAnalyticsPage.tsx

export function AOGAnalyticsPage() {
  const { data: newVizData, isLoading } = useNewVisualization(filters);

  return (
    <div className="space-y-8">
      {/* Existing sections */}
      
      {/* New Section */}
      <AnalyticsSectionErrorBoundary sectionName="New Visualization">
        <div id="new-visualization-section" className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">New Visualization</h2>
          <NewVisualizationChart data={newVizData} isLoading={isLoading} />
        </div>
      </AnalyticsSectionErrorBoundary>
    </div>
  );
}
```

#### 6. Add to PDF Export

```typescript
// components/ui/EnhancedAOGAnalyticsPDFExport.tsx

const sections = [
  // Existing sections
  { id: 'new-visualization-section', title: 'New Visualization' },
];
```

### Chart Component Template

```typescript
import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { ChartSkeleton } from './ChartSkeleton';
import { ChartEmptyState } from './ChartEmptyState';

interface TemplateChartProps {
  data: any[];
  isLoading?: boolean;
  height?: number;
}

export function TemplateChart({ data, isLoading, height = 400 }: TemplateChartProps) {
  // Loading state
  if (isLoading) {
    return <ChartSkeleton height={height} />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <ChartEmptyState message="No data available for this period" />;
  }

  // Data transformation
  const chartData = React.useMemo(() => {
    // Transform data for chart
    return data;
  }, [data]);

  // Render chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      {/* Your Recharts component */}
    </ResponsiveContainer>
  );
}
```



## Testing Strategy

### Unit Tests

```typescript
// lib/reliabilityScore.test.ts

describe('calculateReliabilityScore', () => {
  it('should return 100 for aircraft with no events', () => {
    const score = calculateReliabilityScore(0, 0);
    expect(score).toBe(100);
  });

  it('should decrease score based on event count', () => {
    const score = calculateReliabilityScore(5, 0);
    expect(score).toBe(75); // 100 - (5 * 5)
  });

  it('should decrease score based on downtime hours', () => {
    const score = calculateReliabilityScore(0, 100);
    expect(score).toBe(90); // 100 - (100 / 10)
  });

  it('should not go below 0', () => {
    const score = calculateReliabilityScore(50, 1000);
    expect(score).toBe(0);
  });
});
```

### Component Tests

```typescript
// components/ui/MonthlyTrendChart.test.tsx

import { render, screen } from '@testing-library/react';
import { MonthlyTrendChart } from './MonthlyTrendChart';

describe('MonthlyTrendChart', () => {
  const mockData = {
    trends: [
      { month: '2025-01', eventCount: 10, totalDowntimeHours: 234 },
      { month: '2025-02', eventCount: 8, totalDowntimeHours: 189 },
    ],
  };

  it('should render loading skeleton when loading', () => {
    render(<MonthlyTrendChart data={null} isLoading={true} />);
    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<MonthlyTrendChart data={{ trends: [] }} isLoading={false} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('should render chart with data', () => {
    render(<MonthlyTrendChart data={mockData} isLoading={false} />);
    expect(screen.getByRole('img')).toBeInTheDocument(); // Recharts renders as SVG
  });
});
```

### Integration Tests

```typescript
// e2e/aog-analytics.spec.ts

describe('AOG Analytics Page', () => {
  beforeEach(() => {
    cy.login('admin@alphastarav.com', 'Admin@123!');
    cy.visit('/aog/analytics');
  });

  it('should load and display analytics', () => {
    // Wait for data to load
    cy.get('[data-testid="summary-cards"]').should('be.visible');
    
    // Verify sections are present
    cy.get('#three-bucket-section').should('be.visible');
    cy.get('#trend-analysis-section').should('be.visible');
    cy.get('#aircraft-performance-section').should('be.visible');
  });

  it('should filter data by date range', () => {
    // Open date picker
    cy.get('[data-testid="date-range-picker"]').click();
    
    // Select last 30 days
    cy.get('[data-testid="preset-30-days"]').click();
    
    // Verify charts update
    cy.get('[data-testid="total-events"]').should('not.contain', '0');
  });

  it('should export PDF successfully', () => {
    // Click export button
    cy.get('[data-testid="export-pdf-button"]').click();
    
    // Wait for generation
    cy.get('[data-testid="pdf-generating"]', { timeout: 20000 }).should('not.exist');
    
    // Verify download
    cy.readFile('cypress/downloads/aog-analytics-report.pdf').should('exist');
  });
});
```

## Deployment

### Build Process

```bash
# Backend
cd backend
npm run build
npm run test

# Frontend
cd frontend
npm run build
npm run test

# Docker
docker-compose build
docker-compose up -d
```

### Environment Variables

```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/alphastar
JWT_SECRET=your-secret-key
AWS_S3_BUCKET=alphastar-attachments
NODE_ENV=production

# Frontend (.env.production)
VITE_API_URL=https://api.alphastarav.com
VITE_ENV=production
```

### Performance Monitoring

```typescript
// Add performance marks
performance.mark('analytics-page-start');

// ... page load logic ...

performance.mark('analytics-page-end');
performance.measure('analytics-page-load', 'analytics-page-start', 'analytics-page-end');

const measure = performance.getEntriesByName('analytics-page-load')[0];
console.log(`Page load time: ${measure.duration}ms`);

// Send to analytics service
if (measure.duration > 3000) {
  console.warn('Page load exceeded 3 second target');
}
```

## Troubleshooting

### Common Issues

#### 1. Charts Not Rendering

**Symptom**: Blank space where chart should be

**Causes**:
- Data format mismatch
- Missing required fields
- Recharts version incompatibility

**Solution**:
```typescript
// Add console logging
console.log('Chart data:', data);

// Verify data structure
if (!data || !Array.isArray(data)) {
  console.error('Invalid data format');
  return <ChartEmptyState />;
}

// Check Recharts version
npm list recharts
```

#### 2. Slow Query Performance

**Symptom**: Analytics endpoints taking > 2 seconds

**Causes**:
- Missing indexes
- Large dataset without pagination
- Inefficient aggregation pipeline

**Solution**:
```typescript
// Add query explain
const explain = await this.aogEventModel
  .aggregate(pipeline)
  .explain('executionStats');

console.log('Query execution time:', explain.executionStats.executionTimeMillis);

// Add indexes
await this.aogEventModel.collection.createIndex({ detectedAt: -1 });

// Limit results
pipeline.push({ $limit: 1000 });
```

#### 3. PDF Export Fails

**Symptom**: PDF generation throws error or produces blank PDF

**Causes**:
- Charts not fully rendered
- Memory limit exceeded
- html2canvas compatibility issue

**Solution**:
```typescript
// Increase wait time
await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

// Reduce scale for memory
const canvas = await html2canvas(element, {
  scale: 1, // Reduce from 2
  logging: true, // Enable logging
});

// Check canvas size
console.log('Canvas size:', canvas.width, canvas.height);

// Split large sections
if (canvas.height > 10000) {
  // Split into multiple pages
}
```

#### 4. Cache Not Invalidating

**Symptom**: Stale data after creating/updating events

**Causes**:
- Cache key mismatch
- Invalidation not triggered
- TTL too long

**Solution**:
```typescript
// Verify cache key
console.log('Cache key:', queryKey);

// Force invalidation
queryClient.invalidateQueries(['aog-analytics']);

// Clear all cache
queryClient.clear();

// Reduce TTL for testing
staleTime: 0, // No caching during development
```

#### 5. Memory Leaks

**Symptom**: Browser tab becomes slow over time

**Causes**:
- Event listeners not cleaned up
- Large datasets not released
- Recharts instances not destroyed

**Solution**:
```typescript
// Clean up in useEffect
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  
  return () => {
    window.removeEventListener('resize', handler);
  };
}, []);

// Memoize large datasets
const data = useMemo(() => largeDataset, [largeDataset]);

// Use React.memo for expensive components
export const ExpensiveChart = React.memo(({ data }) => {
  // ...
});
```

## Best Practices

### Code Organization

```
frontend/src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── charts/      # Chart components
│   │   ├── loading/     # Loading states
│   │   └── errors/      # Error states
│   └── aog/             # AOG-specific components
├── hooks/               # Custom hooks
│   └── useAOGEvents.ts
├── lib/                 # Utility functions
│   ├── api.ts
│   ├── sampleData.ts
│   └── calculations/    # Business logic
├── pages/               # Page components
│   └── aog/
│       └── AOGAnalyticsPage.tsx
└── types/               # TypeScript types
    └── index.ts
```

### Naming Conventions

- **Components**: PascalCase (`MonthlyTrendChart.tsx`)
- **Hooks**: camelCase with `use` prefix (`useMonthlyTrend`)
- **Utilities**: camelCase (`calculateReliabilityScore`)
- **Types**: PascalCase (`MonthlyTrendData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DATA_POINTS`)

### Documentation

```typescript
/**
 * Calculates the reliability score for an aircraft based on event count and downtime.
 * 
 * @param eventCount - Number of AOG events
 * @param totalDowntimeHours - Total hours of downtime
 * @returns Reliability score (0-100, higher is better)
 * 
 * @example
 * const score = calculateReliabilityScore(5, 120);
 * // Returns: 63 (100 - 5*5 - 120/10)
 */
export function calculateReliabilityScore(
  eventCount: number,
  totalDowntimeHours: number
): number {
  const penalty = (eventCount * 5) + (totalDowntimeHours / 10);
  return Math.max(0, Math.min(100, 100 - penalty));
}
```

### Error Handling

```typescript
// Always handle errors gracefully
try {
  const data = await fetchAnalytics();
  return data;
} catch (error) {
  console.error('Failed to fetch analytics:', error);
  
  // Show user-friendly message
  toast.error('Unable to load analytics. Please try again.');
  
  // Return fallback data
  return getEmptyAnalytics();
}
```

### Accessibility

```typescript
// Add ARIA labels
<button aria-label="Export analytics to PDF">
  Export PDF
</button>

// Add alt text to charts
<ResponsiveContainer role="img" aria-label="Monthly trend chart showing event count and downtime">
  {/* Chart */}
</ResponsiveContainer>

// Ensure keyboard navigation
<div tabIndex={0} onKeyPress={handleKeyPress}>
  {/* Interactive element */}
</div>
```

## Resources

### Documentation
- [Recharts Documentation](https://recharts.org/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)

### Tools
- [MongoDB Compass](https://www.mongodb.com/products/compass) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - React debugging
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/) - Performance profiling

### Internal Resources
- System Architecture Documentation
- AOG Analytics API Documentation
- AOG Analytics User Guide
- Code Review Guidelines

---

**Last Updated**: February 3, 2025  
**Version**: 1.0  
**Maintainer**: Development Team  
**Contact**: dev@alphastarav.com
