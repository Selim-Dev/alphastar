import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Set document title for this page
const PAGE_TITLE = 'Maintenance Analytics | Alpha Star Aviation';
import { BarChartWrapper } from '@/components/ui/Charts';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import {
  useMaintenanceTasks,
  useMaintenanceSummary,
  useTopCostDrivers,
} from '@/hooks/useMaintenance';
import { useAircraft } from '@/hooks/useAircraft';
import type { Aircraft } from '@/types';

type DatePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
}

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'last7days':
      return {
        startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'last30days':
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'thisMonth':
      return {
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    default:
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
  }
}


// Summary Statistics Cards
function SummaryCards({
  totalTasks,
  totalManHours,
  totalCost,
  avgManHoursPerTask,
}: {
  totalTasks: number;
  totalManHours: number;
  totalCost: number;
  avgManHoursPerTask: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Tasks</p>
        <p className="text-2xl font-bold text-foreground">{totalTasks.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Man-Hours</p>
        <p className="text-2xl font-bold text-foreground">{totalManHours.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Cost</p>
        <p className="text-2xl font-bold text-foreground">
          {totalCost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Avg Hours/Task</p>
        <p className="text-2xl font-bold text-foreground">{avgManHoursPerTask.toFixed(1)}</p>
      </motion.div>
    </div>
  );
}

// Top Cost Drivers Chart
function TopCostDriversChart({
  data,
  aircraftMap,
}: {
  data: { aircraftId: string; totalCost: number; totalTasks: number }[];
  aircraftMap: Map<string, Aircraft>;
}) {
  const chartData = data.slice(0, 10).map((item) => ({
    name: aircraftMap.get(String(item.aircraftId))?.registration || 'Unknown',
    cost: item.totalCost,
    tasks: item.totalTasks,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Top Cost Drivers</h3>
      {chartData.length > 0 ? (
        <div className="h-[300px]">
          <BarChartWrapper
            data={chartData}
            xAxisKey="name"
            bars={[{ dataKey: 'cost', name: 'Cost (USD)', color: '#ef4444' }]}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No cost data available</p>
      )}
    </motion.div>
  );
}

// Tasks by Shift Chart
function TasksByShiftChart({
  data,
}: {
  data: { shift: string; totalTasks: number; totalManHours: number }[];
}) {
  const chartData = data.map((item) => ({
    name: item.shift,
    tasks: item.totalTasks,
    manHours: item.totalManHours,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Tasks by Shift</h3>
      {chartData.length > 0 ? (
        <div className="h-[300px]">
          <BarChartWrapper
            data={chartData}
            xAxisKey="name"
            bars={[
              { dataKey: 'tasks', name: 'Tasks', color: '#3b82f6' },
              { dataKey: 'manHours', name: 'Man-Hours', color: '#10b981' },
            ]}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No shift data available</p>
      )}
    </motion.div>
  );
}

export function MaintenanceTasksAnalyticsPage() {
  // Set document title
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [aircraftFilter, setAircraftFilter] = useState<string>('');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Data fetching
  const { data: aircraftData } = useAircraft();
  const { data: tasksData } = useMaintenanceTasks({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: summaryByShift } = useMaintenanceSummary({
    ...dateRange,
    groupBy: 'shift',
    aircraftId: aircraftFilter || undefined,
  });
  const { data: topCostDrivers } = useTopCostDrivers({
    ...dateRange,
    limit: 10,
  });

  const aircraft = aircraftData?.data || [];
  const tasks = tasksData || [];

  // Create aircraft map for lookups
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraft.forEach((a) => {
      const aircraftId = a._id || a.id;
      if (aircraftId) map.set(aircraftId, a);
    });
    return map;
  }, [aircraft]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalTasks = tasks.length;
    const totalManHours = tasks.reduce((sum, t) => sum + t.manHours, 0);
    const totalCost = tasks.reduce((sum, t) => sum + (t.cost || 0), 0);
    const avgManHoursPerTask = totalTasks > 0 ? totalManHours / totalTasks : 0;
    return { totalTasks, totalManHours, totalCost, avgManHoursPerTask };
  }, [tasks]);

  // Shift summary data for chart
  const shiftSummaryData = useMemo(() => {
    if (!summaryByShift) return [];
    return summaryByShift.map((item) => ({
      shift: item._id?.shift || 'Unknown',
      totalTasks: item.totalTasks,
      totalManHours: item.totalManHours,
    }));
  }, [summaryByShift]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Maintenance Analytics
        </motion.h1>

        <ExportButton
          exportType="maintenance-tasks"
          filters={{ ...dateRange, aircraftId: aircraftFilter || undefined }}
          filename={`maintenance-tasks-analytics-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
          label="Export"
        />
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Preset Buttons */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Date Range</label>
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      datePreset === preset
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {preset === 'last7days' && '7 Days'}
                    {preset === 'last30days' && '30 Days'}
                    {preset === 'thisMonth' && 'This Month'}
                    {preset === 'lastMonth' && 'Last Month'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Custom Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.startDate : dateRange.startDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value }));
                }}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.endDate : dateRange.endDate}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, endDate: e.target.value }));
                }}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
              />
            </div>
          </div>

          {/* Aircraft Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Aircraft</label>
            <AircraftSelect
              value={aircraftFilter}
              onChange={setAircraftFilter}
              includeAll
              allLabel="All Aircraft"
            />
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <SummaryCards {...summaryStats} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopCostDriversChart data={topCostDrivers || []} aircraftMap={aircraftMap} />
        <TasksByShiftChart data={shiftSummaryData} />
      </div>
    </div>
  );
}
