import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ReferenceLine,
} from 'recharts';

interface ForecastDataPoint {
  month: string;
  actual?: number;
  predicted?: number;
  lower?: number;
  upper?: number;
}

interface ForecastChartProps {
  historical: Array<{
    month: string;
    actual: number;
  }>;
  forecast: Array<{
    month: string;
    predicted: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
  isLoading?: boolean;
}

export function ForecastChart({ historical, forecast, isLoading }: ForecastChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading forecast...</div>
      </div>
    );
  }

  if (!historical || historical.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">No historical data available for forecast</p>
      </div>
    );
  }

  // Combine historical and forecast data
  const chartData: ForecastDataPoint[] = [
    ...historical.map((item) => ({
      month: item.month,
      actual: item.actual,
    })),
    ...forecast.map((item) => ({
      month: item.month,
      predicted: item.predicted,
      lower: item.confidenceInterval.lower,
      upper: item.confidenceInterval.upper,
    })),
  ];

  // Find the split point between historical and forecast
  const splitMonth = historical[historical.length - 1]?.month;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
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
            formatter={(value: number | undefined) => value !== undefined ? [`${value.toFixed(1)} hours`, ''] : ['', '']}
          />
          <Legend />

          {/* Confidence interval shaded area */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="#fecaca"
            fillOpacity={0.3}
            name="Confidence Interval"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="none"
            fill="#ffffff"
            fillOpacity={1}
          />

          {/* Historical actual line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            name="Historical Actual"
            connectNulls={false}
          />

          {/* Forecast predicted line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#ef4444', r: 4 }}
            name="Forecast"
            connectNulls={false}
          />

          {/* Vertical line separating historical from forecast */}
          {splitMonth && (
            <ReferenceLine
              x={splitMonth}
              stroke="#6b7280"
              strokeDasharray="3 3"
              label={{
                value: 'Forecast →',
                position: 'top',
                fill: '#6b7280',
                fontSize: 12,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span>Historical Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500 border-dashed" style={{ borderTop: '2px dashed' }} />
          <span>Forecast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-red-200 opacity-30" />
          <span>Confidence Interval (±20%)</span>
        </div>
      </div>
    </div>
  );
}
