import {
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

interface AutomatedInsight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  metric?: number;
  recommendation?: string;
}

interface InsightsPanelProps {
  insights: AutomatedInsight[];
  isLoading?: boolean;
  onViewAll?: () => void;
}

export function InsightsPanel({ insights, isLoading, onViewAll }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Info className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">No insights available</p>
        <p className="text-xs text-muted-foreground mt-1">
          Insights will appear as patterns are detected in your data
        </p>
      </div>
    );
  }

  // Show maximum 5 insights
  const displayedInsights = insights.slice(0, 5);
  const hasMore = insights.length > 5;

  // Get icon for insight type
  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  };

  // Get color classes for insight type
  const getColorClasses = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: 'text-red-600 dark:text-red-400',
          title: 'text-red-900 dark:text-red-100',
        };
      case 'success':
        return {
          border: 'border-green-200 dark:border-green-800',
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: 'text-green-600 dark:text-green-400',
          title: 'text-green-900 dark:text-green-100',
        };
      default:
        return {
          border: 'border-blue-200 dark:border-blue-800',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          icon: 'text-blue-600 dark:text-blue-400',
          title: 'text-blue-900 dark:text-blue-100',
        };
    }
  };

  return (
    <div className="space-y-4">
      {displayedInsights.map((insight) => {
        const Icon = getIcon(insight.type);
        const colors = getColorClasses(insight.type);

        return (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title and Metric */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`text-sm font-semibold ${colors.title}`}>
                    {insight.title}
                  </h4>
                  {insight.metric !== undefined && (
                    <div className={`text-sm font-bold ${colors.icon} flex-shrink-0`}>
                      {insight.metric.toFixed(1)}
                      {insight.id.includes('percentage') || insight.id.includes('trend') ? '%' : ''}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-foreground/80 mb-3">
                  {insight.description}
                </p>

                {/* Recommendation */}
                {insight.recommendation && (
                  <div className="flex items-start gap-2 mt-3 pt-3 border-t border-current/10">
                    <TrendingUp className="w-4 h-4 text-foreground/60 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground/70">
                      <span className="font-medium">Recommendation:</span>{' '}
                      {insight.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* View All Link */}
      {hasMore && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full py-3 px-4 text-sm font-medium text-primary hover:text-primary/80 bg-muted/50 hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>View All {insights.length} Insights</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Empty state when no insights but not loading */}
      {displayedInsights.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No insights detected for the selected period
          </p>
        </div>
      )}
    </div>
  );
}
