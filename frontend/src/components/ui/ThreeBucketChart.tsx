import { motion } from 'framer-motion';
import { BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import { LegacyDataBadge } from '@/components/ui/LegacyDataBadge';
import type { ThreeBucketBreakdown } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

/**
 * Color palette for the three buckets
 * - Technical: Blue (troubleshooting and installation work)
 * - Procurement: Amber (waiting for parts)
 * - Ops: Green (operational testing)
 * - Legacy: Gray (events without milestone data)
 */
const BUCKET_COLORS = {
  technical: '#3b82f6',    // Blue
  procurement: '#f59e0b',  // Amber
  ops: '#10b981',          // Green
  legacy: '#6b7280',       // Gray
};

interface ThreeBucketChartProps {
  data: ThreeBucketBreakdown;
  isLoading?: boolean;
  legacyEventCount?: number;
  totalEventCount?: number;
  legacyDowntimeHours?: number;
}

/**
 * ThreeBucketChart Component
 * 
 * Displays AOG downtime breakdown using the three-bucket model:
 * - Technical Time: Troubleshooting + Installation work
 * - Procurement Time: Waiting for parts
 * - Ops Time: Operational testing
 * 
 * Shows both a bar chart (hours comparison) and pie chart (percentage distribution)
 * 
 * Handles legacy events gracefully:
 * - Shows "Limited Analytics" badge when legacy events are present
 * - Displays legacy downtime in separate category (optional)
 * - Provides tooltips explaining data limitations
 * 
 * Requirements: 5.3, 6.2, FR-1.1, FR-1.2
 */
export function ThreeBucketChart({ 
  data, 
  isLoading,
  legacyEventCount = 0,
  totalEventCount = 0,
  legacyDowntimeHours = 0,
}: ThreeBucketChartProps) {
  const hasLegacyData = legacyEventCount > 0;
  const showLegacyCategory = hasLegacyData && legacyDowntimeHours > 0;

  // Transform data for bar chart
  const barChartData = [
    {
      name: 'Technical',
      hours: data.technical.totalHours,
      average: data.technical.averageHours,
    },
    {
      name: 'Procurement',
      hours: data.procurement.totalHours,
      average: data.procurement.averageHours,
    },
    {
      name: 'Ops',
      hours: data.ops.totalHours,
      average: data.ops.averageHours,
    },
  ];

  // Add legacy category if applicable
  if (showLegacyCategory) {
    barChartData.push({
      name: 'Legacy',
      hours: legacyDowntimeHours,
      average: legacyEventCount > 0 ? legacyDowntimeHours / legacyEventCount : 0,
    });
  }

  // Transform data for pie chart
  const pieChartData = [
    {
      name: 'Technical',
      value: data.technical.totalHours,
      color: BUCKET_COLORS.technical,
    },
    {
      name: 'Procurement',
      value: data.procurement.totalHours,
      color: BUCKET_COLORS.procurement,
    },
    {
      name: 'Ops',
      value: data.ops.totalHours,
      color: BUCKET_COLORS.ops,
    },
  ];

  // Add legacy to pie chart if applicable
  if (showLegacyCategory) {
    pieChartData.push({
      name: 'Legacy',
      value: legacyDowntimeHours,
      color: BUCKET_COLORS.legacy,
    });
  }

  // Filter out zero values for pie chart
  const filteredPieData = pieChartData.filter(item => item.value > 0);

  // Calculate total hours including legacy
  const totalHours = data.technical.totalHours + 
                     data.procurement.totalHours + 
                     data.ops.totalHours + 
                     legacyDowntimeHours;

  const hasData = totalHours > 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-4" />
            <div className="h-[300px] bg-muted rounded" />
          </div>
          <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-48 mb-4" />
            <div className="h-[300px] bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legacy Data Warning Badge */}
      {hasLegacyData && totalEventCount > 0 && (
        <LegacyDataBadge 
          legacyCount={legacyEventCount} 
          totalCount={totalEventCount}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart - Hours Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Downtime by Category (Hours)
          </h3>
          {showLegacyCategory && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Legacy category:</strong> Represents {legacyEventCount} event{legacyEventCount !== 1 ? 's' : ''} 
                    without milestone timestamps. Total downtime is shown, but cannot be broken down 
                    into Technical, Procurement, and Ops time.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {hasData ? (
          <div className="h-[300px]">
            <BarChartWrapper
              data={barChartData}
              xAxisKey="name"
              bars={[
                { dataKey: 'hours', name: 'Total Hours', color: '#3b82f6' },
                { dataKey: 'average', name: 'Avg per Event', color: '#8b5cf6' },
              ]}
            />
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No downtime data available</p>
          </div>
        )}
      </motion.div>

      {/* Pie Chart - Percentage Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Downtime Distribution
          </h3>
          {showLegacyCategory && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Legacy events show total downtime only. For detailed three-bucket breakdown, 
                    update events with milestone timestamps (Reported At, Installation Complete At, etc.).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {filteredPieData.length > 0 ? (
          <div className="h-[300px]">
            <PieChartWrapper 
              data={filteredPieData} 
              innerRadius={50} 
              outerRadius={90} 
            />
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No downtime data available</p>
          </div>
        )}
        
        {/* Percentage Legend */}
        {hasData && (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: BUCKET_COLORS.technical }} 
              />
              <span className="text-sm text-muted-foreground">
                Technical: {totalHours > 0 ? ((data.technical.totalHours / totalHours) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: BUCKET_COLORS.procurement }} 
              />
              <span className="text-sm text-muted-foreground">
                Procurement: {totalHours > 0 ? ((data.procurement.totalHours / totalHours) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: BUCKET_COLORS.ops }} 
              />
              <span className="text-sm text-muted-foreground">
                Ops: {totalHours > 0 ? ((data.ops.totalHours / totalHours) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            {showLegacyCategory && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: BUCKET_COLORS.legacy }} 
                />
                <span className="text-sm text-muted-foreground">
                  Legacy: {totalHours > 0 ? ((legacyDowntimeHours / totalHours) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  </div>
  );
}

/**
 * Bucket Summary Cards Component
 * 
 * Displays summary cards for each bucket showing total and average hours
 * 
 * Requirements: 5.3, 5.4
 */
interface BucketSummaryCardsProps {
  data: ThreeBucketBreakdown;
}

export function BucketSummaryCards({ data }: BucketSummaryCardsProps) {
  const buckets = [
    {
      name: 'Technical Time',
      description: 'Troubleshooting + Installation',
      hours: data.technical.totalHours,
      average: data.technical.averageHours,
      percentage: data.technical.percentage,
      color: BUCKET_COLORS.technical,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      name: 'Procurement Time',
      description: 'Waiting for parts',
      hours: data.procurement.totalHours,
      average: data.procurement.averageHours,
      percentage: data.procurement.percentage,
      color: BUCKET_COLORS.procurement,
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      name: 'Ops Time',
      description: 'Operational testing',
      hours: data.ops.totalHours,
      average: data.ops.averageHours,
      percentage: data.ops.percentage,
      color: BUCKET_COLORS.ops,
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {buckets.map((bucket, index) => (
        <motion.div
          key={bucket.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`${bucket.bgColor} border border-border rounded-lg p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: bucket.color }} 
            />
            <p className={`text-sm font-medium ${bucket.textColor}`}>
              {bucket.name}
            </p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {bucket.hours.toFixed(1)} hrs
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {bucket.description}
          </p>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Avg: {bucket.average.toFixed(1)} hrs/event</span>
            <span className={bucket.textColor}>{bucket.percentage.toFixed(1)}%</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default ThreeBucketChart;
