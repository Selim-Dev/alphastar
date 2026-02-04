import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { ChartEmptyState } from '@/components/ui/ChartEmptyState';

/**
 * Color palette for the three buckets
 * - Technical: Blue (troubleshooting and installation work)
 * - Procurement: Amber (waiting for parts)
 * - Ops: Green (operational testing)
 * - Start/End: Gray (baseline markers)
 */
const BUCKET_COLORS = {
  technical: '#3b82f6',    // Blue
  procurement: '#f59e0b',  // Amber
  ops: '#10b981',          // Green
  baseline: '#6b7280',     // Gray
};

interface WaterfallChartProps {
  technicalHours: number;
  procurementHours: number;
  opsHours: number;
  totalHours: number;
  isLoading?: boolean;
}

/**
 * WaterfallChart Component
 * 
 * Displays a waterfall chart showing the composition breakdown of total downtime.
 * Shows how each bucket contributes to the total downtime in a visual flow.
 * 
 * Features:
 * - Start bar at 0 (baseline)
 * - Floating bars for each bucket showing contribution
 * - End bar showing total downtime
 * - Color coding matches bucket colors
 * - Connecting lines between bars (visual flow)
 * - Interactive tooltips
 * 
 * Requirements: FR-2.1
 */
export function WaterfallChart({
  technicalHours,
  procurementHours,
  opsHours,
  totalHours,
  isLoading,
}: WaterfallChartProps) {
  if (isLoading) {
    return <ChartSkeleton height={300} />;
  }

  if (totalHours === 0) {
    return (
      <ChartEmptyState
        title="No Downtime Data"
        message="There is no downtime data to display the waterfall breakdown."
      />
    );
  }

  // Build waterfall data structure
  // Each bar needs: name, value (height), base (starting position), color
  const waterfallData = [
    {
      name: 'Start',
      value: 0,
      base: 0,
      displayValue: 0,
      color: BUCKET_COLORS.baseline,
      isBaseline: true,
    },
    {
      name: 'Technical',
      value: technicalHours,
      base: 0,
      displayValue: technicalHours,
      color: BUCKET_COLORS.technical,
      isBaseline: false,
    },
    {
      name: 'Procurement',
      value: procurementHours,
      base: technicalHours,
      displayValue: procurementHours,
      color: BUCKET_COLORS.procurement,
      isBaseline: false,
    },
    {
      name: 'Ops',
      value: opsHours,
      base: technicalHours + procurementHours,
      displayValue: opsHours,
      color: BUCKET_COLORS.ops,
      isBaseline: false,
    },
    {
      name: 'Total',
      value: totalHours,
      base: 0,
      displayValue: totalHours,
      color: BUCKET_COLORS.baseline,
      isBaseline: true,
    },
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            {data.isBaseline ? 'Total: ' : 'Contribution: '}
            <span className="font-bold text-foreground">
              {data.displayValue.toFixed(1)} hrs
            </span>
          </p>
          {!data.isBaseline && data.base > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative: {(data.base + data.value).toFixed(1)} hrs
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom label to show values on bars
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    
    // Only show label if bar is tall enough
    if (height < 20) return null;
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {value.toFixed(0)}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Downtime Composition Breakdown
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={waterfallData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
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
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            
            {/* Base bars (invisible, used for stacking) */}
            <Bar dataKey="base" stackId="a" fill="transparent" />
            
            {/* Visible bars with colors */}
            <Bar dataKey="value" stackId="a" label={renderCustomLabel}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: BUCKET_COLORS.technical }}
          />
          <span className="text-sm text-muted-foreground">Technical</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: BUCKET_COLORS.procurement }}
          />
          <span className="text-sm text-muted-foreground">Procurement</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: BUCKET_COLORS.ops }}
          />
          <span className="text-sm text-muted-foreground">Ops</span>
        </div>
      </div>
    </motion.div>
  );
}

export default WaterfallChart;
