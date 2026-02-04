# Task: Update Steering Documentation with AOG Analytics Enhancements

## Overview
After completing the AOG Analytics page enhancements, update the steering documentation to reflect the new capabilities, architecture changes, and best practices.

## Files to Update

### 1. `.kiro/steering/system-architecture.md`

**Section to Add/Update**: AOG Analytics Endpoints

Add the following new endpoints to the API Reference section:

```markdown
### AOG Analytics (Enhanced)
- `GET /api/aog-events/analytics/buckets` - Three-bucket analytics (existing)
- `GET /api/aog-events/analytics/monthly-trend` - Monthly event count and downtime with moving average (NEW)
- `GET /api/aog-events/analytics/category-breakdown` - Events by category with percentages (NEW)
- `GET /api/aog-events/analytics/location-heatmap` - Top locations by event count (NEW)
- `GET /api/aog-events/analytics/duration-distribution` - Events by duration ranges (NEW)
- `GET /api/aog-events/analytics/aircraft-reliability` - Aircraft ranked by reliability score (NEW)
- `GET /api/aog-events/analytics/insights` - Auto-generated insights and recommendations (NEW)
- `GET /api/aog-events/analytics/forecast` - 3-month downtime prediction with confidence intervals (NEW)
```

**Section to Add**: AOG Analytics Page Components

```markdown
### AOG Analytics Page Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DataQualityIndicator` | `components/ui/DataQualityIndicator.tsx` | Shows data completeness percentage |
| `BucketTrendChart` | `components/ui/BucketTrendChart.tsx` | Stacked area chart of bucket trends |
| `WaterfallChart` | `components/ui/WaterfallChart.tsx` | Downtime composition waterfall |
| `MonthlyTrendChart` | `components/ui/MonthlyTrendChart.tsx` | Event count and downtime over time |
| `MovingAverageChart` | `components/ui/MovingAverageChart.tsx` | 3-month moving average visualization |
| `YearOverYearChart` | `components/ui/YearOverYearChart.tsx` | Current vs previous year comparison |
| `AircraftHeatmap` | `components/ui/AircraftHeatmap.tsx` | Aircraft × Month downtime intensity grid |
| `ReliabilityScoreCards` | `components/ui/ReliabilityScoreCards.tsx` | Top/bottom performers by reliability |
| `ParetoChart` | `components/ui/ParetoChart.tsx` | Top 10 reason codes with cumulative % |
| `CategoryBreakdownPie` | `components/ui/CategoryBreakdownPie.tsx` | AOG/Unscheduled/Scheduled distribution |
| `ResponsibilityDistributionChart` | `components/ui/ResponsibilityDistributionChart.tsx` | Downtime by responsible party |
| `CostBreakdownChart` | `components/ui/CostBreakdownChart.tsx` | Internal vs external costs with trend |
| `CostEfficiencyMetrics` | `components/ui/CostEfficiencyMetrics.tsx` | Cost per hour and per event metrics |
| `ForecastChart` | `components/ui/ForecastChart.tsx` | Historical + 3-month forecast with confidence interval |
| `RiskScoreGauge` | `components/ui/RiskScoreGauge.tsx` | Aircraft risk assessment gauge (0-100) |
| `InsightsPanel` | `components/ui/InsightsPanel.tsx` | Auto-generated insights and recommendations |
| `EnhancedAOGAnalyticsPDFExport` | `components/ui/EnhancedAOGAnalyticsPDFExport.tsx` | Multi-page PDF export with cover page |
```

**Section to Add**: AOG Analytics Calculations

```markdown
### AOG Analytics Calculations

#### Data Quality Score
```typescript
completenessPercentage = (eventsWithMilestones / totalEvents) * 100

// Event is "complete" if it has:
// - reportedAt (or detectedAt as fallback)
// - installationCompleteAt
// - upAndRunningAt (or clearedAt as fallback)
```

#### Reliability Score
```typescript
reliabilityScore = 100 - min(100, (eventCount * 5) + (totalDowntimeHours / 10))

// Trend detection (compare to previous period):
// - Improving: Score increased by >5 points
// - Declining: Score decreased by >5 points
// - Stable: Score changed by ≤5 points
```

#### Risk Score
```typescript
riskScore = (
  (recentEventFrequency * 0.4) +
  (averageDowntimeTrend * 0.3) +
  (costTrend * 0.2) +
  (recurringIssues * 0.1)
) * 100

// Risk levels:
// - 0-30: Low Risk (Green)
// - 31-60: Medium Risk (Amber)
// - 61-100: High Risk (Red)
```

#### 3-Month Moving Average
```typescript
movingAverage[i] = (value[i] + value[i-1] + value[i-2]) / 3
```

#### Forecast (Linear Regression)
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
```

### 2. `.kiro/steering/aog-analytics-simplified.md`

**Section to Add**: Enhanced Analytics Features

```markdown
## Enhanced Analytics Features (2025)

### Data Quality Indicators

The system now provides real-time data quality metrics:

- **Completeness Percentage**: Shows what % of events have complete milestone data
- **Color Coding**: Green (>80%), Amber (50-80%), Red (<50%)
- **Legacy Event Handling**: Events without milestones show "Limited Analytics" badge
- **Fallback Calculations**: System uses detectedAt/clearedAt when milestones are missing

### Predictive Analytics

#### 3-Month Forecast
- Uses linear regression on last 12 months of data
- Shows predicted downtime with confidence intervals (±20%)
- Helps anticipate resource needs and budget planning

#### Risk Score
- Aircraft-level risk assessment (0-100 scale)
- Factors: Recent event frequency (40%), downtime trend (30%), cost trend (20%), recurring issues (10%)
- Color-coded: Green (0-30), Amber (31-60), Red (61-100)

#### Automated Insights
The system generates up to 8 types of insights automatically:

1. **High Procurement Time**: Triggered when procurement > 50% of total downtime
2. **Recurring Issues**: Same reason code appears 3+ times in 30 days
3. **Cost Spike**: Current month cost > 150% of 3-month average
4. **Improving Trend**: Downtime decreased by >20% vs previous period
5. **Data Quality Issue**: >30% of events are legacy (no milestones)
6. **Aircraft at Risk**: Aircraft risk score > 70
7. **Seasonal Pattern**: Consistent pattern across years
8. **Bottleneck Identified**: One bucket consistently >60% of total time

### Reliability Score

Aircraft are ranked by a composite reliability score (0-100):

```typescript
reliabilityScore = 100 - min(100, (eventCount * 5) + (totalDowntimeHours / 10))
```

Higher scores indicate more reliable aircraft. Trend indicators show:
- ↑ Improving: Score increased by >5 points vs previous period
- → Stable: Score changed by ≤5 points
- ↓ Declining: Score decreased by >5 points

### PDF Export

Enhanced PDF export generates professional multi-page reports including:

1. **Cover Page**: Title, date range, filters, generation timestamp
2. **Executive Summary**: Key metrics and top 5 insights
3. **Three-Bucket Analysis**: All bucket charts and per-aircraft breakdown
4. **Trend Analysis**: Monthly trends, moving averages, year-over-year
5. **Aircraft Performance**: Heatmap and reliability scores
6. **Root Cause & Cost**: Pareto charts, category breakdown, cost analysis
7. **Predictive Analytics**: Forecast and risk scores

All pages include:
- Page numbers ("Page X of Y")
- Confidentiality notice
- Generation timestamp
- High-resolution charts (2x scale for clarity)

### Performance Optimization

- **Backend Caching**: 5-minute TTL on analytics endpoints
- **Progressive Loading**: Priority-based data fetching (Priority 1, 2, 3)
- **Data Sampling**: Charts limited to 100 data points for large datasets
- **Memoization**: Expensive calculations cached in frontend
- **Target**: Page load < 3 seconds with 1000+ events
```

### 3. Create New File: `.kiro/steering/aog-analytics-user-guide.md`

```markdown
# AOG Analytics Page - User Guide

## Overview

The AOG Analytics page provides comprehensive insights into aircraft downtime patterns, cost impacts, and predictive intelligence. This guide explains how to interpret the visualizations and use the analytics features effectively.

## Page Sections

### 1. Data Quality Indicator

**Location**: Top of page, below filters

**What it shows**: Percentage of AOG events with complete milestone data

**Color coding**:
- 🟢 Green (>80%): Excellent data quality
- 🟡 Amber (50-80%): Acceptable data quality
- 🔴 Red (<50%): Poor data quality - consider updating recent events

**Action**: Click the indicator to see which events are missing milestone data

### 2. Summary Cards

**Metrics displayed**:
- Total Events: Count of all AOG events in selected period
- Active AOG: Events currently not cleared
- Total Downtime: Sum of all downtime hours
- Average Downtime: Mean hours per event

### 3. Three-Bucket Analysis

**Purpose**: Understand where downtime occurs

**Buckets**:
- 🔵 **Technical** (Blue): Troubleshooting + Installation work
- 🟠 **Procurement** (Amber): Waiting for parts
- 🟢 **Ops** (Green): Operational testing

**Charts**:
- **Bar Chart**: Compare total hours across buckets
- **Pie Chart**: See percentage distribution
- **Trend Chart**: Track how buckets change over time
- **Waterfall Chart**: Visualize downtime composition

**Interpretation**:
- High Procurement Time → Supply chain issues
- High Technical Time → Complex troubleshooting needed
- High Ops Time → Testing delays or approval bottlenecks

### 4. Trend Analysis

**Monthly Trend Chart**: Shows event count (bars) and total downtime (line) over 12 months

**Moving Average Chart**: Smooths volatility with 3-month average

**Year-over-Year Chart**: Compares current year vs previous year with delta indicators

**Use cases**:
- Identify seasonal patterns
- Measure improvement initiatives
- Spot emerging trends early

### 5. Aircraft Performance

**Heatmap**: Grid showing downtime intensity per aircraft per month
- Darker colors = more downtime
- Click any cell to drill down

**Reliability Score Cards**:
- **Most Reliable** (left): Top 5 aircraft with highest scores
- **Needs Attention** (right): Top 5 aircraft with lowest scores

**Reliability Score** (0-100):
- 80-100: Excellent
- 60-79: Good
- 40-59: Fair
- 0-39: Needs attention

### 6. Root Cause Analysis

**Pareto Chart**: Shows top 10 reason codes
- Bars: Event count
- Line: Cumulative percentage
- 80% line: Pareto principle (80% of problems from 20% of causes)

**Category Breakdown**: Distribution of AOG vs Unscheduled vs Scheduled

**Responsibility Distribution**: Downtime by responsible party
- Internal: Your maintenance team
- OEM: Original equipment manufacturer
- Customs: Customs/import delays
- Finance: Payment/approval delays
- Other: External factors

### 7. Cost Analysis

**Cost Breakdown Chart**: Internal vs External costs over time

**Cost Efficiency Metrics**:
- **Cost per Hour**: Total cost ÷ Total downtime hours
- **Cost per Event**: Total cost ÷ Event count

**Interpretation**:
- Increasing cost per hour → More expensive repairs
- Decreasing cost per event → Better cost control

### 8. Predictive Analytics

**Forecast Chart**: 3-month downtime prediction
- Solid line: Historical actual
- Dashed line: Forecast
- Shaded area: Confidence interval (±20%)

**Risk Score Gauges**: Top 3 high-risk aircraft
- 0-30: Low risk (green)
- 31-60: Medium risk (amber)
- 61-100: High risk (red)

**Insights Panel**: Auto-generated recommendations
- ⚠️ Warning: Requires immediate attention
- ℹ️ Info: Informational insight
- ✓ Success: Positive trend

## Filters

**Date Range**: Select preset (7 days, 30 days, This Month, etc.) or custom range

**Fleet Group**: Filter by aircraft type (A340, A330, G650ER, etc.)

**Aircraft**: Filter by specific tail number

**Tips**:
- Filters apply to all charts simultaneously
- Use breadcrumbs to track active filters
- Click "Reset Filters" to return to overview

## PDF Export

**Button location**: Top right of page

**What's included**:
1. Cover page with filters and date range
2. Executive summary with key metrics
3. All visualizations (high resolution)
4. Per-aircraft breakdown table
5. Page numbers and confidentiality notice

**Generation time**: 5-10 seconds for full report

**Use cases**:
- Board presentations
- Executive briefings
- Monthly reports
- Stakeholder updates

## Best Practices

### For Executives
1. Start with Summary Cards for quick overview
2. Check Insights Panel for key takeaways
3. Review Forecast Chart for resource planning
4. Export PDF for presentations

### For Operations Managers
1. Use Trend Analysis to measure improvements
2. Check Heatmap to identify problem aircraft
3. Review Pareto Chart to prioritize fixes
4. Monitor Cost Efficiency Metrics

### For Maintenance Teams
1. Focus on Three-Bucket Analysis to find bottlenecks
2. Check Responsibility Distribution to identify external delays
3. Review Recurring Issues in Insights Panel
4. Use Reliability Scores to prioritize preventive maintenance

## Troubleshooting

**Q: Charts show "No downtime data available"**
A: This means events lack milestone timestamps. Update recent events with milestone data or check Data Quality Indicator.

**Q: PDF export fails**
A: Wait for all charts to load completely before exporting. If issue persists, try exporting with fewer filters.

**Q: Forecast seems inaccurate**
A: Forecast requires at least 6 months of historical data. With less data, predictions may be unreliable.

**Q: Reliability scores seem wrong**
A: Scores are relative to your fleet. A "low" score doesn't mean the aircraft is unreliable, just less reliable than others in your fleet.

## Support

For questions or issues, contact:
- Technical Support: support@alphastarav.com
- Documentation: See `.kiro/specs/aog-analytics-enhancement/`
```

## Implementation Steps

1. **After completing all AOG Analytics enhancement tasks**, execute this task
2. Update `system-architecture.md` with new endpoints and components
3. Update `aog-analytics-simplified.md` with enhanced features section
4. Create new `aog-analytics-user-guide.md` file
5. Test all documentation links and code examples
6. Commit changes with message: "docs: Update steering docs with AOG Analytics enhancements"

## Verification

- [ ] All new endpoints documented in system-architecture.md
- [ ] All new components listed with locations
- [ ] Calculation formulas are accurate and match implementation
- [ ] User guide covers all major features
- [ ] Examples are clear and actionable
- [ ] Links to spec files are correct
- [ ] No broken references or outdated information

## Notes

- Keep documentation concise and actionable
- Use code blocks for formulas and calculations
- Include visual indicators (emojis) for better readability
- Link to spec files for detailed technical information
- Update this task if new features are added during implementation
