# Error Handling and Loading States Guide

## Overview

This guide explains how to use the new error handling and loading state components for the AOG Analytics Enhancement feature. These components ensure robust, user-friendly behavior when data is loading, missing, or errors occur.

## Components

### 1. ChartSkeleton

**Purpose**: Display animated loading placeholders while chart data is being fetched.

**Location**: `frontend/src/components/ui/ChartSkeleton.tsx`

**Variants**:
- `ChartSkeleton` - Generic chart skeleton
- `ChartSkeletonGrid` - Grid of multiple chart skeletons
- `PieChartSkeleton` - Specialized for pie/donut charts
- `HeatmapSkeleton` - Specialized for heatmap visualizations
- `GaugeSkeleton` - Specialized for gauge/radial charts

**Usage Examples**:

```tsx
import { ChartSkeleton, ChartSkeletonGrid, PieChartSkeleton } from '@/components/ui/ChartSkeleton';

// Single chart loading
{isLoading ? (
  <ChartSkeleton height={300} showTitle={true} showLegend={false} />
) : (
  <MyChart data={data} />
)}

// Multiple charts loading
{isLoading ? (
  <ChartSkeletonGrid count={2} columns={2} height={350} />
) : (
  <div className="grid grid-cols-2 gap-6">
    <Chart1 data={data1} />
    <Chart2 data={data2} />
  </div>
)}

// Pie chart loading
{isLoading ? (
  <PieChartSkeleton showTitle={true} showLegend={true} />
) : (
  <PieChart data={data} />
)}
```

**Props**:

```typescript
// ChartSkeleton
interface ChartSkeletonProps {
  height?: number;          // Default: 300
  showTitle?: boolean;      // Default: true
  showLegend?: boolean;     // Default: false
  className?: string;
}

// ChartSkeletonGrid
interface ChartSkeletonGridProps {
  count?: number;           // Default: 2
  columns?: number;         // Default: 2 (1, 2, 3, or 4)
  height?: number;          // Default: 300
}
```

---

### 2. AnalyticsSectionErrorBoundary

**Purpose**: Catch and handle errors in individual analytics sections without breaking the entire page.

**Location**: `frontend/src/components/ui/AnalyticsSectionErrorBoundary.tsx`

**Features**:
- Graceful error handling per section
- User-friendly error messages
- Retry functionality
- Development mode error details
- Custom fallback support

**Usage Examples**:

```tsx
import { AnalyticsSectionErrorBoundary } from '@/components/ui/AnalyticsSectionErrorBoundary';

// Basic usage
<AnalyticsSectionErrorBoundary sectionName="Three-Bucket Analysis">
  <ThreeBucketChart data={data} />
</AnalyticsSectionErrorBoundary>

// With custom error handler
<AnalyticsSectionErrorBoundary 
  sectionName="Monthly Trend"
  onError={(error, errorInfo) => {
    console.error('Chart error:', error);
    // Send to error tracking service
  }}
>
  <MonthlyTrendChart data={data} />
</AnalyticsSectionErrorBoundary>

// With custom fallback
<AnalyticsSectionErrorBoundary 
  sectionName="Cost Analysis"
  fallback={
    <div className="p-8 text-center">
      <p>Unable to load cost analysis</p>
      <button onClick={handleRetry}>Retry</button>
    </div>
  }
>
  <CostAnalysisChart data={data} />
</AnalyticsSectionErrorBoundary>
```

**Props**:

```typescript
interface AnalyticsSectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;           // Name shown in error message
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: ReactNode;           // Custom error UI
}
```

**HOC Usage**:

```tsx
import { withAnalyticsErrorBoundary } from '@/components/ui/AnalyticsSectionErrorBoundary';

// Wrap a component with error boundary
const SafeChart = withAnalyticsErrorBoundary(MyChart, 'My Chart');

// Use it
<SafeChart data={data} />
```

---

### 3. ChartEmptyState

**Purpose**: Display user-friendly messages when charts have no data to show.

**Location**: `frontend/src/components/ui/ChartEmptyState.tsx`

**Variants**:
- `ChartEmptyState` - Generic empty state with full customization
- `ChartNoDataState` - Shorthand for no-data scenarios
- `ChartFilterEmptyState` - Shorthand for filter-based empty states
- `ChartLegacyDataState` - Shorthand for legacy data limitations
- `ChartErrorState` - Shorthand for error states
- `ChartLoadingState` - Alternative to skeleton (with spinner)

**Usage Examples**:

```tsx
import { 
  ChartEmptyState,
  ChartFilterEmptyState,
  ChartLegacyDataState,
  ChartErrorState 
} from '@/components/ui/ChartEmptyState';

// Generic empty state
{data.length === 0 && (
  <ChartEmptyState
    chartType="bar"
    reason="no-data"
    message="No events in selected period"
  />
)}

// Filter-based empty state with clear action
{filteredData.length === 0 && (
  <ChartFilterEmptyState
    chartType="line"
    onClearFilters={() => setFilters({})}
  />
)}

// Legacy data limitation
{legacyCount > 0 && (
  <ChartLegacyDataState
    chartType="heatmap"
    legacyCount={legacyCount}
    totalCount={totalCount}
  />
)}

// Error state with retry
{error && (
  <ChartErrorState
    chartType="pie"
    error={error}
    onRetry={() => refetch()}
  />
)}
```

**Props**:

```typescript
interface ChartEmptyStateProps {
  title?: string;                 // Custom title
  message?: string;               // Custom message
  chartType?: 'bar' | 'pie' | 'line' | 'heatmap' | 'gauge' | 'generic';
  reason?: 'no-data' | 'no-results' | 'filters' | 'legacy-data' | 'error';
  icon?: ReactNode;               // Custom icon
  action?: ReactNode;             // Action button/element
  helpText?: string;              // Additional help text
  className?: string;
}
```

**Reason Types**:

| Reason | Default Title | Default Message | Icon |
|--------|--------------|-----------------|------|
| `no-data` | No Data Available | There is no data available for the selected time period | Database |
| `no-results` | No Results Found | Your search or query returned no results | Database |
| `filters` | No Data Matches Filters | No data matches your current filter selection | Filter |
| `legacy-data` | Limited Data Available | This chart requires milestone timestamp data | Info |
| `error` | Unable to Display Data | There was an error loading the data for this chart | AlertCircle |

---

## Complete Integration Example

Here's a complete example showing how to integrate all three components:

```tsx
import { useState } from 'react';
import { 
  ChartSkeleton,
  AnalyticsSectionErrorBoundary,
  ChartFilterEmptyState 
} from '@/components/ui';
import { useMonthlyTrend } from '@/hooks/useAOGEvents';

function MonthlyTrendSection({ filters }) {
  const { data, isLoading, error, refetch } = useMonthlyTrend(filters);

  return (
    <AnalyticsSectionErrorBoundary 
      sectionName="Monthly Trend Analysis"
      onError={(error) => console.error('Trend chart error:', error)}
    >
      <div id="monthly-trend-section">
        {isLoading ? (
          <ChartSkeleton height={350} showTitle={true} showLegend={true} />
        ) : !data || data.length === 0 ? (
          <ChartFilterEmptyState
            chartType="line"
            onClearFilters={() => {
              // Clear filters logic
            }}
          />
        ) : (
          <MonthlyTrendChart data={data} />
        )}
      </div>
    </AnalyticsSectionErrorBoundary>
  );
}
```

---

## Best Practices

### 1. Always Wrap Chart Sections

Wrap each major chart section with `AnalyticsSectionErrorBoundary`:

```tsx
// ✅ Good - Each section isolated
<AnalyticsSectionErrorBoundary sectionName="Three-Bucket Analysis">
  <ThreeBucketChart data={data} />
</AnalyticsSectionErrorBoundary>

<AnalyticsSectionErrorBoundary sectionName="Trend Analysis">
  <TrendChart data={data} />
</AnalyticsSectionErrorBoundary>

// ❌ Bad - One error breaks everything
<div>
  <ThreeBucketChart data={data} />
  <TrendChart data={data} />
</div>
```

### 2. Use Appropriate Loading States

Match the skeleton to the chart type:

```tsx
// ✅ Good - Matches chart type
{isLoading ? (
  <PieChartSkeleton showLegend={true} />
) : (
  <PieChart data={data} />
)}

// ❌ Bad - Generic skeleton for specific chart
{isLoading ? (
  <ChartSkeleton />
) : (
  <PieChart data={data} />
)}
```

### 3. Provide Clear Empty States

Give users actionable information:

```tsx
// ✅ Good - Clear message with action
<ChartFilterEmptyState
  chartType="bar"
  onClearFilters={handleClearFilters}
/>

// ❌ Bad - Generic message
<div>No data</div>
```

### 4. Handle Legacy Data Gracefully

Inform users about data limitations:

```tsx
// ✅ Good - Explains limitation
{legacyCount > 0 && (
  <ChartLegacyDataState
    legacyCount={legacyCount}
    totalCount={totalCount}
  />
)}

// ❌ Bad - Silent failure
{data.length === 0 && <div>No data</div>}
```

### 5. Add Section IDs for PDF Export

Include section IDs for PDF export functionality:

```tsx
<AnalyticsSectionErrorBoundary sectionName="Three-Bucket Analysis">
  <div id="three-bucket-section">
    {/* Chart content */}
  </div>
</AnalyticsSectionErrorBoundary>
```

---

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { ChartEmptyState } from '@/components/ui/ChartEmptyState';

describe('ChartEmptyState', () => {
  it('renders no-data state correctly', () => {
    render(<ChartEmptyState reason="no-data" />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('renders filter state with action', () => {
    const handleClear = jest.fn();
    render(
      <ChartFilterEmptyState onClearFilters={handleClear} />
    );
    const button = screen.getByText(/clear filters/i);
    expect(button).toBeInTheDocument();
  });
});
```

### Integration Tests

```tsx
import { render, waitFor, screen } from '@testing-library/react';
import { AnalyticsSectionErrorBoundary } from '@/components/ui/AnalyticsSectionErrorBoundary';

describe('AnalyticsSectionErrorBoundary', () => {
  it('catches errors and displays fallback', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <AnalyticsSectionErrorBoundary sectionName="Test Section">
        <ThrowError />
      </AnalyticsSectionErrorBoundary>
    );

    expect(screen.getByText(/unable to load test section/i)).toBeInTheDocument();
  });
});
```

---

## Performance Considerations

### 1. Skeleton Animation

Skeletons use `framer-motion` for smooth animations. For better performance:

```tsx
// Reduce animation complexity for many skeletons
<ChartSkeletonGrid count={10} /> // Automatically optimized
```

### 2. Error Boundary Overhead

Error boundaries have minimal overhead. Use them liberally:

```tsx
// ✅ Good - Multiple boundaries
<AnalyticsSectionErrorBoundary sectionName="Section 1">
  <Chart1 />
</AnalyticsSectionErrorBoundary>
<AnalyticsSectionErrorBoundary sectionName="Section 2">
  <Chart2 />
</AnalyticsSectionErrorBoundary>
```

### 3. Empty State Rendering

Empty states are lightweight. No performance concerns.

---

## Accessibility

All components follow WCAG AA guidelines:

- **Color Contrast**: All text meets 4.5:1 contrast ratio
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators

---

## Migration Guide

### From Old Pattern to New Pattern

**Before**:
```tsx
function MyChart({ data, isLoading }) {
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;
  return <Chart data={data} />;
}
```

**After**:
```tsx
import { 
  ChartSkeleton, 
  AnalyticsSectionErrorBoundary,
  ChartEmptyState 
} from '@/components/ui';

function MyChart({ data, isLoading }) {
  return (
    <AnalyticsSectionErrorBoundary sectionName="My Chart">
      {isLoading ? (
        <ChartSkeleton height={300} />
      ) : !data || data.length === 0 ? (
        <ChartEmptyState reason="no-data" />
      ) : (
        <Chart data={data} />
      )}
    </AnalyticsSectionErrorBoundary>
  );
}
```

---

## Troubleshooting

### Issue: Error boundary not catching errors

**Solution**: Ensure the error is thrown during render, not in event handlers:

```tsx
// ❌ Won't be caught
<button onClick={() => { throw new Error('Error'); }}>Click</button>

// ✅ Will be caught
const Component = () => {
  throw new Error('Error');
  return <div>Content</div>;
};
```

### Issue: Skeleton doesn't match chart size

**Solution**: Pass explicit height to skeleton:

```tsx
<ChartSkeleton height={350} /> // Match your chart height
```

### Issue: Empty state not showing

**Solution**: Check your conditional logic:

```tsx
// ✅ Correct
{!isLoading && data.length === 0 && <ChartEmptyState />}

// ❌ Wrong - shows during loading
{data.length === 0 && <ChartEmptyState />}
```

---

## Related Documentation

- [AOG Analytics Enhancement Design](/.kiro/specs/aog-analytics-enhancement/design.md)
- [AOG Analytics Enhancement Requirements](/.kiro/specs/aog-analytics-enhancement/requirements.md)
- [System Architecture](/.kiro/rules/system-architecture.md)

---

## Support

For questions or issues:
1. Check this guide first
2. Review the component source code
3. Check existing usage in `AOGAnalyticsPageWithErrorHandling.tsx`
4. Contact the development team
