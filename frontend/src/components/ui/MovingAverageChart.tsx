import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
} from 'recharts';

interface MovingAverageData {
  month: string;
  actual: number;
  movingAverage: number;
}

interface MovingAverageChartProps {
  data: MovingAverageData[];
  isLoading?: boolean;
}

export function MovingAverageChart({ data, isLoading }: MovingAverageChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading moving average...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  // Format month for display
  const formattedData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
    // Calculate variance for shaded area
    variance: Math.abs(item.actual - item.movingAverage),
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="varianceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="monthLabel"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            label={{
              value: 'Downtime Hours',
              angle: -90,
              position: 'insideLeft',
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
              return [value.toFixed(1) + ' hrs', name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          {/* Shaded area showing variance */}
          <Area
            type="monotone"
            dataKey="variance"
            fill="url(#varianceGradient)"
            stroke="none"
            name="Variance"
            legendType="none"
          />
          {/* Actual downtime line (solid blue) */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Actual Downtime"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
          {/* Moving average line (dashed gray) */}
          <Line
            type="monotone"
            dataKey="movingAverage"
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="3-Month Moving Average"
            dot={{ fill: '#6b7280', r: 3 }}
            activeDot={{ r: 5 }}
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
