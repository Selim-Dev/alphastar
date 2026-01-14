import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Info,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import type { DataQualityResponse } from '@/types';

interface DataQualityIndicatorProps {
  data?: DataQualityResponse;
  isLoading?: boolean;
  className?: string;
}

function formatLastUpdate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CoverageBar({ 
  label, 
  percentage, 
  total, 
  withData 
}: { 
  label: string; 
  percentage: number; 
  total: number; 
  withData: number;
}) {
  const isGood = percentage >= 90;
  const isWarning = percentage >= 70 && percentage < 90;
  
  const barColor = isGood 
    ? 'bg-green-500' 
    : isWarning 
      ? 'bg-amber-500' 
      : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {withData}/{total} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${barColor} rounded-full`}
        />
      </div>
    </div>
  );
}

export function DataQualityIndicator({
  data,
  isLoading,
  className = '',
}: DataQualityIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 ${className}`}>
        <div className="animate-pulse bg-muted h-4 w-4 rounded-full" />
        <div className="animate-pulse bg-muted h-3 w-20 rounded" />
      </div>
    );
  }

  // Handle no data case - show unknown status
  if (!data) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground ${className}`}>
        <Database className="w-4 h-4" />
        <span className="text-xs font-medium">Data status unknown</span>
      </div>
    );
  }

  const isHealthy = !data.isStale && data.warnings.length === 0;
  const hasWarnings = data.warnings.length > 0;

  // Badge styling based on status
  const badgeConfig = data.isStale
    ? {
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
        icon: AlertTriangle,
        label: 'Stale Data',
      }
    : hasWarnings
      ? {
          bgColor: 'bg-amber-500/10',
          textColor: 'text-amber-500',
          icon: AlertTriangle,
          label: 'Data Warnings',
        }
      : {
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-500',
          icon: CheckCircle,
          label: 'Data Fresh',
        };

  const StatusIcon = badgeConfig.icon;

  return (
    <div className={`relative ${className}`}>
      {/* Badge button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${badgeConfig.bgColor} ${badgeConfig.textColor} hover:opacity-80`}
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
            className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Data Quality</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatLastUpdate(data.lastUpdate)}
                </div>
              </div>

              {/* Stale data warning */}
              {data.isStale && (
                <div className="flex items-start gap-2 p-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-500">Data is stale</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last update was more than 24 hours ago
                    </p>
                  </div>
                </div>
              )}

              {/* Coverage bars */}
              <div className="space-y-3 mb-3">
                <CoverageBar
                  label="Daily Status"
                  percentage={data.coverage.dailyStatus.percentage}
                  total={data.coverage.dailyStatus.total}
                  withData={data.coverage.dailyStatus.withData}
                />
                <CoverageBar
                  label="Utilization"
                  percentage={data.coverage.utilization.percentage}
                  total={data.coverage.utilization.total}
                  withData={data.coverage.utilization.withData}
                />
              </div>

              {/* Missing aircraft */}
              {data.missingAircraft.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1">Missing data for:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.missingAircraft.slice(0, 5).map((reg) => (
                      <span key={reg} className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono">
                        {reg}
                      </span>
                    ))}
                    {data.missingAircraft.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{data.missingAircraft.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {data.warnings.length > 0 && (
                <div className="space-y-1 mb-3">
                  {data.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <Info className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Resolution guidance */}
              {(data.isStale || data.missingAircraft.length > 0) && (
                <div className="pt-3 border-t border-border">
                  <a
                    href="/import"
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Import data to resolve issues
                  </a>
                </div>
              )}

              {/* All good message */}
              {isHealthy && (
                <div className="flex items-center gap-2 text-xs text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>All data is up to date and complete</span>
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
        />
      )}
    </div>
  );
}

export default DataQualityIndicator;
