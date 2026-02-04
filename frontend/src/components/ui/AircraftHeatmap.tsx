import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { ChartEmptyState } from './ChartEmptyState';

interface AircraftMonthlyData {
  month: string;
  downtimeHours: number;
}

interface AircraftHeatmapData {
  aircraftId: string;
  registration: string;
  monthlyData: AircraftMonthlyData[];
}

interface AircraftHeatmapProps {
  data: AircraftHeatmapData[];
  isLoading?: boolean;
  onCellClick?: (aircraftId: string, month: string) => void;
}

/**
 * AircraftHeatmap Component
 * 
 * Displays a heatmap showing downtime intensity per aircraft per month.
 * - Rows: Aircraft registrations
 * - Columns: Last 12 months
 * - Cell color intensity based on downtime hours
 * - Tooltips showing exact hours
 * - Click handler for drill-down
 */
export function AircraftHeatmap({ data, isLoading, onCellClick }: AircraftHeatmapProps) {
  // Generate last 12 months
  const months = useMemo(() => {
    const result: string[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      result.push(format(month, 'yyyy-MM'));
    }
    return result;
  }, []);

  // Get color based on downtime hours
  const getColorClass = (hours: number): string => {
    if (hours === 0) return 'bg-green-100 dark:bg-green-900/20';
    if (hours <= 24) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (hours <= 100) return 'bg-orange-200 dark:bg-orange-900/40';
    return 'bg-red-200 dark:bg-red-900/50';
  };

  // Get text color based on downtime hours
  const getTextColorClass = (hours: number): string => {
    if (hours === 0) return 'text-green-800 dark:text-green-200';
    if (hours <= 24) return 'text-yellow-800 dark:text-yellow-200';
    if (hours <= 100) return 'text-orange-900 dark:text-orange-200';
    return 'text-red-900 dark:text-red-200';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4" />
        <div className="h-96 bg-muted rounded" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <ChartEmptyState message="No aircraft data available for heatmap" />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max">
        {/* Header Row */}
        <div className="flex items-center mb-2">
          <div className="w-32 flex-shrink-0 font-semibold text-sm text-foreground">
            Aircraft
          </div>
          <div className="flex gap-1">
            {months.map((month) => (
              <div
                key={month}
                className="w-16 text-center text-xs font-medium text-muted-foreground"
              >
                {format(new Date(month + '-01'), 'MMM yy')}
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        <TooltipProvider>
          {data.map((aircraft) => (
            <div key={aircraft.aircraftId} className="flex items-center mb-1">
              <div className="w-32 flex-shrink-0 font-medium text-sm text-foreground truncate">
                {aircraft.registration}
              </div>
              <div className="flex gap-1">
                {months.map((month) => {
                  const monthData = aircraft.monthlyData.find((m) => m.month === month);
                  const hours = monthData?.downtimeHours || 0;
                  const colorClass = getColorClass(hours);
                  const textColorClass = getTextColorClass(hours);

                  return (
                    <Tooltip key={month}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onCellClick?.(aircraft.aircraftId, month)}
                          className={`w-16 h-12 rounded border border-border ${colorClass} ${textColorClass} text-xs font-medium flex items-center justify-center hover:ring-2 hover:ring-primary transition-all cursor-pointer`}
                        >
                          {hours > 0 ? hours.toFixed(0) : '—'}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <div className="font-semibold">{aircraft.registration}</div>
                          <div className="text-muted-foreground">
                            {format(new Date(month + '-01'), 'MMMM yyyy')}
                          </div>
                          <div className="mt-1">
                            <span className="font-medium">{hours.toFixed(1)}</span> hours downtime
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Downtime Hours:</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/20 border border-border" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-border" />
            <span>1-24</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-orange-200 dark:bg-orange-900/40 border border-border" />
            <span>25-100</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-red-200 dark:bg-red-900/50 border border-border" />
            <span>&gt;100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
