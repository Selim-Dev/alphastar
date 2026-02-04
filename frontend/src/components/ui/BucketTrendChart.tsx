import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { ChartEmptyState } from '@/components/ui/ChartEmptyState';
import { sampleData } from '@/lib/sampleData';

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

interface BucketTrendDataPoint {
  month: string;
  technicalHours: number;
  procurementHours: number;
  opsHours: number;
}

interface BucketTrendChartProps {
  data: BucketTrendDataPoint[];
  isLoading?: boolean;
}

/**
 * BucketTrendChart Component
 * 
 * Displays a stacked area chart showing how technical, procurement, and ops time
 * change over the last 12 months. Uses smooth curves for better aesthetics.
 * 
 * Features:
 * - Stacked area chart with three layers
 * - Color coding: Technical (blue), Procurement (amber), Ops (green)
 * - Smooth curves for visual appeal
 * - Interactive tooltips showing breakdown on hover
 * - Data sampling for large datasets (max 100 points)
 * 
 * Requirements: FR-2.1
 */
export function BucketTrendChart({ data, isLoading }: BucketTrendChartProps) {
  // Apply data sampling for performance
  const sampledData = sampleData(data, 100);

  if (isLoading) {
    return <ChartSkeleton height={300} />;
  }

  if (!sampledData || sampledData.length === 0) {
    return (
      <ChartEmptyState
        title="No Trend Data Available"
        message="There is no historical data to display the bucket trend chart."
      />
    );
  }

  // Custom tooltip to show breakdown
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}:</span>
                </div>
                <span className="text-xs font-medium text-foreground">
                  {entry.value.toFixed(1)} hrs
                </span>
              </div>
            ))}
            <div className="pt-1 mt-1 border-t border-border">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">Total:</span>
                <span className="text-xs font-bold text-foreground">
                  {total.toFixed(1)} hrs
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Bucket Trend Over Time
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sampledData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTechnical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BUCKET_COLORS.technical} stopOpacity={0.8} />
                <stop offset="95%" stopColor={BUCKET_COLORS.technical} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorProcurement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BUCKET_COLORS.procurement} stopOpacity={0.8} />
                <stop offset="95%" stopColor={BUCKET_COLORS.procurement} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorOps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BUCKET_COLORS.ops} stopOpacity={0.8} />
                <stop offset="95%" stopColor={BUCKET_COLORS.ops} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              label={{
                value: 'Hours',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' },
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="technicalHours"
              name="Technical"
              stackId="1"
              stroke={BUCKET_COLORS.technical}
              fill="url(#colorTechnical)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="procurementHours"
              name="Procurement"
              stackId="1"
              stroke={BUCKET_COLORS.procurement}
              fill="url(#colorProcurement)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="opsHours"
              name="Ops"
              stackId="1"
              stroke={BUCKET_COLORS.ops}
              fill="url(#colorOps)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default BucketTrendChart;
