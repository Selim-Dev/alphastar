import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { DistributionData } from '@/types/budget-projects';

interface SpendDistributionChartProps {
  data: DistributionData[];
  currency: string;
}

export function SpendDistributionChart({ data, currency }: SpendDistributionChartProps) {
  // Color palette for categories
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

  // Custom label to show percentage
  const renderLabel = (props: PieLabelRenderProps) => {
    const pct = (props.payload as { percentage?: number })?.percentage ?? 0;
    return `${pct.toFixed(1)}%`;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data as unknown as Record<string, unknown>[]}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={100}
          innerRadius={60}
          fill="#8884d8"
          dataKey="amount"
          nameKey="category"
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={((value: string | number | undefined) => `${currency} ${Number(value).toLocaleString()}`) as never}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value) => {
            const item = data.find((d) => d.category === value);
            return `${value} (${item?.percentage.toFixed(1)}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
