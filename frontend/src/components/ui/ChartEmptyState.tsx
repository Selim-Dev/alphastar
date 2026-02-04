import { ReactNode } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Filter,
  Database,
  AlertCircle,
  Info,
} from 'lucide-react';

interface ChartEmptyStateProps {
  /** Title of the empty state */
  title?: string;
  /** Description/message to display */
  message?: string;
  /** Type of chart (affects icon and default messaging) */
  chartType?: 'bar' | 'pie' | 'line' | 'heatmap' | 'gauge' | 'generic';
  /** Reason for empty state */
  reason?: 'no-data' | 'no-results' | 'filters' | 'legacy-data' | 'error';
  /** Custom icon to display */
  icon?: ReactNode;
  /** Action button or element */
  action?: ReactNode;
  /** Additional help text */
  helpText?: string;
  /** Custom className */
  className?: string;
}

/**
 * ChartEmptyState - Empty state component for charts with no data
 * 
 * Provides user-friendly messaging when charts have no data to display,
 * with context-aware icons and messages based on the reason.
 * 
 * Usage:
 * ```tsx
 * {data.length === 0 ? (
 *   <ChartEmptyState
 *     chartType="bar"
 *     reason="filters"
 *     message="No events match your current filters"
 *   />
 * ) : (
 *   <BarChart data={data} />
 * )}
 * ```
 */
export function ChartEmptyState({
  title,
  message,
  chartType = 'generic',
  reason = 'no-data',
  icon,
  action,
  helpText,
  className = '',
}: ChartEmptyStateProps) {
  // Get default icon based on chart type
  const getDefaultIcon = () => {
    if (icon) return icon;

    switch (chartType) {
      case 'bar':
        return <BarChart3 className="w-12 h-12 text-muted-foreground/50" />;
      case 'pie':
        return <PieChart className="w-12 h-12 text-muted-foreground/50" />;
      case 'line':
        return <TrendingUp className="w-12 h-12 text-muted-foreground/50" />;
      case 'heatmap':
        return <Calendar className="w-12 h-12 text-muted-foreground/50" />;
      case 'gauge':
        return <TrendingUp className="w-12 h-12 text-muted-foreground/50" />;
      default:
        return <Database className="w-12 h-12 text-muted-foreground/50" />;
    }
  };

  // Get default title based on reason
  const getDefaultTitle = () => {
    if (title) return title;

    switch (reason) {
      case 'no-results':
        return 'No Results Found';
      case 'filters':
        return 'No Data Matches Filters';
      case 'legacy-data':
        return 'Limited Data Available';
      case 'error':
        return 'Unable to Display Data';
      case 'no-data':
      default:
        return 'No Data Available';
    }
  };

  // Get default message based on reason
  const getDefaultMessage = () => {
    if (message) return message;

    switch (reason) {
      case 'no-results':
        return 'Your search or query returned no results. Try adjusting your criteria.';
      case 'filters':
        return 'No data matches your current filter selection. Try adjusting or clearing filters.';
      case 'legacy-data':
        return 'This chart requires milestone timestamp data. Legacy events without milestones cannot be displayed here.';
      case 'error':
        return 'There was an error loading the data for this chart. Please try again.';
      case 'no-data':
      default:
        return 'There is no data available for the selected time period.';
    }
  };

  // Get icon for reason indicator
  const getReasonIcon = () => {
    switch (reason) {
      case 'filters':
        return <Filter className="w-4 h-4" />;
      case 'legacy-data':
        return <Info className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const reasonIcon = getReasonIcon();

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center min-h-[300px] ${className}`}
    >
      {/* Main Icon */}
      <div className="mb-4">{getDefaultIcon()}</div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {getDefaultTitle()}
      </h3>

      {/* Message */}
      <p className="text-sm text-muted-foreground max-w-md mb-4">
        {getDefaultMessage()}
      </p>

      {/* Reason Badge (for specific reasons) */}
      {reasonIcon && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-xs text-muted-foreground mb-4">
          {reasonIcon}
          <span>
            {reason === 'filters' && 'Active Filters'}
            {reason === 'legacy-data' && 'Legacy Data'}
            {reason === 'error' && 'Error'}
          </span>
        </div>
      )}

      {/* Action Button/Element */}
      {action && <div className="mb-4">{action}</div>}

      {/* Help Text */}
      {helpText && (
        <p className="text-xs text-muted-foreground max-w-sm">{helpText}</p>
      )}
    </div>
  );
}

/**
 * ChartNoDataState - Shorthand for no-data empty state
 */
export function ChartNoDataState({
  chartType = 'generic',
  message,
}: {
  chartType?: ChartEmptyStateProps['chartType'];
  message?: string;
}) {
  return (
    <ChartEmptyState
      chartType={chartType}
      reason="no-data"
      message={message}
    />
  );
}

/**
 * ChartFilterEmptyState - Shorthand for filter-based empty state
 */
export function ChartFilterEmptyState({
  chartType = 'generic',
  onClearFilters,
}: {
  chartType?: ChartEmptyStateProps['chartType'];
  onClearFilters?: () => void;
}) {
  return (
    <ChartEmptyState
      chartType={chartType}
      reason="filters"
      action={
        onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        )
      }
      helpText="Try selecting a different date range or removing some filters."
    />
  );
}

/**
 * ChartLegacyDataState - Shorthand for legacy data limitation
 */
export function ChartLegacyDataState({
  chartType = 'generic',
  legacyCount,
  totalCount,
}: {
  chartType?: ChartEmptyStateProps['chartType'];
  legacyCount?: number;
  totalCount?: number;
}) {
  const percentage =
    legacyCount && totalCount ? ((legacyCount / totalCount) * 100).toFixed(0) : null;

  return (
    <ChartEmptyState
      chartType={chartType}
      reason="legacy-data"
      message={
        percentage
          ? `${percentage}% of events (${legacyCount} of ${totalCount}) lack milestone timestamps required for this visualization.`
          : 'This chart requires milestone timestamp data. Legacy events without milestones cannot be displayed here.'
      }
      helpText="Update recent events with milestone data (reportedAt, procurementRequestedAt, etc.) to see detailed analytics."
    />
  );
}

/**
 * ChartErrorState - Shorthand for error state
 */
export function ChartErrorState({
  chartType = 'generic',
  error,
  onRetry,
}: {
  chartType?: ChartEmptyStateProps['chartType'];
  error?: Error;
  onRetry?: () => void;
}) {
  return (
    <ChartEmptyState
      chartType={chartType}
      reason="error"
      message={error?.message || 'An unexpected error occurred while loading this chart.'}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        )
      }
      helpText="If the problem persists, please refresh the page or contact support."
    />
  );
}

/**
 * ChartLoadingState - Loading state with message (alternative to skeleton)
 */
export function ChartLoadingState({
  message = 'Loading chart data...',
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center min-h-[300px]">
      <div className="w-12 h-12 mb-4 border-4 border-muted border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
