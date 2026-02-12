import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { CumulativeData } from '@/types/budget-projects';

interface CumulativeSpendChartProps {
  data: CumulativeData[];
  currency: string;
}

export function CumulativeSpendChart({ data, currency }: CumulativeSpendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No data available
      </div>
    );
  }

  // Calculate max budget for reference line
  const maxBudget = Math.max(...data.map((d) => d.cumulativeBudget));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data}>
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
        <ReferenceLine
          y={maxBudget}
          stroke="#6b7280"
          strokeDasharray="5 5"
          label={{
            value: 'Budget Target',
            position: 'right',
            fill: '#6b7280',
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="cumulativeBudget"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Cumulative Budget"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="cumulativeSpent"
          stroke="#10b981"
          strokeWidth={2}
          name="Cumulative Spent"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
