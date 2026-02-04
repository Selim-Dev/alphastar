import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyTrendData {
  month: string;
  eventCount: number;
  totalDowntimeHours: number;
  averageDowntimeHours: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
  isLoading?: boolean;
}

export function MonthlyTrendChart({ data, isLoading }: MonthlyTrendChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading trend data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No trend data available</p>
        </div>
      </div>
    );
  }

  // Format month for display (e.g., "2025-01" -> "Jan 2025")
  const formattedData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="monthLabel"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            yAxisId="left"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            label={{
              value: 'Event Count',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fill: 'currentColor' },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            label={{
              value: 'Downtime Hours',
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle', fill: 'currentColor' },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number | undefined, name: string | undefined) => {
              if (value === undefined || name === undefined) return ['', ''];
              if (name === 'Event Count') {
                return [value, name];
              }
              return [value.toFixed(1) + ' hrs', name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          <Bar
            yAxisId="left"
            dataKey="eventCount"
            fill="#3b82f6"
            name="Event Count"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalDowntimeHours"
            stroke="#ef4444"
            strokeWidth={2}
            name="Total Downtime Hours"
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Helper function to format month string
function formatMonth(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return monthStr;
  }
}
