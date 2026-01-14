import { motion } from 'framer-motion';
import { BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import type { ThreeBucketBreakdown } from '@/types';

/**
 * Color palette for the three buckets
 * - Technical: Blue (troubleshooting and installation work)
 * - Procurement: Amber (waiting for parts)
 * - Ops: Green (operational testing)
 */
const BUCKET_COLORS = {
  technical: '#3b82f6',    // Blue
  procurement: '#f59e0b',  // Amber
  ops: '#10b981',          // Green
};

interface ThreeBucketChartProps {
  data: ThreeBucketBreakdown;
  isLoading?: boolean;
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
 * Requirements: 5.3, 6.2
 */
export function ThreeBucketChart({ data, isLoading }: ThreeBucketChartProps) {
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
  ].filter(item => item.value > 0); // Only show buckets with data

  const hasData = barChartData.some(item => item.hours > 0);

  if (isLoading) {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart - Hours Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Downtime by Category (Hours)
        </h3>
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
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Downtime Distribution
        </h3>
        {pieChartData.length > 0 ? (
          <div className="h-[300px]">
            <PieChartWrapper 
              data={pieChartData} 
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
                Technical: {data.technical.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: BUCKET_COLORS.procurement }} 
              />
              <span className="text-sm text-muted-foreground">
                Procurement: {data.procurement.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: BUCKET_COLORS.ops }} 
              />
              <span className="text-sm text-muted-foreground">
                Ops: {data.ops.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </motion.div>
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
