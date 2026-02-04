/**
 * Cost Breakdown Chart Component
 * 
 * Displays a stacked bar chart showing internal vs external costs over time
 * with a trend line showing total cost.
 */

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { formatCurrency } from '../../lib/costAnalysis';

interface CostBreakdownData {
  month: string;
  internalCost: number;
  externalCost: number;
  totalCost: number;
}

interface CostBreakdownChartProps {
  data: CostBreakdownData[];
  isLoading?: boolean;
}

export function CostBreakdownChart({ data, isLoading }: CostBreakdownChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-center">
        <svg
          className="w-16 h-16 text-muted-foreground/50 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-sm text-muted-foreground">No cost data available</p>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-sm text-muted-foreground">Internal:</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(payload[0]?.value || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-amber-500" />
              <span className="text-sm text-muted-foreground">External:</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(payload[1]?.value || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <div className="w-3 h-0.5 bg-red-500" />
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(payload[2]?.value || 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format Y-axis values as currency
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            className="text-xs text-muted-foreground"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-xs text-muted-foreground"
            tick={{ fill: 'currentColor' }}
            tickFormatter={formatYAxis}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
            }}
            iconType="square"
          />
          
          {/* Stacked bars for internal and external costs */}
          <Bar
            dataKey="internalCost"
            name="Internal Cost"
            stackId="cost"
            fill="#3b82f6"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="externalCost"
            name="External Cost"
            stackId="cost"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
          
          {/* Trend line for total cost */}
          <Line
            type="monotone"
            dataKey="totalCost"
            name="Total Cost Trend"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
