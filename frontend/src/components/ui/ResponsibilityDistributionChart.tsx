import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface ResponsibilityData {
  responsibleParty: 'Internal' | 'OEM' | 'Customs' | 'Finance' | 'Other';
  totalHours: number;
  eventCount: number;
  percentage: number;
}

interface ResponsibilityDistributionChartProps {
  data: ResponsibilityData[];
  isLoading?: boolean;
}

const RESPONSIBILITY_COLORS: Record<string, string> = {
  Internal: '#3b82f6', // Blue
  OEM: '#ef4444', // Red
  Customs: '#f59e0b', // Amber
  Finance: '#10b981', // Green
  Other: '#8b5cf6', // Purple
};

export function ResponsibilityDistributionChart({
  data,
  isLoading,
}: ResponsibilityDistributionChartProps) {
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
        <p className="text-sm text-muted-foreground">No responsibility data available</p>
      </div>
    );
  }

  // Calculate total hours for percentage calculation
  const totalHours = data.reduce((sum, item) => sum + item.totalHours, 0);
  
  // Ensure percentage is calculated for all items
  const dataWithPercentage = data.map(item => ({
    ...item,
    percentage: totalHours > 0 ? (item.totalHours / totalHours) * 100 : 0,
  }));

  // Sort by total hours descending
  const sortedData = [...dataWithPercentage].sort((a, b) => b.totalHours - a.totalHours);

  const renderCustomLabel = (props: any) => {
    const { x, y, width, value, percentage } = props;
    
    // Guard against undefined values
    if (value === undefined || percentage === undefined) {
      return null;
    }
    
    return (
      <text
        x={x + width + 5}
        y={y + 12}
        fill="hsl(var(--muted-foreground))"
        textAnchor="start"
        className="text-xs"
      >
        {`${value.toFixed(1)}h (${percentage.toFixed(1)}%)`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={sortedData}
        layout="vertical"
        margin={{ top: 20, right: 120, left: 80, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          label={{ value: 'Total Hours', position: 'insideBottom', offset: -10 }}
          className="text-xs fill-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="responsibleParty"
          width={70}
          className="text-xs fill-muted-foreground"
        />
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
              `${value.toFixed(1)} hours (${item.percentage.toFixed(1)}%) • ${item.eventCount} events`,
              item.responsibleParty,
            ];
          }}
        />
        <Bar dataKey="totalHours" radius={[0, 4, 4, 0]}>
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={RESPONSIBILITY_COLORS[entry.responsibleParty] || '#6b7280'}
            />
          ))}
          <LabelList
            dataKey="totalHours"
            content={renderCustomLabel}
            position="right"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
