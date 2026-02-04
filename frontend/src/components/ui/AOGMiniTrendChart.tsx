import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import type { AOGSummaryTrendPoint } from '@/hooks/useDashboard';

interface AOGMiniTrendChartProps {
  trendData?: AOGSummaryTrendPoint[];
  isLoading?: boolean;
}

export function AOGMiniTrendChart({ trendData, isLoading }: AOGMiniTrendChartProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AOG Events Trend</h3>
        </div>
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  if (!trendData || trendData.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AOG Events Trend</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>No trend data available</p>
        </div>
      </Card>
    );
  }

  // Format month labels (e.g., "2025-01" -> "Jan")
  const chartData = trendData.map(point => ({
    ...point,
    monthLabel: new Date(point.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
  }));

  // Calculate total and average
  const totalEvents = trendData.reduce((sum, point) => sum + point.count, 0);
  const avgEvents = (totalEvents / trendData.length).toFixed(1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AOG Events Trend</h3>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Last 6 Months</div>
          <div className="text-xs text-muted-foreground">Avg: {avgEvents} events/month</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis 
            dataKey="monthLabel" 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            className="text-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number | undefined) => value !== undefined ? [`${value} events`, 'Count'] : ['', '']}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Events (6 months)</span>
          <span className="font-medium">{totalEvents}</span>
        </div>
      </div>
    </Card>
  );
}
