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
  ReferenceLine,
} from 'recharts';

interface ParetoDataPoint {
  reasonCode: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

interface ParetoChartProps {
  data: ParetoDataPoint[];
  isLoading?: boolean;
}

export function ParetoChart({ data, isLoading }: ParetoChartProps) {
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
        <p className="text-sm text-muted-foreground">No reason code data available</p>
      </div>
    );
  }

  // Sort by count descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart
        data={sortedData}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="reasonCode"
          angle={-45}
          textAnchor="end"
          height={80}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          yAxisId="left"
          label={{ value: 'Event Count', angle: -90, position: 'insideLeft' }}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          label={{ value: 'Cumulative %', angle: 90, position: 'insideRight' }}
          className="text-xs fill-muted-foreground"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined, name: string | undefined) => {
            if (value === undefined || name === undefined) return ['', ''];
            if (name === 'count') return [value, 'Event Count'];
            if (name === 'cumulativePercentage') return [`${value.toFixed(1)}%`, 'Cumulative %'];
            return [value, name];
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          formatter={(value) => {
            if (value === 'count') return 'Event Count';
            if (value === 'cumulativePercentage') return 'Cumulative %';
            return value;
          }}
        />
        <ReferenceLine
          yAxisId="right"
          y={80}
          stroke="#f59e0b"
          strokeDasharray="5 5"
          label={{ value: '80% Line', position: 'right', fill: '#f59e0b' }}
        />
        <Bar
          yAxisId="left"
          dataKey="count"
          fill="#3b82f6"
          name="count"
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulativePercentage"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', r: 4 }}
          name="cumulativePercentage"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
