import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

/**
 * Data Quality Metrics for AOG Analytics
 * Requirements: FR-1.3
 */
export interface AOGDataQualityMetrics {
  totalEvents: number;
  eventsWithMilestones: number;
  completenessPercentage: number;
  legacyEventCount: number;
}

interface AOGDataQualityIndicatorProps {
  totalEvents: number;
  eventsWithMilestones: number;
  className?: string;
  isLoading?: boolean;
}

/**
 * AOG Data Quality Indicator Component
 * 
 * Displays data completeness score for AOG events based on milestone timestamps.
 * An event is considered "complete" if it has:
 * - reportedAt (or detectedAt as fallback)
 * - installationCompleteAt
 * - upAndRunningAt (or clearedAt as fallback)
 * 
 * Color coding:
 * - Green (>80%): Good data quality
 * - Amber (50-80%): Moderate data quality
 * - Red (<50%): Poor data quality
 * 
 * Requirements: FR-1.3
 */
export function AOGDataQualityIndicator({
  totalEvents,
  eventsWithMilestones,
  className = '',
  isLoading = false,
}: AOGDataQualityIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate completeness percentage
  const completenessPercentage = totalEvents > 0 
    ? (eventsWithMilestones / totalEvents) * 100 
    : 0;
  
  const legacyEventCount = totalEvents - eventsWithMilestones;

  // Loading state
  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 ${className}`}>
        <div className="animate-pulse bg-muted h-4 w-4 rounded-full" />
        <div className="animate-pulse bg-muted h-3 w-24 rounded" />
      </div>
    );
  }

  // No data case
  if (totalEvents === 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground ${className}`}>
        <Database className="w-4 h-4" />
        <span className="text-xs font-medium">No AOG data</span>
      </div>
    );
  }

  // Determine badge configuration based on completeness percentage
  const badgeConfig = completenessPercentage > 80
    ? {
        bgColor: 'bg-green-500 dark:bg-green-600',
        textColor: 'text-white',
        icon: CheckCircle,
        label: `${completenessPercentage.toFixed(0)}% Complete`,
        status: 'good' as const,
      }
    : completenessPercentage >= 50
      ? {
          bgColor: 'bg-amber-500 dark:bg-amber-600',
          textColor: 'text-white',
          icon: AlertTriangle,
          label: `${completenessPercentage.toFixed(0)}% Complete`,
          status: 'moderate' as const,
        }
      : {
          bgColor: 'bg-red-500 dark:bg-red-600',
          textColor: 'text-white',
          icon: AlertTriangle,
          label: `${completenessPercentage.toFixed(0)}% Complete`,
          status: 'poor' as const,
        };

  const StatusIcon = badgeConfig.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Badge button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all shadow-sm ${badgeConfig.bgColor} ${badgeConfig.textColor} hover:opacity-90`}
        aria-label="Data quality indicator"
        aria-expanded={isExpanded}
      >
        <StatusIcon className="w-4 h-4" />
        <span className="text-xs font-medium">{badgeConfig.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded tooltip/dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">AOG Data Quality</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Database className="w-3 h-3" />
                  {totalEvents} events
                </div>
              </div>

              {/* Status message */}
              {badgeConfig.status === 'good' && (
                <div className="flex items-start gap-2 p-2 mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">
                      Excellent data quality
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Most events have complete milestone data for accurate analytics
                    </p>
                  </div>
                </div>
              )}

              {badgeConfig.status === 'moderate' && (
                <div className="flex items-start gap-2 p-2 mb-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Moderate data quality
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Some events lack milestone data, limiting analytics accuracy
                    </p>
                  </div>
                </div>
              )}

              {badgeConfig.status === 'poor' && (
                <div className="flex items-start gap-2 p-2 mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Poor data quality
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Many events lack milestone data, significantly limiting analytics
                    </p>
                  </div>
                </div>
              )}

              {/* Statistics */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Events with milestones</span>
                  <span className="font-medium text-foreground">
                    {eventsWithMilestones} / {totalEvents}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Legacy events (no milestones)</span>
                  <span className="font-medium text-foreground">
                    {legacyEventCount}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completenessPercentage}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                      badgeConfig.status === 'good'
                        ? 'bg-green-500'
                        : badgeConfig.status === 'moderate'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Explanation */}
              <div className="p-2 rounded-lg bg-muted/50 mb-3">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">What are milestones?</p>
                    <p className="leading-relaxed">
                      Complete events have milestone timestamps (reportedAt, installationCompleteAt, 
                      upAndRunningAt) that enable three-bucket downtime analysis. Legacy events only 
                      show total downtime.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action link */}
              {legacyEventCount > 0 && (
                <div className="pt-3 border-t border-border">
                  <a
                    href="/aog/list"
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Update events with milestone data
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
          aria-label="Close data quality indicator"
        />
      )}
    </div>
  );
}

export default AOGDataQualityIndicator;
