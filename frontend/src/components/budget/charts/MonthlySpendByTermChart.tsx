import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlySpendData } from '@/types/budget-projects';

interface MonthlySpendByTermChartProps {
  data: MonthlySpendData[];
  currency: string;
}

export function MonthlySpendByTermChart({ data, currency }: MonthlySpendByTermChartProps) {
  // Transform data for stacked bar chart
  // Group by period, with each term as a separate bar segment
  const chartData = data.reduce((acc, item) => {
    const existing = acc.find((d) => d.period === item.period);
    if (existing) {
      existing[item.termName] = item.amount;
    } else {
      acc.push({
        period: item.period,
        [item.termName]: item.amount,
      });
    }
    return acc;
  }, [] as Array<Record<string, any>>);

  // Get unique term names for bars
  const termNames = Array.from(new Set(data.map((d) => d.termName)));

  // Color palette for terms
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // green-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="period"
          className="text-xs"
          tickFormatter={(value) => {
            const [year, month] = value.split('-');
            return `${month}/${year.slice(2)}`;
          }}
        />
        <YAxis
          className="text-xs"
          tickFormatter={(value) => `${currency} ${(value / 1000).toFixed(0)}K`}
        />
        <Tooltip
          formatter={(value: number) => `${currency} ${value.toLocaleString()}`}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {termNames.map((term, index) => (
          <Bar
            key={term}
            dataKey={term}
            stackId="a"
            fill={colors[index % colors.length]}
            radius={index === termNames.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
