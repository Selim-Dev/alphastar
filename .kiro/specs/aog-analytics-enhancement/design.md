# AOG Analytics Page Enhancement - Design Document

## 1. Overview

### 1.1 Purpose
Transform the AOG Analytics page from a basic two-chart display into a comprehensive, visually stunning analytics dashboard that provides deep insights into aircraft downtime patterns, cost impacts, and predictive intelligence.

### 1.2 Design Philosophy
- **Data-First**: Handle legacy data gracefully without compromising user experience
- **Visual Impact**: Use professional visualizations that communicate insights instantly
- **Performance**: Maintain sub-3-second load times even with 1000+ events
- **Modularity**: Build reusable chart components for future enhancements
- **Reliability**: Ensure PDF export works 100% of the time

### 1.3 Key Challenges
1. **Legacy Data**: Historical events lack milestone timestamps (reportedAt, procurementRequestedAt, etc.)
2. **PDF Export**: Current implementation fails due to container ID mismatch and rendering issues
3. **Limited Visualizations**: Only 2 charts exist; need 10+ stunning visualizations
4. **No Insights**: System doesn't provide automated insights or predictions
5. **Performance**: Must handle large datasets efficiently

## 2. Architecture

### 2.1 Component Structure

```
AOGAnalyticsPage (Enhanced)
├── Filters Section
│   ├── DateRangeSelector
│   ├── AircraftFilter
│   └── FleetGroupFilter
├── Data Quality Indicator (NEW)
├── Summary Cards (Enhanced)
├── Three-Bucket Section
│   ├── BucketSummaryCards
│   ├── ThreeBucketBarChart
│   ├── ThreeBucketPieChart
│   ├── BucketTrendChart (NEW)
│   └── WaterfallChart (NEW)
├── Trend Analysis Section (NEW)
│   ├── MonthlyTrendChart
│   ├── MovingAverageChart
│   └── YearOverYearComparison
├── Aircraft Performance Section (NEW)
│   ├── AircraftHeatmap
│   ├── ReliabilityScoreCards
│   └── TopPerformersTable
├── Root Cause Section (NEW)
│   ├── ParetoChart
│   ├── CategoryBreakdownPie
│   └── ResponsibilityDistribution
├── Cost Analysis Section (NEW)
│   ├── CostBreakdownChart
│   ├── CostPerHourMetric
│   └── CostTrendLine
├── Predictive Analytics Section (NEW)
│   ├── ForecastChart
│   ├── RiskScoreGauge
│   └── InsightsPanel
└── PDF Export (Fixed)
    └── EnhancedPDFExport
```


### 2.2 Data Flow

```
User Interaction
    ↓
Filter State Update
    ↓
TanStack Query (useAOGEvents, useThreeBucketAnalytics, etc.)
    ↓
Backend API Endpoints
    ↓
MongoDB Aggregation Pipelines
    ↓
Processed Data with Legacy Handling
    ↓
Chart Components (Recharts)
    ↓
Visual Display
```

### 2.3 Backend API Endpoints

**Existing Endpoints:**
- `GET /api/aog-events/analytics/buckets` - Three-bucket analytics
- `GET /api/aog-events` - List events with filters

**New Endpoints Required:**
- `GET /api/aog-events/analytics/monthly-trend` - Monthly event count and downtime
- `GET /api/aog-events/analytics/category-breakdown` - Events by category
- `GET /api/aog-events/analytics/location-heatmap` - Events by location
- `GET /api/aog-events/analytics/duration-distribution` - Events by duration range
- `GET /api/aog-events/analytics/aircraft-reliability` - Aircraft ranking
- `GET /api/aog-events/analytics/insights` - Auto-generated insights
- `GET /api/aog-events/analytics/forecast` - Predictive analytics

### 2.4 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | Component framework |
| Charts | Recharts | Data visualization |
| PDF | jsPDF + html2canvas | PDF generation |
| State | TanStack Query v5 | Server state management |
| Backend | NestJS | API framework |
| Database | MongoDB | Data storage |
| Aggregation | MongoDB Aggregation Pipeline | Analytics computation |


## 3. Data Models & Interfaces

### 3.1 Frontend Interfaces

```typescript
// Data Quality Metrics
interface DataQualityMetrics {
  totalEvents: number;
  eventsWithMilestones: number;
  completenessPercentage: number;
  legacyEventCount: number;
}

// Monthly Trend Data
interface MonthlyTrendData {
  month: string; // YYYY-MM format
  eventCount: number;
  totalDowntimeHours: number;
  averageDowntimeHours: number;
  movingAverage?: number; // 3-month moving average
}

// Aircraft Reliability Score
interface AircraftReliability {
  aircraftId: string;
  registration: string;
  eventCount: number;
  totalDowntimeHours: number;
  reliabilityScore: number; // 0-100, higher is better
  trend: 'improving' | 'stable' | 'declining';
}

// Category Breakdown
interface CategoryBreakdown {
  category: 'aog' | 'unscheduled' | 'scheduled';
  count: number;
  percentage: number;
  totalHours: number;
}

// Location Heatmap Data
interface LocationHeatmap {
  location: string;
  count: number;
  percentage: number;
}

// Duration Distribution
interface DurationDistribution {
  range: '< 24 hours' | '1-7 days' | '1-4 weeks' | '> 1 month';
  count: number;
  percentage: number;
}

// Cost Analysis
interface CostAnalysis {
  totalInternalCost: number;
  totalExternalCost: number;
  totalCost: number;
  costPerHour: number;
  costPerEvent: number;
  costTrend: Array<{
    month: string;
    cost: number;
  }>;
}

// Forecast Data
interface ForecastData {
  historical: Array<{
    month: string;
    actual: number;
  }>;
  forecast: Array<{
    month: string;
    predicted: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
}

// Automated Insights
interface AutomatedInsight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  metric?: number;
  recommendation?: string;
}
```


### 3.2 Backend DTOs

```typescript
// Analytics Filter DTO
export class AnalyticsFilterDto {
  @IsOptional()
  @IsString()
  aircraftId?: string;

  @IsOptional()
  @IsString()
  fleetGroup?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// Monthly Trend Response DTO
export interface MonthlyTrendResponseDto {
  trends: Array<{
    month: string;
    eventCount: number;
    totalDowntimeHours: number;
    averageDowntimeHours: number;
  }>;
  movingAverage: Array<{
    month: string;
    value: number;
  }>;
}

// Insights Response DTO
export interface InsightsResponseDto {
  insights: Array<{
    type: 'warning' | 'info' | 'success';
    title: string;
    description: string;
    metric?: number;
    recommendation?: string;
  }>;
  dataQuality: {
    completenessPercentage: number;
    legacyEventCount: number;
    totalEvents: number;
  };
}
```

## 4. Components and Interfaces

### 4.1 Data Quality Indicator Component

**Purpose**: Display data completeness score and legacy event count

**Component**: `DataQualityIndicator.tsx`

```typescript
interface DataQualityIndicatorProps {
  totalEvents: number;
  eventsWithMilestones: number;
  legacyEventCount: number;
}

// Visual Design:
// - Badge showing completeness percentage (0-100%)
// - Color coding: Green (>80%), Amber (50-80%), Red (<50%)
// - Tooltip explaining what "complete" means
// - Link to documentation on milestone timestamps
```

**Calculation Logic**:
```typescript
completenessPercentage = (eventsWithMilestones / totalEvents) * 100

// Event is "complete" if it has:
// - reportedAt (or detectedAt as fallback)
// - installationCompleteAt
// - upAndRunningAt (or clearedAt as fallback)
```


### 4.2 Enhanced Three-Bucket Visualizations

#### 4.2.1 Bucket Trend Chart (NEW)

**Component**: `BucketTrendChart.tsx`

**Purpose**: Show how technical, procurement, and ops time change over months

**Chart Type**: Stacked Area Chart (Recharts)

```typescript
interface BucketTrendChartProps {
  data: Array<{
    month: string;
    technicalHours: number;
    procurementHours: number;
    opsHours: number;
  }>;
  isLoading?: boolean;
}

// Visual Design:
// - X-axis: Months (last 12 months)
// - Y-axis: Hours
// - Three stacked areas with colors:
//   - Technical: #3b82f6 (blue)
//   - Procurement: #f59e0b (amber)
//   - Ops: #10b981 (green)
// - Smooth curves for better aesthetics
// - Tooltip showing breakdown on hover
```

#### 4.2.2 Waterfall Chart (NEW)

**Component**: `WaterfallChart.tsx`

**Purpose**: Show downtime composition breakdown

**Chart Type**: Custom Waterfall Chart (Recharts Bar Chart)

```typescript
interface WaterfallChartProps {
  technicalHours: number;
  procurementHours: number;
  opsHours: number;
  totalHours: number;
}

// Visual Design:
// - Start bar: "Start" at 0
// - Floating bars for each bucket showing contribution
// - End bar: "Total Downtime"
// - Color coding matches bucket colors
// - Connecting lines between bars
```

### 4.3 Trend Analysis Components

#### 4.3.1 Monthly Trend Chart

**Component**: `MonthlyTrendChart.tsx`

**Purpose**: Display event count and downtime over 12 months

**Chart Type**: Combo Chart (Line + Bar)

```typescript
interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
  isLoading?: boolean;
}

// Visual Design:
// - Bars: Event count (blue)
// - Line: Total downtime hours (red)
// - X-axis: Months
// - Dual Y-axes (count on left, hours on right)
// - Grid lines for readability
```

#### 4.3.2 Moving Average Chart

**Component**: `MovingAverageChart.tsx`

**Purpose**: Smooth volatility with 3-month moving average

**Chart Type**: Line Chart with two lines

```typescript
interface MovingAverageChartProps {
  data: Array<{
    month: string;
    actual: number;
    movingAverage: number;
  }>;
}

// Visual Design:
// - Solid line: Actual downtime (blue)
// - Dashed line: 3-month moving average (gray)
// - Shaded area between lines showing variance
```

#### 4.3.3 Year-over-Year Comparison

**Component**: `YearOverYearChart.tsx`

**Purpose**: Compare current year vs previous year

**Chart Type**: Grouped Bar Chart

```typescript
interface YearOverYearChartProps {
  currentYear: Array<{
    month: string;
    value: number;
  }>;
  previousYear: Array<{
    month: string;
    value: number;
  }>;
}

// Visual Design:
// - Grouped bars for each month
// - Current year: Blue
// - Previous year: Gray
// - Delta indicators showing improvement/decline
```


### 4.4 Aircraft Performance Components

#### 4.4.1 Aircraft Heatmap

**Component**: `AircraftHeatmap.tsx`

**Purpose**: Show downtime intensity per aircraft per month

**Chart Type**: Custom Heatmap (Grid of colored cells)

```typescript
interface AircraftHeatmapProps {
  data: Array<{
    aircraftId: string;
    registration: string;
    monthlyData: Array<{
      month: string;
      downtimeHours: number;
    }>;
  }>;
}

// Visual Design:
// - Rows: Aircraft registrations
// - Columns: Months (last 12 months)
// - Cell color intensity based on downtime hours:
//   - 0 hours: Light green (#dcfce7)
//   - 1-24 hours: Yellow (#fef3c7)
//   - 25-100 hours: Orange (#fed7aa)
//   - >100 hours: Red (#fecaca)
// - Tooltip showing exact hours on hover
// - Click cell to drill down to specific aircraft/month
```

#### 4.4.2 Reliability Score Cards

**Component**: `ReliabilityScoreCards.tsx`

**Purpose**: Display top 5 reliable and top 5 problem aircraft

**Visual Design**:
```typescript
interface ReliabilityScoreCardsProps {
  mostReliable: AircraftReliability[];
  needsAttention: AircraftReliability[];
}

// Layout:
// - Two columns: "Most Reliable" (left) and "Needs Attention" (right)
// - Each card shows:
//   - Aircraft registration (large, bold)
//   - Reliability score (0-100) with color gauge
//   - Event count
//   - Total downtime hours
//   - Trend indicator (↑ improving, → stable, ↓ declining)
// - Color coding:
//   - Most Reliable: Green border
//   - Needs Attention: Red border
```

**Reliability Score Calculation**:
```typescript
// Score based on inverse of downtime and event frequency
// Higher score = more reliable
reliabilityScore = 100 - min(100, (eventCount * 5) + (totalDowntimeHours / 10))

// Trend calculation (compare to previous period):
// - Improving: Score increased by >5 points
// - Declining: Score decreased by >5 points
// - Stable: Score changed by ≤5 points
```

### 4.5 Root Cause Analysis Components

#### 4.5.1 Pareto Chart

**Component**: `ParetoChart.tsx`

**Purpose**: Show top 10 reason codes by frequency and cumulative impact

**Chart Type**: Combo Chart (Bar + Line)

```typescript
interface ParetoChartProps {
  data: Array<{
    reasonCode: string;
    count: number;
    percentage: number;
    cumulativePercentage: number;
  }>;
}

// Visual Design:
// - Bars: Event count per reason code (blue)
// - Line: Cumulative percentage (red)
// - X-axis: Reason codes (sorted by count descending)
// - Left Y-axis: Count
// - Right Y-axis: Cumulative percentage (0-100%)
// - 80% line marker (Pareto principle)
```

#### 4.5.2 Category Breakdown Pie

**Component**: `CategoryBreakdownPie.tsx`

**Purpose**: Show distribution of AOG vs Unscheduled vs Scheduled

**Chart Type**: Pie Chart with labels

```typescript
interface CategoryBreakdownPieProps {
  data: CategoryBreakdown[];
}

// Visual Design:
// - Three segments:
//   - AOG: Red (#ef4444)
//   - Unscheduled: Amber (#f59e0b)
//   - Scheduled: Blue (#3b82f6)
// - Percentage labels on segments
// - Legend showing count and total hours
```

#### 4.5.3 Responsibility Distribution

**Component**: `ResponsibilityDistributionChart.tsx`

**Purpose**: Show downtime by responsible party

**Chart Type**: Horizontal Bar Chart

```typescript
interface ResponsibilityDistributionProps {
  data: Array<{
    responsibleParty: 'Internal' | 'OEM' | 'Customs' | 'Finance' | 'Other';
    totalHours: number;
    eventCount: number;
    percentage: number;
  }>;
}

// Visual Design:
// - Bars sorted by total hours descending
// - Color coding matches existing system:
//   - Internal: #3b82f6 (blue)
//   - OEM: #ef4444 (red)
//   - Customs: #f59e0b (amber)
//   - Finance: #10b981 (green)
//   - Other: #8b5cf6 (purple)
// - Labels showing hours and percentage
```


### 4.6 Cost Analysis Components

#### 4.6.1 Cost Breakdown Chart

**Component**: `CostBreakdownChart.tsx`

**Purpose**: Show internal vs external costs with trend

**Chart Type**: Stacked Bar Chart with trend line

```typescript
interface CostBreakdownChartProps {
  data: Array<{
    month: string;
    internalCost: number;
    externalCost: number;
    totalCost: number;
  }>;
}

// Visual Design:
// - Stacked bars: Internal (blue) + External (amber)
// - Trend line: Total cost (red dashed)
// - X-axis: Months
// - Y-axis: Cost in USD
// - Tooltip showing breakdown
```

#### 4.6.2 Cost Efficiency Metrics

**Component**: `CostEfficiencyMetrics.tsx`

**Purpose**: Display cost per hour and cost per event

```typescript
interface CostEfficiencyMetricsProps {
  costPerHour: number;
  costPerEvent: number;
  totalCost: number;
  periodComparison?: {
    costPerHourDelta: number;
    costPerEventDelta: number;
  };
}

// Visual Design:
// - Two large metric cards side by side
// - Cost per Hour: Primary metric with delta indicator
// - Cost per Event: Secondary metric with delta indicator
// - Color coding: Green (decreased), Red (increased)
// - Sparkline showing last 6 months trend
```

### 4.7 Predictive Analytics Components

#### 4.7.1 Forecast Chart

**Component**: `ForecastChart.tsx`

**Purpose**: Show 3-month downtime forecast using linear regression

**Chart Type**: Line Chart with confidence interval

```typescript
interface ForecastChartProps {
  historical: Array<{
    month: string;
    actual: number;
  }>;
  forecast: Array<{
    month: string;
    predicted: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
}

// Visual Design:
// - Solid line: Historical actual (blue)
// - Dashed line: Forecast (red)
// - Shaded area: Confidence interval (light red)
// - Vertical line separating historical from forecast
// - Label: "Forecast" on right side
```

**Forecast Algorithm**:
```typescript
// Simple linear regression on last 12 months
// y = mx + b
// where:
//   y = predicted downtime hours
//   x = month index
//   m = slope (trend)
//   b = intercept

// Confidence interval: ±20% of predicted value
```

#### 4.7.2 Risk Score Gauge

**Component**: `RiskScoreGauge.tsx`

**Purpose**: Display aircraft-level risk assessment

**Chart Type**: Radial Gauge

```typescript
interface RiskScoreGaugeProps {
  aircraftId: string;
  registration: string;
  riskScore: number; // 0-100, higher = higher risk
  factors: Array<{
    name: string;
    contribution: number; // percentage
  }>;
}

// Visual Design:
// - Circular gauge showing 0-100 scale
// - Color zones:
//   - 0-30: Green (Low Risk)
//   - 31-60: Amber (Medium Risk)
//   - 61-100: Red (High Risk)
// - Needle pointing to current score
// - List of risk factors below gauge
```

**Risk Score Calculation**:
```typescript
riskScore = (
  (recentEventFrequency * 0.4) +
  (averageDowntimeTrend * 0.3) +
  (costTrend * 0.2) +
  (recurringIssues * 0.1)
) * 100

// Factors:
// - recentEventFrequency: Events in last 30 days vs average
// - averageDowntimeTrend: Increasing/decreasing trend
// - costTrend: Cost increasing/decreasing
// - recurringIssues: Same reason code appearing multiple times
```


#### 4.7.3 Insights Panel

**Component**: `InsightsPanel.tsx`

**Purpose**: Display auto-generated insights and recommendations

```typescript
interface InsightsPanelProps {
  insights: AutomatedInsight[];
  isLoading?: boolean;
}

// Visual Design:
// - Card-based layout
// - Each insight card shows:
//   - Icon (⚠️ warning, ℹ️ info, ✓ success)
//   - Title (bold)
//   - Description (2-3 sentences)
//   - Metric (if applicable)
//   - Recommendation (actionable)
// - Color coding by type:
//   - Warning: Red border
//   - Info: Blue border
//   - Success: Green border
// - Maximum 5 insights displayed
// - "View All Insights" link if more available
```

**Insight Generation Logic**:
```typescript
// Backend generates insights based on patterns:

1. High Procurement Time
   - Trigger: Procurement time > 50% of total downtime
   - Title: "Procurement Delays Detected"
   - Description: "Parts procurement accounts for X% of downtime"
   - Recommendation: "Review supplier contracts and inventory levels"

2. Recurring Issues
   - Trigger: Same reason code appears 3+ times in 30 days
   - Title: "Recurring Issue: [Reason Code]"
   - Description: "This issue has occurred X times recently"
   - Recommendation: "Consider root cause analysis and preventive maintenance"

3. Cost Spike
   - Trigger: Current month cost > 150% of 3-month average
   - Title: "Unusual Cost Increase"
   - Description: "AOG costs are X% higher than average"
   - Recommendation: "Review recent high-cost events"

4. Improving Trend
   - Trigger: Downtime decreased by >20% vs previous period
   - Title: "Downtime Reduction Success"
   - Description: "Downtime decreased by X% this period"
   - Recommendation: "Document successful practices for replication"

5. Data Quality Issue
   - Trigger: >30% of events are legacy (no milestones)
   - Title: "Incomplete Data Detected"
   - Description: "X% of events lack milestone timestamps"
   - Recommendation: "Update recent events with milestone data"

6. Aircraft at Risk
   - Trigger: Aircraft risk score > 70
   - Title: "High-Risk Aircraft: [Registration]"
   - Description: "Aircraft shows increasing downtime trend"
   - Recommendation: "Schedule preventive maintenance review"

7. Seasonal Pattern
   - Trigger: Consistent pattern across years
   - Title: "Seasonal Pattern Detected"
   - Description: "AOG events increase during [months]"
   - Recommendation: "Plan additional resources for peak periods"

8. Bottleneck Identified
   - Trigger: One bucket consistently >60% of total time
   - Title: "[Bucket] Bottleneck"
   - Description: "[Bucket] time accounts for X% of downtime"
   - Recommendation: "Focus improvement efforts on [specific area]"
```


## 5. PDF Export Enhancement

### 5.1 Current Issues

1. **Container ID Mismatch**: Code references `analytics-content` but page uses `aog-analytics-content`
2. **Rendering Failures**: Charts don't render properly in PDF
3. **Single Page Only**: Long content gets cut off
4. **No Professional Formatting**: Missing cover page, headers, footers

### 5.2 Enhanced PDF Export Design

**Component**: `EnhancedAOGAnalyticsPDFExport.tsx`

```typescript
interface EnhancedPDFExportProps {
  containerId: string;
  filename: string;
  filters: {
    dateRange: { startDate?: string; endDate?: string };
    aircraftFilter?: string;
    fleetFilter?: string;
  };
  summary: {
    totalEvents: number;
    activeEvents: number;
    totalDowntimeHours: number;
    averageDowntimeHours: number;
  };
  onSuccess?: () => void;
}
```

### 5.3 PDF Generation Strategy

**Multi-Page PDF with Sections**:

```typescript
// Page 1: Cover Page
{
  title: "AOG Analytics Report",
  subtitle: "Alpha Star Aviation",
  dateRange: "January 1, 2025 - January 31, 2025",
  generatedAt: "February 1, 2025 10:30 AM",
  filters: "Fleet: A340, Aircraft: All",
  logo: "[Company Logo]"
}

// Page 2: Executive Summary
{
  keyMetrics: [
    "Total Events: 45",
    "Active AOG: 3",
    "Total Downtime: 1,234 hours",
    "Average Downtime: 27.4 hours"
  ],
  topInsights: [
    "Procurement delays account for 45% of downtime",
    "Aircraft HZ-A42 requires attention (15 events)",
    "Downtime decreased 12% vs previous period"
  ]
}

// Page 3-4: Three-Bucket Analysis
{
  charts: [
    "Bucket Summary Cards",
    "Bar Chart",
    "Pie Chart",
    "Trend Chart"
  ],
  table: "Per-Aircraft Breakdown"
}

// Page 5-6: Trend Analysis
{
  charts: [
    "Monthly Trend",
    "Moving Average",
    "Year-over-Year Comparison"
  ]
}

// Page 7-8: Aircraft Performance
{
  charts: [
    "Aircraft Heatmap",
    "Reliability Score Cards"
  ],
  tables: [
    "Top 5 Most Reliable",
    "Top 5 Needs Attention"
  ]
}

// Page 9-10: Root Cause & Cost Analysis
{
  charts: [
    "Pareto Chart",
    "Category Breakdown",
    "Responsibility Distribution",
    "Cost Breakdown",
    "Cost Efficiency Metrics"
  ]
}

// Page 11: Predictive Analytics & Insights
{
  charts: [
    "Forecast Chart",
    "Risk Score Gauges (top 3 aircraft)"
  ],
  insights: "Top 5 automated insights"
}

// Footer on all pages:
{
  pageNumber: "Page X of Y",
  confidentiality: "Confidential - Alpha Star Aviation",
  generatedBy: "AOG Analytics System"
}
```


### 5.4 PDF Generation Implementation

```typescript
// Enhanced PDF Export with proper error handling and multi-page support

async function generatePDF() {
  try {
    // 1. Create PDF instance
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 2. Add cover page
    addCoverPage(pdf, filters, summary);

    // 3. Add executive summary
    pdf.addPage();
    addExecutiveSummary(pdf, summary, insights);

    // 4. Capture and add chart sections
    const sections = [
      { id: 'three-bucket-section', title: 'Three-Bucket Analysis' },
      { id: 'trend-analysis-section', title: 'Trend Analysis' },
      { id: 'aircraft-performance-section', title: 'Aircraft Performance' },
      { id: 'root-cause-section', title: 'Root Cause Analysis' },
      { id: 'cost-analysis-section', title: 'Cost Analysis' },
      { id: 'predictive-section', title: 'Predictive Analytics' },
    ];

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) {
        // Wait for charts to render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture as canvas
        const canvas = await html2canvas(element, {
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scale: 2, // Higher resolution
        });

        // Add new page
        pdf.addPage();
        
        // Add section title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.title, 15, 15);

        // Add chart image
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 180; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Handle multi-page sections if needed
        let heightLeft = imgHeight;
        let position = 25; // Below title
        
        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
        heightLeft -= (297 - position - 15); // A4 height minus margins
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight + 15;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight);
          heightLeft -= (297 - 15);
        }
      }
    }

    // 5. Add page numbers and footers
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pdf.internal.pageSize.getWidth() / 2,
        pdf.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      pdf.text(
        'Confidential - Alpha Star Aviation',
        15,
        pdf.internal.pageSize.getHeight() - 10
      );
    }

    // 6. Save PDF
    pdf.save(filename);
    
    return { success: true };
  } catch (error) {
    console.error('PDF generation failed:', error);
    return { success: false, error: error.message };
  }
}

// Helper: Add cover page
function addCoverPage(pdf: jsPDF, filters: any, summary: any) {
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AOG Analytics Report', 105, 60, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Alpha Star Aviation', 105, 75, { align: 'center' });
  
  pdf.setFontSize(12);
  const dateRange = filters.dateRange.startDate && filters.dateRange.endDate
    ? `${format(new Date(filters.dateRange.startDate), 'MMM dd, yyyy')} - ${format(new Date(filters.dateRange.endDate), 'MMM dd, yyyy')}`
    : 'All Time';
  pdf.text(`Period: ${dateRange}`, 105, 100, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 105, 110, { align: 'center' });
  
  // Add filter info
  if (filters.fleetFilter || filters.aircraftFilter) {
    pdf.text(
      `Filters: ${filters.fleetFilter || 'All Fleets'}, ${filters.aircraftFilter || 'All Aircraft'}`,
      105,
      120,
      { align: 'center' }
    );
  }
}

// Helper: Add executive summary
function addExecutiveSummary(pdf: jsPDF, summary: any, insights: any[]) {
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', 15, 20);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  let y = 35;
  pdf.text('Key Metrics:', 15, y);
  y += 10;
  
  const metrics = [
    `Total Events: ${summary.totalEvents}`,
    `Active AOG: ${summary.activeEvents}`,
    `Total Downtime: ${summary.totalDowntimeHours.toFixed(1)} hours`,
    `Average Downtime: ${summary.averageDowntimeHours.toFixed(1)} hours`,
  ];
  
  metrics.forEach(metric => {
    pdf.text(`• ${metric}`, 20, y);
    y += 7;
  });
  
  y += 10;
  pdf.text('Top Insights:', 15, y);
  y += 10;
  
  insights.slice(0, 5).forEach(insight => {
    pdf.text(`• ${insight.title}`, 20, y);
    y += 7;
  });
}
```


## 6. Backend API Enhancements

### 6.1 New Analytics Endpoints

#### 6.1.1 Monthly Trend Endpoint

**Route**: `GET /api/aog-events/analytics/monthly-trend`

**Controller**: `AOGEventsController.getMonthlyTrend()`

**Service Method**: `AOGEventsService.getMonthlyTrend()`

```typescript
// Service implementation
async getMonthlyTrend(
  startDate?: Date,
  endDate?: Date,
  aircraftId?: string,
): Promise<MonthlyTrendResponseDto> {
  // MongoDB aggregation pipeline:
  // 1. Match events by date range and aircraft
  // 2. Group by month (YYYY-MM format)
  // 3. Calculate count, total hours, average hours per month
  // 4. Sort by month ascending
  // 5. Calculate 3-month moving average
  
  const pipeline = [
    {
      $match: {
        detectedAt: {
          $gte: startDate || new Date('2020-01-01'),
          $lte: endDate || new Date(),
        },
        ...(aircraftId && { aircraftId: new Types.ObjectId(aircraftId) }),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$detectedAt' },
        },
        eventCount: { $sum: 1 },
        totalDowntimeHours: { $sum: { $ifNull: ['$totalDowntimeHours', 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id',
        eventCount: 1,
        totalDowntimeHours: { $round: ['$totalDowntimeHours', 2] },
        averageDowntimeHours: {
          $round: [{ $divide: ['$totalDowntimeHours', '$eventCount'] }, 2],
        },
      },
    },
    { $sort: { month: 1 } },
  ];
  
  const trends = await this.aogEventRepository.aggregate(pipeline);
  
  // Calculate moving average
  const movingAverage = this.calculateMovingAverage(trends, 3);
  
  return { trends, movingAverage };
}

// Helper: Calculate moving average
private calculateMovingAverage(
  data: Array<{ month: string; totalDowntimeHours: number }>,
  window: number,
): Array<{ month: string; value: number }> {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push({ month: data[i].month, value: data[i].totalDowntimeHours });
    } else {
      const sum = data
        .slice(i - window + 1, i + 1)
        .reduce((acc, item) => acc + item.totalDowntimeHours, 0);
      result.push({
        month: data[i].month,
        value: Math.round((sum / window) * 100) / 100,
      });
    }
  }
  return result;
}
```


#### 6.1.2 Insights Generation Endpoint

**Route**: `GET /api/aog-events/analytics/insights`

**Controller**: `AOGEventsController.getInsights()`

**Service Method**: `AOGEventsService.generateInsights()`

```typescript
async generateInsights(
  startDate?: Date,
  endDate?: Date,
  aircraftId?: string,
): Promise<InsightsResponseDto> {
  const insights: AutomatedInsight[] = [];
  
  // Fetch necessary data
  const events = await this.findAll({ startDate, endDate, aircraftId });
  const bucketAnalytics = await this.getThreeBucketAnalytics({ startDate, endDate, aircraftId });
  
  // 1. Check for procurement bottleneck
  const procurementPercentage = bucketAnalytics.buckets.procurement.percentage;
  if (procurementPercentage > 50) {
    insights.push({
      id: 'procurement-bottleneck',
      type: 'warning',
      title: 'Procurement Delays Detected',
      description: `Parts procurement accounts for ${procurementPercentage.toFixed(1)}% of total downtime, indicating supply chain issues.`,
      metric: procurementPercentage,
      recommendation: 'Review supplier contracts and consider increasing critical parts inventory.',
    });
  }
  
  // 2. Check for recurring issues
  const reasonCodeCounts = this.countReasonCodes(events);
  const recurringIssues = reasonCodeCounts.filter(rc => rc.count >= 3);
  if (recurringIssues.length > 0) {
    const topIssue = recurringIssues[0];
    insights.push({
      id: 'recurring-issue',
      type: 'warning',
      title: `Recurring Issue: ${topIssue.reasonCode}`,
      description: `This issue has occurred ${topIssue.count} times in the selected period.`,
      metric: topIssue.count,
      recommendation: 'Conduct root cause analysis and implement preventive measures.',
    });
  }
  
  // 3. Check for cost spike
  const currentMonthCost = this.calculateCurrentMonthCost(events);
  const averageCost = this.calculateAverageMonthlyCost(events);
  if (currentMonthCost > averageCost * 1.5) {
    const increasePercentage = ((currentMonthCost - averageCost) / averageCost) * 100;
    insights.push({
      id: 'cost-spike',
      type: 'warning',
      title: 'Unusual Cost Increase',
      description: `AOG costs are ${increasePercentage.toFixed(1)}% higher than the 3-month average.`,
      metric: increasePercentage,
      recommendation: 'Review recent high-cost events and identify cost drivers.',
    });
  }
  
  // 4. Check for improving trend
  const previousPeriodDowntime = await this.getPreviousPeriodDowntime(startDate, endDate);
  const currentDowntime = bucketAnalytics.summary.totalDowntimeHours;
  if (previousPeriodDowntime > 0) {
    const improvement = ((previousPeriodDowntime - currentDowntime) / previousPeriodDowntime) * 100;
    if (improvement > 20) {
      insights.push({
        id: 'improving-trend',
        type: 'success',
        title: 'Downtime Reduction Success',
        description: `Total downtime decreased by ${improvement.toFixed(1)}% compared to the previous period.`,
        metric: improvement,
        recommendation: 'Document successful practices for replication across the fleet.',
      });
    }
  }
  
  // 5. Check data quality
  const legacyEventCount = events.filter(e => e.isLegacy).length;
  const completenessPercentage = ((events.length - legacyEventCount) / events.length) * 100;
  if (completenessPercentage < 70) {
    insights.push({
      id: 'data-quality',
      type: 'info',
      title: 'Incomplete Data Detected',
      description: `${(100 - completenessPercentage).toFixed(1)}% of events lack milestone timestamps, limiting analytics accuracy.`,
      metric: completenessPercentage,
      recommendation: 'Update recent events with milestone data for better insights.',
    });
  }
  
  // 6. Check for high-risk aircraft
  const aircraftReliability = await this.getAircraftReliability(startDate, endDate);
  const highRiskAircraft = aircraftReliability.needsAttention.filter(a => a.eventCount > 10);
  if (highRiskAircraft.length > 0) {
    const topRisk = highRiskAircraft[0];
    insights.push({
      id: 'high-risk-aircraft',
      type: 'warning',
      title: `High-Risk Aircraft: ${topRisk.registration}`,
      description: `Aircraft has ${topRisk.eventCount} events with ${topRisk.totalHours.toFixed(1)} hours of downtime.`,
      metric: topRisk.eventCount,
      recommendation: 'Schedule comprehensive maintenance review and preventive actions.',
    });
  }
  
  // Calculate data quality metrics
  const dataQuality = {
    completenessPercentage: Math.round(completenessPercentage * 100) / 100,
    legacyEventCount,
    totalEvents: events.length,
  };
  
  return { insights, dataQuality };
}
```


#### 6.1.3 Forecast Endpoint

**Route**: `GET /api/aog-events/analytics/forecast`

**Controller**: `AOGEventsController.getForecast()`

**Service Method**: `AOGEventsService.generateForecast()`

```typescript
async generateForecast(
  startDate?: Date,
  endDate?: Date,
  aircraftId?: string,
): Promise<ForecastData> {
  // Get historical monthly data (last 12 months)
  const monthlyTrend = await this.getMonthlyTrend(startDate, endDate, aircraftId);
  
  // Prepare data for linear regression
  const historicalData = monthlyTrend.trends.map((item, index) => ({
    x: index,
    y: item.totalDowntimeHours,
    month: item.month,
  }));
  
  // Calculate linear regression: y = mx + b
  const n = historicalData.length;
  const sumX = historicalData.reduce((sum, item) => sum + item.x, 0);
  const sumY = historicalData.reduce((sum, item) => sum + item.y, 0);
  const sumXY = historicalData.reduce((sum, item) => sum + item.x * item.y, 0);
  const sumX2 = historicalData.reduce((sum, item) => sum + item.x * item.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Generate forecast for next 3 months
  const forecastData = [];
  for (let i = 1; i <= 3; i++) {
    const x = n + i - 1;
    const predicted = slope * x + intercept;
    const confidenceInterval = predicted * 0.2; // ±20% confidence
    
    // Calculate next month
    const lastMonth = new Date(historicalData[historicalData.length - 1].month + '-01');
    const nextMonth = new Date(lastMonth);
    nextMonth.setMonth(nextMonth.getMonth() + i);
    
    forecastData.push({
      month: format(nextMonth, 'yyyy-MM'),
      predicted: Math.max(0, Math.round(predicted * 100) / 100),
      confidenceInterval: {
        lower: Math.max(0, Math.round((predicted - confidenceInterval) * 100) / 100),
        upper: Math.round((predicted + confidenceInterval) * 100) / 100,
      },
    });
  }
  
  return {
    historical: historicalData.map(item => ({
      month: item.month,
      actual: item.y,
    })),
    forecast: forecastData,
  };
}
```

### 6.2 Enhanced Existing Endpoints

The following existing endpoints already exist and will be used:
- `GET /api/aog-events/analytics/buckets` - Three-bucket analytics (already implemented)
- `GET /api/aog-events/analytics/category-breakdown` - Category breakdown (already implemented)
- `GET /api/aog-events/analytics/location-heatmap` - Location heatmap (already implemented)
- `GET /api/aog-events/analytics/duration-distribution` - Duration distribution (already implemented)
- `GET /api/aog-events/analytics/aircraft-reliability` - Aircraft reliability (already implemented)


## 7. Frontend Hooks

### 7.1 New Custom Hooks

```typescript
// hooks/useAOGAnalytics.ts

/**
 * Hook for fetching monthly trend data
 */
export function useMonthlyTrend(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'monthly-trend', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/monthly-trend', { params: query });
      return data as MonthlyTrendResponseDto;
    },
  });
}

/**
 * Hook for fetching forecast data
 */
export function useForecast(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'forecast', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/forecast', { params: query });
      return data as ForecastData;
    },
  });
}

/**
 * Hook for fetching automated insights
 */
export function useInsights(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'insights', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/insights', { params: query });
      return data as InsightsResponseDto;
    },
  });
}

/**
 * Hook for fetching data quality metrics
 */
export function useDataQuality(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'data-quality', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/insights', { params: query });
      return data.dataQuality as DataQualityMetrics;
    },
  });
}
```

## 8. Performance Optimization

### 8.1 Data Fetching Strategy

**Problem**: Loading 10+ charts simultaneously can cause slow page loads

**Solution**: Progressive loading with priority

```typescript
// Priority 1: Critical data (loads immediately)
const { data: summary } = useThreeBucketAnalytics(filters);
const { data: events } = useAOGEvents(filters);

// Priority 2: Important visualizations (loads after 500ms)
useEffect(() => {
  const timer = setTimeout(() => {
    setLoadPriority2(true);
  }, 500);
  return () => clearTimeout(timer);
}, []);

const { data: monthlyTrend } = useMonthlyTrend(filters, { enabled: loadPriority2 });
const { data: categoryBreakdown } = useCategoryBreakdown(filters, { enabled: loadPriority2 });

// Priority 3: Nice-to-have analytics (loads after 1000ms)
useEffect(() => {
  const timer = setTimeout(() => {
    setLoadPriority3(true);
  }, 1000);
  return () => clearTimeout(timer);
}, []);

const { data: forecast } = useForecast(filters, { enabled: loadPriority3 });
const { data: insights } = useInsights(filters, { enabled: loadPriority3 });
```

### 8.2 Chart Rendering Optimization

**Problem**: Recharts can be slow with large datasets

**Solution**: Data sampling and virtualization

```typescript
// Sample data for charts if dataset is too large
function sampleData<T>(data: T[], maxPoints: number = 100): T[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

// Use in chart components
<LineChart data={sampleData(monthlyTrendData, 50)}>
  {/* Chart content */}
</LineChart>
```

### 8.3 Memoization

```typescript
// Memoize expensive calculations
const reliabilityScores = useMemo(() => {
  return calculateReliabilityScores(aircraftData);
}, [aircraftData]);

const costAnalysis = useMemo(() => {
  return analyzeCosts(events);
}, [events]);
```

### 8.4 Backend Caching

```typescript
// Add caching to analytics endpoints
@Controller('aog-events/analytics')
export class AOGAnalyticsController {
  @Get('monthly-trend')
  @CacheKey('aog-monthly-trend')
  @CacheTTL(300) // 5 minutes
  async getMonthlyTrend(@Query() query: AnalyticsFilterDto) {
    return this.aogEventsService.getMonthlyTrend(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.aircraftId,
    );
  }
}
```


## 9. Error Handling & Legacy Data Strategy

### 9.1 Legacy Data Handling

**Strategy**: Graceful degradation with clear user communication

```typescript
// Component: LegacyDataBadge.tsx
interface LegacyDataBadgeProps {
  legacyCount: number;
  totalCount: number;
}

export function LegacyDataBadge({ legacyCount, totalCount }: LegacyDataBadgeProps) {
  if (legacyCount === 0) return null;
  
  const percentage = (legacyCount / totalCount) * 100;
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      <span className="text-sm text-amber-800 dark:text-amber-200">
        {legacyCount} events ({percentage.toFixed(1)}%) lack milestone data
      </span>
      <Tooltip content="Legacy events show total downtime only. Three-bucket breakdown requires milestone timestamps.">
        <InfoIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 cursor-help" />
      </Tooltip>
    </div>
  );
}
```

**Chart Behavior with Legacy Data**:

```typescript
// Three-bucket charts: Exclude legacy events or show in separate "Legacy" category
function prepareThreeBucketData(data: ThreeBucketAnalytics, showLegacy: boolean) {
  if (!showLegacy) {
    // Default: Only show events with milestone data
    return {
      technical: data.buckets.technical,
      procurement: data.buckets.procurement,
      ops: data.buckets.ops,
    };
  } else {
    // Optional: Show legacy as fourth category
    return {
      technical: data.buckets.technical,
      procurement: data.buckets.procurement,
      ops: data.buckets.ops,
      legacy: data.buckets.legacy, // All time attributed to "Unknown"
    };
  }
}

// Trend charts: Include legacy events using total downtime
function prepareMonthlyTrendData(events: AOGEvent[]) {
  return events.map(event => ({
    month: format(new Date(event.detectedAt), 'yyyy-MM'),
    downtime: event.totalDowntimeHours || 0,
    hasMillestones: !event.isLegacy,
  }));
}
```

### 9.2 Error Handling

**API Error Handling**:

```typescript
// Custom error boundary for analytics sections
export function AnalyticsSectionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center bg-card border border-border rounded-lg">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Unable to Load Analytics
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading this section. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

**Loading States**:

```typescript
// Skeleton loaders for charts
export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

// Usage in components
{isLoading ? (
  <ChartSkeleton />
) : (
  <MonthlyTrendChart data={data} />
)}
```

**Empty States**:

```typescript
// Empty state for charts with no data
export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <BarChart3 className="w-16 h-16 text-muted-foreground/50 mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
```


## 10. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Legacy Data Handling
*For any* AOG event without milestone timestamps (isLegacy = true), the system should display total downtime using (clearedAt - detectedAt) and show a "Limited Analytics" indicator without throwing errors.
**Validates: Requirements FR-1.1**

### Property 2: Fallback Metrics Computation
*For any* AOG event with partial milestone data, the system should compute available bucket times (technical, procurement, ops) correctly, setting missing buckets to 0 and documenting assumptions in tooltips.
**Validates: Requirements FR-1.2**

### Property 3: Data Quality Score Calculation
*For any* set of AOG events, the data completeness percentage should equal (eventsWithMilestones / totalEvents) * 100, where an event is "complete" if it has reportedAt, installationCompleteAt, and upAndRunningAt.
**Validates: Requirements FR-1.3**

### Property 4: Moving Average Calculation
*For any* time-series data with N points and window size W, the moving average at point i (where i >= W-1) should equal the average of points [i-W+1, i], and earlier points should use their actual values.
**Validates: Requirements FR-2.2**

### Property 5: Reliability Score Consistency
*For any* aircraft, the reliability score (0-100) should be inversely proportional to event count and total downtime, calculated as: 100 - min(100, (eventCount * 5) + (totalDowntimeHours / 10)).
**Validates: Requirements FR-2.3**

### Property 6: Pareto Principle Validation
*For any* set of reason codes sorted by frequency descending, the cumulative percentage should be monotonically increasing, reaching 100% at the last item.
**Validates: Requirements FR-2.4**

### Property 7: Cost Aggregation Accuracy
*For any* set of AOG events, totalCost should equal sum(internalCost + externalCost) across all events, and costPerHour should equal totalCost / totalDowntimeHours (when totalDowntimeHours > 0).
**Validates: Requirements FR-2.5**

### Property 8: Forecast Bounds
*For any* forecast prediction, the confidence interval lower bound should be <= predicted value <= upper bound, and all values should be non-negative.
**Validates: Requirements FR-2.6**

### Property 9: Period Comparison Delta
*For any* two time periods with metrics M1 and M2, the percentage change should equal ((M2 - M1) / M1) * 100 when M1 > 0, and should be undefined when M1 = 0.
**Validates: Requirements FR-3.2**


## 11. Error Handling

### 11.1 API Error Scenarios

| Scenario | HTTP Status | Error Response | Frontend Handling |
|----------|-------------|----------------|-------------------|
| Invalid date range | 400 | `{ code: 'INVALID_DATE_RANGE', message: 'startDate must be before endDate' }` | Show toast error, reset to valid range |
| Aircraft not found | 404 | `{ code: 'AIRCRAFT_NOT_FOUND', message: 'Aircraft with ID X not found' }` | Show toast error, clear aircraft filter |
| No data available | 200 | `{ data: [], summary: { totalEvents: 0 } }` | Show empty state with helpful message |
| Database timeout | 500 | `{ code: 'DATABASE_TIMEOUT', message: 'Query timed out' }` | Show retry button, log error |
| PDF generation failed | 500 | `{ code: 'PDF_GENERATION_FAILED', message: 'PDF export failed' }` | Show error toast, offer retry |

### 11.2 Frontend Error Recovery

```typescript
// Retry logic for failed queries
const { data, error, refetch } = useMonthlyTrend(filters, {
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Error toast notifications
if (error) {
  toast.error('Failed to load analytics data', {
    description: error.message,
    action: {
      label: 'Retry',
      onClick: () => refetch(),
    },
  });
}
```

## 12. Testing Strategy

### 12.1 Unit Tests

**Backend Service Tests**:
```typescript
describe('AOGEventsService.generateInsights', () => {
  it('should detect procurement bottleneck when >50%', () => {
    const insights = service.generateInsights(mockEvents);
    expect(insights.find(i => i.id === 'procurement-bottleneck')).toBeDefined();
  });
  
  it('should detect recurring issues with 3+ occurrences', () => {
    const insights = service.generateInsights(mockEventsWithRecurring);
    expect(insights.find(i => i.id === 'recurring-issue')).toBeDefined();
  });
});

describe('AOGEventsService.generateForecast', () => {
  it('should generate 3-month forecast with confidence intervals', () => {
    const forecast = service.generateForecast(mockHistoricalData);
    expect(forecast.forecast).toHaveLength(3);
    expect(forecast.forecast[0].confidenceInterval.lower).toBeLessThanOrEqual(
      forecast.forecast[0].predicted
    );
  });
});
```

**Frontend Component Tests**:
```typescript
describe('MonthlyTrendChart', () => {
  it('should render chart with correct data points', () => {
    render(<MonthlyTrendChart data={mockTrendData} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
  
  it('should show empty state when no data', () => {
    render(<MonthlyTrendChart data={[]} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});
```

### 12.2 Property-Based Tests

**Property Test 1: Data Quality Score**
```typescript
import fc from 'fast-check';

describe('Property: Data Quality Score Calculation', () => {
  it('should always be between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          isLegacy: fc.boolean(),
        })),
        (events) => {
          const score = calculateDataQualityScore(events);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property Test 2: Moving Average**
```typescript
describe('Property: Moving Average Calculation', () => {
  it('should produce monotonic cumulative values', () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 0, max: 1000 }), { minLength: 12 }),
        (values) => {
          const movingAvg = calculateMovingAverage(values, 3);
          // Each moving average should be within range of input values
          movingAvg.forEach((avg, i) => {
            if (i >= 2) {
              const window = values.slice(i - 2, i + 1);
              const expectedAvg = window.reduce((a, b) => a + b, 0) / 3;
              expect(Math.abs(avg - expectedAvg)).toBeLessThan(0.01);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 12.3 Integration Tests

```typescript
describe('AOG Analytics Page Integration', () => {
  it('should load all sections without errors', async () => {
    render(<AOGAnalyticsPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/total events/i)).toBeInTheDocument();
    });
    
    // Verify all sections are present
    expect(screen.getByText(/three-bucket analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/trend analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/aircraft performance/i)).toBeInTheDocument();
  });
  
  it('should handle filter changes correctly', async () => {
    render(<AOGAnalyticsPage />);
    
    // Change date filter
    const dateButton = screen.getByText(/last 30 days/i);
    fireEvent.click(dateButton);
    
    // Verify data refetches
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(
        expect.stringContaining('analytics'),
        expect.objectContaining({
          params: expect.objectContaining({
            startDate: expect.any(String),
          }),
        })
      );
    });
  });
});
```

### 12.4 Performance Tests

```typescript
describe('Performance: Page Load Time', () => {
  it('should load page in < 3 seconds with 1000 events', async () => {
    const startTime = performance.now();
    
    render(<AOGAnalyticsPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/total events/i)).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
```


## 13. Implementation Phases

### Phase 1: Foundation (Days 1-2)
- Fix PDF export container ID issue
- Add data quality indicator component
- Implement legacy data handling in existing charts
- Add loading skeletons and error boundaries

### Phase 2: Enhanced Three-Bucket (Days 3-4)
- Implement BucketTrendChart (stacked area)
- Implement WaterfallChart
- Add backend endpoint for monthly bucket trends
- Update existing three-bucket section

### Phase 3: Trend Analysis (Days 5-6)
- Implement MonthlyTrendChart
- Implement MovingAverageChart
- Implement YearOverYearChart
- Add backend monthly-trend endpoint
- Add moving average calculation

### Phase 4: Aircraft Performance (Days 7-8)
- Implement AircraftHeatmap
- Implement ReliabilityScoreCards
- Add reliability score calculation logic
- Add backend aircraft-reliability endpoint

### Phase 5: Root Cause & Cost (Days 9-10)
- Implement ParetoChart
- Implement CategoryBreakdownPie
- Implement ResponsibilityDistributionChart
- Implement CostBreakdownChart
- Implement CostEfficiencyMetrics

### Phase 6: Predictive Analytics (Days 11-12)
- Implement ForecastChart
- Implement RiskScoreGauge
- Implement InsightsPanel
- Add backend forecast endpoint
- Add backend insights endpoint
- Implement insight generation logic

### Phase 7: PDF Export Enhancement (Days 13-14)
- Implement EnhancedPDFExport component
- Add cover page generation
- Add executive summary generation
- Add multi-page support
- Add page numbers and footers
- Test PDF generation thoroughly

### Phase 8: Polish & Testing (Days 15-16)
- Performance optimization
- Add unit tests
- Add integration tests
- Add property-based tests
- Fix bugs and edge cases
- Documentation

## 14. Deployment Considerations

### 14.1 Database Indexes

Ensure these indexes exist for optimal performance:

```typescript
// AOG Events collection
db.aogevents.createIndex({ detectedAt: -1 });
db.aogevents.createIndex({ aircraftId: 1, detectedAt: -1 });
db.aogevents.createIndex({ 'aircraft.fleetGroup': 1, detectedAt: -1 });
db.aogevents.createIndex({ isLegacy: 1 });
db.aogevents.createIndex({ reasonCode: 1 });
db.aogevents.createIndex({ responsibleParty: 1 });
```

### 14.2 Environment Variables

```bash
# Backend
MONGODB_URI=mongodb://localhost:27017/alphastar
CACHE_TTL=300 # 5 minutes for analytics caching
MAX_QUERY_RESULTS=10000 # Limit for large queries

# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_PDF_MAX_WAIT_TIME=10000 # 10 seconds
```

### 14.3 Monitoring

Add monitoring for:
- Analytics endpoint response times
- PDF generation success rate
- Chart rendering performance
- Error rates by endpoint
- Cache hit rates


## 15. Migration & Backward Compatibility

### 15.1 No Breaking Changes

All enhancements are additive:
- Existing API endpoints remain unchanged
- New endpoints are added alongside existing ones
- Frontend components are enhanced, not replaced
- Legacy data continues to work

### 15.2 Feature Flags (Optional)

For gradual rollout, consider feature flags:

```typescript
// Feature flag configuration
const FEATURE_FLAGS = {
  ENHANCED_ANALYTICS: true,
  PREDICTIVE_ANALYTICS: true,
  ADVANCED_PDF_EXPORT: true,
};

// Usage in components
{FEATURE_FLAGS.PREDICTIVE_ANALYTICS && (
  <PredictiveAnalyticsSection />
)}
```

## 16. Success Metrics

### 16.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | < 3 seconds | Performance API |
| Chart render time | < 500ms per chart | Performance marks |
| Filter response time | < 200ms | User interaction timing |
| PDF generation time | < 10 seconds | PDF export timing |
| PDF success rate | > 99% | Error tracking |
| API response time | < 1 second | Backend monitoring |

### 16.2 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Customer satisfaction | "Astonished" | Direct feedback |
| Page views | Most-visited page | Analytics |
| PDF exports | 80% monthly usage | Usage tracking |
| Insights acted upon | 5+ decisions | User surveys |
| Time to insight | < 30 seconds | User testing |

### 16.3 Data Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data completeness | > 80% | Automated calculation |
| Legacy event ratio | < 20% | Database query |
| Milestone adoption | Increasing trend | Monthly tracking |

## 17. Future Enhancements (Post-MVP)

### 17.1 Machine Learning Integration

- Anomaly detection for unusual patterns
- Predictive maintenance recommendations
- Automated root cause identification
- Smart alerting based on historical patterns

### 17.2 Advanced Features

- Custom dashboard builder
- Scheduled PDF reports via email
- Real-time data streaming
- Mobile app with push notifications
- Integration with external BI tools (Tableau, Power BI)

### 17.3 Collaboration Features

- Shared annotations on charts
- Collaborative insights
- Team comments and discussions
- Export to PowerPoint for presentations

## 18. Conclusion

This design provides a comprehensive roadmap for transforming the AOG Analytics page into a world-class analytics dashboard that will "astonish" stakeholders. The design prioritizes:

1. **Graceful Legacy Data Handling**: No errors, clear communication
2. **Visual Impact**: 10+ stunning visualizations with professional styling
3. **Reliable PDF Export**: 100% success rate with multi-page support
4. **Actionable Insights**: Automated insights and recommendations
5. **Performance**: Sub-3-second load times
6. **Maintainability**: Modular, reusable components

The implementation follows Alpha Star Aviation development guidelines, uses proven technologies (React, Recharts, NestJS, MongoDB), and provides a clear path from current state to desired state over 16 days of development.

