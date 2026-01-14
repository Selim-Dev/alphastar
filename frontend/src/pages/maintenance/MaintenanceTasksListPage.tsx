import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Set document title for this page
const PAGE_TITLE = 'Maintenance Tasks | Alpha Star Aviation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import {
  useMaintenanceTasks,
} from '@/hooks/useMaintenance';
import { useAircraft } from '@/hooks/useAircraft';
import type { MaintenanceTask, Aircraft } from '@/types';

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

const SHIFT_OPTIONS = [
  { value: 'Morning', label: 'Morning' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Night', label: 'Night' },
  { value: 'Other', label: 'Other' },
];


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

export function MaintenanceTasksListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Set document title
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);
  
  // Get URL parameters for deep linking from alerts
  // Requirements: 3.4
  const urlStartDate = searchParams.get('startDate');
  const urlEndDate = searchParams.get('endDate');
  const urlAircraftId = searchParams.get('aircraftId');
  
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('');

  // Handle URL parameter changes for deep linking
  useEffect(() => {
    let hasUrlParams = false;
    
    if (urlStartDate && urlEndDate) {
      setDatePreset('custom');
      setCustomRange({
        startDate: urlStartDate,
        endDate: urlEndDate,
      });
      hasUrlParams = true;
    }
    
    if (urlAircraftId) {
      setAircraftFilter(urlAircraftId);
      hasUrlParams = true;
    }
    
    // Clear URL params after reading them
    if (hasUrlParams) {
      setSearchParams({}, { replace: true });
    }
  }, [urlStartDate, urlEndDate, urlAircraftId, setSearchParams]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Data fetching
  const { data: aircraftData } = useAircraft();
  const { data: tasksData, isLoading: tasksLoading } = useMaintenanceTasks({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    shift: shiftFilter || undefined,
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

  // Table columns for task list
  const columns: ColumnDef<MaintenanceTask, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => format(new Date(row.original.date), 'MMM dd, yyyy'),
      },
      {
        accessorKey: 'aircraftId',
        header: 'Aircraft',
        cell: ({ row }) =>
          aircraftMap.get(String(row.original.aircraftId))?.registration || 'Unknown',
      },
      {
        accessorKey: 'shift',
        header: 'Shift',
      },
      {
        accessorKey: 'taskType',
        header: 'Task Type',
      },
      {
        accessorKey: 'taskDescription',
        header: 'Description',
        cell: ({ row }) => (
          <span className="max-w-xs truncate block" title={row.original.taskDescription}>
            {row.original.taskDescription}
          </span>
        ),
      },
      {
        accessorKey: 'manpowerCount',
        header: 'Manpower',
      },
      {
        accessorKey: 'manHours',
        header: 'Man-Hours',
        cell: ({ row }) => row.original.manHours.toFixed(1),
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        cell: ({ row }) =>
          row.original.cost
            ? row.original.cost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
            : '-',
      },
    ],
    [aircraftMap]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Maintenance Tasks
        </motion.h1>

        <ExportButton
          exportType="maintenance-tasks"
          filters={{ ...dateRange, aircraftId: aircraftFilter || undefined }}
          filename={`maintenance-tasks-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
          label="Export"
        />
      </div>

      {/* Summary Cards */}
      <SummaryCards {...summaryStats} />

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

          {/* Shift Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Shift</label>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[120px]"
            >
              <option value="">All Shifts</option>
              {SHIFT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Task List */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {tasksLoading ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
            Loading maintenance tasks...
          </div>
        ) : (
          <DataTable
            data={tasks}
            columns={columns}
            searchPlaceholder="Search tasks..."
            searchColumn="taskDescription"
            pageSize={15}
          />
        )}
      </motion.div>
    </div>
  );
}
