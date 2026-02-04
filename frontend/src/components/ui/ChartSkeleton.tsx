import { motion } from 'framer-motion';
import { Skeleton } from './Skeleton';

interface ChartSkeletonProps {
  height?: number;
  showTitle?: boolean;
  showLegend?: boolean;
  className?: string;
}

/**
 * ChartSkeleton - Loading skeleton for chart components
 * 
 * Displays an animated placeholder while chart data is loading.
 * Matches the visual structure of typical Recharts components.
 */
export function ChartSkeleton({
  height = 300,
  showTitle = true,
  showLegend = false,
  className = '',
}: ChartSkeletonProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      {/* Chart Title */}
      {showTitle && (
        <div className="mb-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
      )}

      {/* Legend (if applicable) */}
      {showLegend && (
        <div className="flex gap-4 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}

      {/* Chart Area */}
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-10" />
          ))}
        </div>

        {/* Chart content area */}
        <div className="ml-14 h-full flex items-end justify-between gap-2">
          {/* Animated bars/lines placeholder */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.5, scaleY: 0 }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scaleY: [0, 1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.1,
              }}
              className="flex-1 bg-muted rounded-t"
              style={{
                height: `${Math.random() * 60 + 40}%`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>

        {/* X-axis labels */}
        <div className="ml-14 mt-2 flex justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ChartSkeletonGrid - Grid of chart skeletons for dashboard loading
 */
export function ChartSkeletonGrid({
  count = 2,
  columns = 2,
  height = 300,
}: {
  count?: number;
  columns?: number;
  height?: number;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 lg:grid-cols-2';

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} height={height} showTitle={true} />
      ))}
    </div>
  );
}

/**
 * PieChartSkeleton - Specialized skeleton for pie/donut charts
 */
export function PieChartSkeleton({
  showTitle = true,
  showLegend = true,
  className = '',
}: {
  showTitle?: boolean;
  showLegend?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      {/* Chart Title */}
      {showTitle && (
        <div className="mb-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
      )}

      <div className="flex items-center justify-center gap-8">
        {/* Pie chart circle */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-48 h-48 rounded-full border-8 border-muted"
            style={{
              borderTopColor: 'hsl(var(--primary))',
              borderRightColor: 'hsl(var(--primary) / 0.6)',
              borderBottomColor: 'hsl(var(--primary) / 0.3)',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * HeatmapSkeleton - Specialized skeleton for heatmap visualizations
 */
export function HeatmapSkeleton({
  rows = 5,
  columns = 12,
  showTitle = true,
  className = '',
}: {
  rows?: number;
  columns?: number;
  showTitle?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      {/* Chart Title */}
      {showTitle && (
        <div className="mb-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
      )}

      {/* Column headers */}
      <div className="flex gap-1 mb-2 ml-24">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1" />
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 items-center">
            {/* Row label */}
            <Skeleton className="h-8 w-20" />
            {/* Cells */}
            {Array.from({ length: columns }).map((_, colIndex) => (
              <motion.div
                key={colIndex}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: (rowIndex * columns + colIndex) * 0.02,
                }}
                className="h-8 flex-1 bg-muted rounded"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Color scale legend */}
      <div className="mt-4 flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <div className="flex-1 h-4 bg-gradient-to-r from-muted via-muted/60 to-muted/30 rounded" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

/**
 * GaugeSkeleton - Specialized skeleton for gauge/radial charts
 */
export function GaugeSkeleton({
  showTitle = true,
  className = '',
}: {
  showTitle?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      {/* Chart Title */}
      {showTitle && (
        <div className="mb-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
      )}

      <div className="flex flex-col items-center">
        {/* Gauge circle */}
        <div className="relative w-48 h-24 overflow-hidden">
          <motion.div
            animate={{ rotate: [0, 180, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full border-8 border-muted"
            style={{
              borderTopColor: 'hsl(var(--primary))',
              borderRightColor: 'hsl(var(--primary) / 0.6)',
            }}
          />
        </div>

        {/* Value */}
        <div className="mt-4 text-center">
          <Skeleton className="h-10 w-24 mx-auto mb-2" />
          <Skeleton className="h-3 w-32 mx-auto" />
        </div>

        {/* Legend */}
        <div className="mt-6 flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
