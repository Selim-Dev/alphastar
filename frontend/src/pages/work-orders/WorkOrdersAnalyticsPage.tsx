import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import {
  useWorkOrders,
  useStatusDistribution,
  useTurnaroundStats,
  useOverdueCount,
} from '@/hooks/useWorkOrders';

// Set document title for this page
const PAGE_TITLE = 'Work Orders Analytics | Alpha Star Aviation';

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
  totalWorkOrders,
  openCount,
  overdueCount,
  avgTurnaround,
}: {
  totalWorkOrders: number;
  openCount: number;
  overdueCount: number;
  avgTurnaround: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Work Orders</p>
        <p className="text-2xl font-bold text-foreground">{totalWorkOrders.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Open</p>
        <p className="text-2xl font-bold text-blue-500">{openCount.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Overdue</p>
        <p className="text-2xl font-bold text-destructive">{overdueCount.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Avg Turnaround</p>
        <p className="text-2xl font-bold text-foreground">
          {avgTurnaround > 0 ? `${avgTurnaround.toFixed(1)} days` : '-'}
        </p>
      </motion.div>
    </div>
  );
}

// Status Distribution Charts
function StatusDistributionCharts({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const chartData = data.map((item) => ({
    name: item.status,
    count: item.count,
  }));

  const pieData = data.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Work Orders by Status
        </h3>
        {chartData.length > 0 ? (
          <div className="h-[300px]">
            <BarChartWrapper
              data={chartData}
              xAxisKey="name"
              bars={[{ dataKey: 'count', name: 'Count', color: '#3b82f6' }]}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No data available</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Status Distribution
        </h3>
        {pieData.length > 0 && pieData.some((d) => d.value > 0) ? (
          <div className="h-[300px]">
            <PieChartWrapper data={pieData} innerRadius={50} outerRadius={90} />
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No data available</p>
        )}
      </motion.div>
    </div>
  );
}

// Turnaround Metrics Card
function TurnaroundMetrics({
  stats,
}: {
  stats: { averageTurnaroundDays: number; minTurnaroundDays: number; maxTurnaroundDays: number; totalClosed: number } | null;
}) {
  if (!stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Turnaround Metrics</h3>
        <p className="text-muted-foreground text-center py-8">No closed work orders in selected period</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Turnaround Metrics</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Average</p>
          <p className="text-xl font-bold text-foreground">{stats.averageTurnaroundDays.toFixed(1)} days</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Minimum</p>
          <p className="text-xl font-bold text-green-500">{stats.minTurnaroundDays.toFixed(1)} days</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Maximum</p>
          <p className="text-xl font-bold text-amber-500">{stats.maxTurnaroundDays.toFixed(1)} days</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Closed</p>
          <p className="text-xl font-bold text-foreground">{stats.totalClosed}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function WorkOrdersAnalyticsPage() {
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
  const { data: workOrdersData } = useWorkOrders({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: statusDistribution } = useStatusDistribution({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: turnaroundStats } = useTurnaroundStats({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: overdueCount } = useOverdueCount(aircraftFilter || undefined);

  const workOrders = workOrdersData || [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalWorkOrders = workOrders.length;
    const openCount = workOrders.filter((wo) => wo.status === 'Open' || wo.status === 'InProgress').length;
    const avgTurnaround = turnaroundStats?.averageTurnaroundDays || 0;
    return { totalWorkOrders, openCount, overdueCount: overdueCount || 0, avgTurnaround };
  }, [workOrders, turnaroundStats, overdueCount]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Work Orders Analytics
        </motion.h1>

        <ExportButton
          exportType="work-orders"
          filters={{ ...dateRange, aircraftId: aircraftFilter || undefined }}
          filename={`work-orders-analytics-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
          label="Export"
        />
      </div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        <div className="flex flex-wrap items-end gap-4">
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
      <SummaryCards
        totalWorkOrders={summaryStats.totalWorkOrders}
        openCount={summaryStats.openCount}
        overdueCount={summaryStats.overdueCount}
        avgTurnaround={summaryStats.avgTurnaround}
      />

      {/* Status Distribution Charts */}
      <StatusDistributionCharts data={statusDistribution || []} />

      {/* Turnaround Metrics */}
      <TurnaroundMetrics stats={turnaroundStats || null} />
    </div>
  );
}
