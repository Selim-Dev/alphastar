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
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface YearOverYearChartProps {
  currentYearData: Array<{ month: string; value: number }>;
  previousYearData: Array<{ month: string; value: number }>;
  isLoading?: boolean;
}

export function YearOverYearChart({
  currentYearData,
  previousYearData,
  isLoading,
}: YearOverYearChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (!currentYearData || currentYearData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-card rounded-lg border border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No comparison data available</p>
        </div>
      </div>
    );
  }

  // Merge current and previous year data
  const mergedData = currentYearData.map((current) => {
    const previous = previousYearData.find((p) => p.month === current.month);
    return {
      month: current.month,
      monthLabel: formatMonth(current.month),
      currentYear: current.value,
      previousYear: previous?.value || 0,
      delta: previous?.value ? ((current.value - previous.value) / previous.value) * 100 : 0,
    };
  });

  // Custom tooltip with delta indicator
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const delta = data.delta;
      const deltaColor = delta > 0 ? 'text-red-500' : delta < 0 ? 'text-green-500' : 'text-gray-500';
      const DeltaIcon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Current Year:</span>
              <span className="text-sm font-medium text-blue-600">
                {data.currentYear.toFixed(1)} hrs
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Previous Year:</span>
              <span className="text-sm font-medium text-gray-600">
                {data.previousYear.toFixed(1)} hrs
              </span>
            </div>
            {data.previousYear > 0 && (
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-border">
                <span className="text-sm text-muted-foreground">Change:</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${deltaColor}`}>
                  <DeltaIcon className="w-3 h-3" />
                  {Math.abs(delta).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={mergedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
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
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
          />
          <Bar
            dataKey="currentYear"
            fill="#3b82f6"
            name="Current Year"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="previousYear"
            fill="#9ca3af"
            name="Previous Year"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Delta indicators summary */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <ArrowUp className="w-3 h-3 text-red-500" />
          <span>Increase</span>
        </div>
        <div className="flex items-center gap-1">
          <ArrowDown className="w-3 h-3 text-green-500" />
          <span>Decrease</span>
        </div>
        <div className="flex items-center gap-1">
          <Minus className="w-3 h-3 text-gray-500" />
          <span>No Change</span>
        </div>
      </div>
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
