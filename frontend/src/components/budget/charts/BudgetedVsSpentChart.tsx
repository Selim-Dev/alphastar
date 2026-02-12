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
import type { AircraftTypeData } from '@/types/budget-projects';

interface BudgetedVsSpentChartProps {
  data: AircraftTypeData[];
  currency: string;
}

export function BudgetedVsSpentChart({ data, currency }: BudgetedVsSpentChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="aircraftType" className="text-xs" />
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
        <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" radius={[4, 4, 0, 0]} />
        <Bar dataKey="spent" fill="#10b981" name="Spent" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
