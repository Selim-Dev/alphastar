# Budget Analytics Page - Implementation Guide

## Overview

The Budget Analytics Page provides comprehensive visualizations and insights for budget projects. It features 6 KPI cards, 6 chart visualizations, and advanced filtering capabilities with progressive loading for optimal performance.

## Page Structure

```
BudgetAnalyticsPage
├── Header (Project name, date range, Export PDF button)
├── Filter Panel (Date range, Aircraft type, Term search)
├── KPI Cards (6 metrics in grid layout)
├── Charts Section
│   ├── Monthly Spend by Term (Stacked Bar)
│   ├── Cumulative Spend vs Budget (Line Chart)
│   ├── Spend Distribution (Donut Chart)
│   ├── Budgeted vs Spent by Aircraft Type (Grouped Bar)
│   ├── Top 5 Overspend Terms (Ranked List)
│   └── Spending Heatmap (Grid Heatmap)
```

## Features

### 1. Filter Panel

**Location**: Top of page, below header

**Filters Available**:
- **Start Date**: Date picker constrained to project date range
- **End Date**: Date picker constrained to project date range
- **Aircraft Type**: Dropdown populated from project aircraft scope
- **Term Search**: Text input with 300ms debounce

**Behavior**:
- All filters update analytics queries automatically
- Term search is debounced to reduce API calls (300ms delay)
- Loading states shown during filter updates
- Filters persist during session

### 2. KPI Cards

**Metrics Displayed**:

1. **Total Budgeted**
   - Total planned budget amount
   - Formatted with currency symbol

2. **Total Spent**
   - Total actual expenditure
   - Formatted with currency symbol

3. **Remaining Budget**
   - Budget remaining (Budgeted - Spent)
   - Formatted with currency symbol

4. **Budget Utilization**
   - Percentage of budget used
   - Displayed as percentage with 1 decimal place

5. **Burn Rate**
   - Average monthly spending rate
   - Formatted with currency symbol
   - Shows "per month" label

6. **Forecast**
   - Months remaining until budget depletion
   - Shows depletion date if available
   - Calculated as: Remaining Budget / Burn Rate

**Layout**: 3 columns on desktop, 2 on tablet, 1 on mobile

### 3. Chart Visualizations

#### Monthly Spend by Term (Stacked Bar Chart)

**Purpose**: Shows monthly spending broken down by spending terms

**Features**:
- Stacked bars with each term as a segment
- Color-coded terms (8 distinct colors)
- X-axis: Months (formatted as MM/YY)
- Y-axis: Currency amounts (formatted as K for thousands)
- Tooltip shows exact amounts
- Legend shows all terms

**Data Source**: `useMonthlySpend()` hook with filters

#### Cumulative Spend vs Budget (Line Chart)

**Purpose**: Compares cumulative spend vs cumulative budget over time

**Features**:
- Two lines: Budget (blue) and Spent (green)
- Budget target reference line (dashed)
- X-axis: Months (formatted as MM/YY)
- Y-axis: Currency amounts (formatted as K)
- Tooltip shows exact amounts
- Legend shows both lines

**Data Source**: `useCumulativeSpend()` hook

#### Spend Distribution (Donut Chart)

**Purpose**: Shows spending distribution by category

**Features**:
- Donut chart with percentage labels
- Color-coded categories (8 distinct colors)
- Legend shows categories with percentages
- Tooltip shows exact amounts
- Center hole for better readability

**Data Source**: `useSpendDistribution()` hook with filters

#### Budgeted vs Spent by Aircraft Type (Grouped Bar Chart)

**Purpose**: Compares budgeted vs spent amounts by aircraft type

**Features**:
- Side-by-side bars (Budgeted in blue, Spent in green)
- X-axis: Aircraft types
- Y-axis: Currency amounts (formatted as K)
- Tooltip shows exact amounts
- Legend shows both metrics

**Data Source**: `useBudgetedVsSpent()` hook

#### Top 5 Overspend Terms (Ranked List)

**Purpose**: Displays top 5 overspending terms

**Features**:
- Numbered ranking (1-5)
- Progress bars showing utilization percentage
- Overspend amount and percentage in red
- Shows budgeted and spent amounts
- Sorted by highest overspend first

**Data Source**: `useTop5Overspend()` hook

#### Spending Heatmap (Grid Heatmap)

**Purpose**: Shows spending intensity across terms and periods

**Features**:
- Grid layout with terms as rows, periods as columns
- Color-coded cells (blue scale: light = low, dark = high)
- Sticky term column for horizontal scrolling
- Hover tooltips with exact values
- Legend showing intensity scale (Low, Medium, High)
- Values displayed as K for thousands

**Data Source**: `useHeatmap()` hook

### 4. Progressive Loading

**Loading Priority**:

1. **Priority 1 (Critical)**: KPI cards
   - Loads first for immediate insights
   - Shows skeleton loaders while loading

2. **Priority 2 (Important)**: Main charts
   - Monthly spend, cumulative spend, distribution, budgeted vs spent, top 5
   - Shows skeleton loaders while loading

3. **Priority 3 (Optional)**: Heatmap
   - Loads last as it's optional
   - Shows skeleton loader while loading

**Benefits**:
- Faster perceived performance
- Users see critical data immediately
- Reduces initial load time

### 5. Responsive Design

**Breakpoints**:
- **Desktop (lg)**: 3-column KPI grid, 2-column chart grid
- **Tablet (md)**: 2-column KPI grid, 1-column chart grid
- **Mobile (sm)**: 1-column layout for all

**Chart Responsiveness**:
- All charts use `ResponsiveContainer` from Recharts
- Charts adapt to container width
- Heatmap has horizontal scroll on small screens

## Data Flow

```
User Action (Filter Change)
    ↓
Debounce (300ms for term search)
    ↓
Update Filter State
    ↓
TanStack Query Refetch
    ↓
API Call with Filters
    ↓
Backend Analytics Service
    ↓
MongoDB Aggregation
    ↓
Response Data
    ↓
Chart Components Update
```

## API Endpoints Used

1. `GET /api/budget-analytics/:projectId/kpis` - KPI summary
2. `GET /api/budget-analytics/:projectId/monthly-spend` - Monthly spend data
3. `GET /api/budget-analytics/:projectId/cumulative-spend` - Cumulative data
4. `GET /api/budget-analytics/:projectId/spend-distribution` - Distribution data
5. `GET /api/budget-analytics/:projectId/budgeted-vs-spent` - Aircraft type comparison
6. `GET /api/budget-analytics/:projectId/top-overspend` - Top overspend terms
7. `GET /api/budget-analytics/:projectId/heatmap` - Heatmap data

## Performance Optimizations

### Caching
- TanStack Query caching with 5-minute stale time
- Prevents unnecessary API calls
- Automatic cache invalidation on data changes

### Debouncing
- Term search debounced to 300ms
- Reduces API calls during typing
- Improves performance and user experience

### Memoization
- Filter object memoized to prevent unnecessary re-renders
- Only updates when filter values actually change

### Progressive Loading
- Critical data loads first
- Non-critical data loads later
- Improves perceived performance

## Usage Examples

### Accessing the Page

```typescript
// From project detail page
navigate(`/budget-projects/${projectId}/analytics`);

// Direct URL
/budget-projects/507f1f77bcf86cd799439011/analytics
```

### Filtering Data

```typescript
// Apply date range filter
setFilters({
  startDate: '2025-01-01',
  endDate: '2025-03-31',
  aircraftType: '',
  termSearch: '',
});

// Apply aircraft type filter
setFilters({
  ...filters,
  aircraftType: 'A330',
});

// Apply term search (debounced)
setFilters({
  ...filters,
  termSearch: 'maintenance',
});
```

## Troubleshooting

### Charts Not Displaying

**Issue**: Charts show "No data available"

**Solutions**:
1. Check if project has actual spend data
2. Verify filters are not too restrictive
3. Check API responses in Network tab
4. Verify backend analytics service is running

### Filters Not Working

**Issue**: Changing filters doesn't update charts

**Solutions**:
1. Check if debounce is working (wait 300ms for term search)
2. Verify filter state is updating
3. Check TanStack Query cache invalidation
4. Verify API endpoints accept filter parameters

### Performance Issues

**Issue**: Page loads slowly

**Solutions**:
1. Check if progressive loading is working
2. Verify TanStack Query caching is enabled
3. Check if backend aggregations are optimized
4. Consider reducing data volume with filters

## Testing Checklist

### Functional Testing
- [ ] Navigate to analytics page from project detail
- [ ] Verify all 6 KPI cards display correct values
- [ ] Test date range filter updates charts
- [ ] Test aircraft type filter updates charts
- [ ] Test term search with debouncing
- [ ] Verify progressive loading order
- [ ] Test with empty data (no actuals)
- [ ] Test with large datasets (100+ terms)

### Visual Testing
- [ ] Verify all charts render correctly
- [ ] Check color schemes are consistent
- [ ] Verify tooltips display properly
- [ ] Check legends are readable
- [ ] Verify responsive behavior on mobile/tablet

### Performance Testing
- [ ] Measure initial load time
- [ ] Verify progressive loading works
- [ ] Check filter response time
- [ ] Verify debouncing reduces API calls
- [ ] Test with large datasets

## Future Enhancements

### Planned Features
1. **PDF Export** (Task 17)
   - Export all charts and KPIs to PDF
   - Multi-page layout
   - High-resolution charts

2. **Chart Export**
   - Export individual charts as PNG/SVG
   - Download chart data as CSV

3. **Comparison Mode**
   - Compare multiple periods
   - Year-over-year comparison
   - Budget vs actual trends

4. **Drill-Down**
   - Click on chart elements to see details
   - Navigate to specific terms or periods
   - Show related transactions

5. **Custom Date Presets**
   - YTD (Year to Date)
   - Last Quarter
   - Last 6 Months
   - Custom ranges

## Related Documentation

- [Budget Projects Requirements](../.kiro/specs/budget-cost-revamp/requirements.md)
- [Budget Projects Design](../.kiro/specs/budget-cost-revamp/design.md)
- [Budget Projects Tasks](../.kiro/specs/budget-cost-revamp/tasks.md)
- [Task 16 Completion Summary](../frontend/src/pages/budget/TASK-16-COMPLETE.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the implementation in `BudgetAnalyticsPage.tsx`
3. Check chart components in `frontend/src/components/budget/charts/`
4. Review analytics hook in `frontend/src/hooks/useBudgetAnalytics.ts`
