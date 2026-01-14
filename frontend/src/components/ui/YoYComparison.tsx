import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import type { YoYComparisonResponse, YoYMetric } from '@/types';

interface YoYComparisonProps {
  data?: YoYComparisonResponse;
  isLoading?: boolean;
  className?: string;
}

function MetricRow({
  metric,
  index,
}: {
  metric: YoYMetric;
  index: number;
}) {
  const TrendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  
  // Determine color based on whether the change is favorable
  const trendColor = metric.trend === 'flat' 
    ? 'text-muted-foreground' 
    : metric.favorable 
      ? 'text-green-500' 
      : 'text-red-500';

  const bgColor = metric.trend === 'flat'
    ? 'bg-muted/30'
    : metric.favorable
      ? 'bg-green-500/5'
      : 'bg-red-500/5';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-between p-3 rounded-lg ${bgColor}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{metric.name}</p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Previous Year */}
        <div className="text-right w-20">
          <p className="text-xs text-muted-foreground">Previous</p>
          <p className="text-sm font-medium text-muted-foreground">
            {formatValue(metric.previousYear, metric.name)}
          </p>
        </div>
        
        {/* Current Year */}
        <div className="text-right w-20">
          <p className="text-xs text-muted-foreground">Current</p>
          <p className="text-sm font-bold text-foreground">
            {formatValue(metric.currentYear, metric.name)}
          </p>
        </div>
        
        {/* Change */}
        <div className={`flex items-center gap-1 w-24 justify-end ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function formatValue(value: number, metricName: string): string {
  // Format based on metric type
  const lowerName = metricName.toLowerCase();
  
  if (lowerName.includes('availability') || lowerName.includes('reliability') || lowerName.includes('%')) {
    return `${value.toFixed(1)}%`;
  }
  
  if (lowerName.includes('cost')) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
  
  if (lowerName.includes('hours')) {
    return `${value.toLocaleString()} hrs`;
  }
  
  return value.toLocaleString();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="animate-pulse bg-muted h-4 w-32 rounded" />
          <div className="flex items-center gap-4">
            <div className="animate-pulse bg-muted h-8 w-16 rounded" />
            <div className="animate-pulse bg-muted h-8 w-16 rounded" />
            <div className="animate-pulse bg-muted h-4 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function YoYComparison({
  data,
  isLoading,
  className = '',
}: YoYComparisonProps) {
  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="animate-pulse h-5 w-40 bg-muted rounded" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Handle no historical data case
  if (!data || !data.hasHistoricalData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Year-over-Year Comparison</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No historical data</p>
            <p className="text-xs mt-1">Year-over-year comparison requires data from the previous year</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Count favorable vs unfavorable changes
  const favorableCount = data.metrics.filter(m => m.favorable && m.trend !== 'flat').length;
  const unfavorableCount = data.metrics.filter(m => !m.favorable && m.trend !== 'flat').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Year-over-Year Comparison</h3>
            <p className="text-xs text-muted-foreground">
              {data.currentPeriod.year} vs {data.previousPeriod.year}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {favorableCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">
              {favorableCount} improved
            </span>
          )}
          {unfavorableCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 font-medium">
              {unfavorableCount} declined
            </span>
          )}
        </div>
      </div>
      
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-b border-border mb-2">
        <span>Metric</span>
        <div className="flex items-center gap-4">
          <span className="w-20 text-right">{data.previousPeriod.year}</span>
          <span className="w-20 text-right">{data.currentPeriod.year}</span>
          <span className="w-24 text-right">Change</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {data.metrics.map((metric, index) => (
          <MetricRow
            key={metric.name}
            metric={metric}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default YoYComparison;
