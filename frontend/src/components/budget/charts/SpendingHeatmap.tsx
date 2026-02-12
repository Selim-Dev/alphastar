import type { HeatmapData } from '@/types/budget-projects';

interface SpendingHeatmapProps {
  data?: HeatmapData;
  currency: string;
}

export function SpendingHeatmap({ data, currency }: SpendingHeatmapProps) {
  if (!data || data.terms.length === 0 || data.periods.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No heatmap data available
      </div>
    );
  }

  // Find min and max values for color scaling
  const allValues = data.values.flat();
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Color intensity function
  const getColorIntensity = (value: number) => {
    if (maxValue === minValue) return 0.5;
    return (value - minValue) / (maxValue - minValue);
  };

  // Get color based on intensity
  const getColor = (intensity: number) => {
    // Use blue scale for spending intensity
    const hue = 210; // Blue
    const saturation = 70;
    const lightness = 90 - intensity * 50; // Darker = more spending
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background border border-border p-2 text-xs font-medium text-left min-w-[200px]">
                Spending Term
              </th>
              {data.periods.map((period) => (
                <th
                  key={period}
                  className="border border-border p-2 text-xs font-medium text-center min-w-[80px]"
                >
                  {period.split('-')[1]}/{period.split('-')[0].slice(2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.terms.map((term, termIndex) => (
              <tr key={term}>
                <td className="sticky left-0 z-10 bg-background border border-border p-2 text-xs font-medium">
                  {term}
                </td>
                {data.periods.map((period, periodIndex) => {
                  const value = data.values[termIndex]?.[periodIndex] ?? 0;
                  const intensity = getColorIntensity(value);
                  const color = getColor(intensity);

                  return (
                    <td
                      key={`${term}-${period}`}
                      className="border border-border p-2 text-xs text-center cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: color }}
                      title={`${term} - ${period}: ${currency} ${value.toLocaleString()}`}
                    >
                      {value > 0 ? `${(value / 1000).toFixed(0)}K` : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(0) }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(0.5) }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: getColor(1) }} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
