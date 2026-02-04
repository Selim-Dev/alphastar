import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface CategoryBreakdownData {
  category: 'aog' | 'unscheduled' | 'scheduled';
  count: number;
  percentage: number;
  totalHours: number;
}

interface CategoryBreakdownPieProps {
  data: CategoryBreakdownData[];
  isLoading?: boolean;
}

const CATEGORY_COLORS = {
  aog: '#ef4444', // Red
  unscheduled: '#f59e0b', // Amber
  scheduled: '#3b82f6', // Blue
};

const CATEGORY_LABELS = {
  aog: 'AOG',
  unscheduled: 'Unscheduled',
  scheduled: 'Scheduled',
};

export function CategoryBreakdownPie({ data, isLoading }: CategoryBreakdownPieProps) {
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
        <p className="text-sm text-muted-foreground">No category data available</p>
      </div>
    );
  }

  // Prepare data for pie chart
  const chartData = data.map((item) => ({
    name: CATEGORY_LABELS[item.category],
    value: item.count,
    percentage: item.percentage,
    hours: item.totalHours,
    color: CATEGORY_COLORS[item.category],
  }));

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    );
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-col gap-2 mt-4">
        {payload.map((entry: any, index: number) => {
          const item = chartData[index];
          return (
            <div key={`legend-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-foreground">{entry.value}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {item.value} events • {item.hours.toFixed(1)}h
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="40%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number | undefined, _name: string | undefined, props: any) => {
            if (value === undefined) return ['', ''];
            const item = props.payload;
            return [
              `${value} events (${item.percentage.toFixed(1)}%) • ${item.hours.toFixed(1)}h`,
              item.name,
            ];
          }}
        />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
