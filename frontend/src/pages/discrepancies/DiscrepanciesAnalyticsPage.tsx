import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import {
  useDiscrepancies,
  useDiscrepancyAnalytics,
} from '@/hooks/useDiscrepancies';

// Set document title for this page
const PAGE_TITLE = 'Discrepancies Analytics | Alpha Star Aviation';

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
  totalDiscrepancies,
  uncorrectedCount,
  totalDowntimeHours,
  topATAChapter,
}: {
  totalDiscrepancies: number;
  uncorrectedCount: number;
  totalDowntimeHours: number;
  topATAChapter: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Discrepancies</p>
        <p className="text-2xl font-bold text-foreground">{totalDiscrepancies.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Uncorrected</p>
        <p className="text-2xl font-bold text-destructive">{uncorrectedCount.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Downtime</p>
        <p className="text-2xl font-bold text-foreground">{totalDowntimeHours.toFixed(1)} hrs</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Top ATA Chapter</p>
        <p className="text-2xl font-bold text-foreground">{topATAChapter || '-'}</p>
      </motion.div>
    </div>
  );
}

// ATA Chapter Analytics Charts
function ATAChapterCharts({
  data,
}: {
  data: { ataChapter: string; count: number; totalDowntimeHours: number }[];
}) {
  const chartData = data.slice(0, 10).map((item) => ({
    name: `ATA ${item.ataChapter}`,
    count: item.count,
    downtime: Math.round(item.totalDowntimeHours * 10) / 10,
  }));

  const pieData = data.slice(0, 6).map((item) => ({
    name: `ATA ${item.ataChapter}`,
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
          Top ATA Chapters by Discrepancy Count
        </h3>
        {chartData.length > 0 ? (
          <div className="h-[300px]">
            <BarChartWrapper
              data={chartData}
              xAxisKey="name"
              bars={[
                { dataKey: 'count', name: 'Discrepancies', color: '#3b82f6' },
                { dataKey: 'downtime', name: 'Downtime (hrs)', color: '#ef4444' },
              ]}
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
          Discrepancy Distribution by ATA Chapter
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

// Responsibility Distribution Chart
function ResponsibilityChart({
  data,
}: {
  data: { responsibility: string; count: number; totalDowntimeHours: number }[];
}) {
  const chartData = data.map((item) => ({
    name: item.responsibility || 'Unassigned',
    count: item.count,
    downtime: Math.round(item.totalDowntimeHours * 10) / 10,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Discrepancies by Responsibility
      </h3>
      {chartData.length > 0 ? (
        <div className="h-[300px]">
          <BarChartWrapper
            data={chartData}
            xAxisKey="name"
            bars={[
              { dataKey: 'count', name: 'Discrepancies', color: '#8b5cf6' },
              { dataKey: 'downtime', name: 'Downtime (hrs)', color: '#f59e0b' },
            ]}
          />
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No data available</p>
      )}
    </motion.div>
  );
}

export function DiscrepanciesAnalyticsPage() {
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
  const { data: discrepanciesData } = useDiscrepancies({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: analyticsData } = useDiscrepancyAnalytics({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });

  const discrepancies = discrepanciesData || [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDiscrepancies = discrepancies.length;
    const uncorrectedCount = discrepancies.filter((d) => !d.dateCorrected).length;
    const totalDowntimeHours = discrepancies.reduce(
      (sum, d) => sum + (d.downtimeHours || 0),
      0
    );
    
    // Get top ATA chapter from analytics
    const topATAChapter = analyticsData && analyticsData.length > 0
      ? (analyticsData as { _id: string }[])[0]._id
      : '';
    
    return { totalDiscrepancies, uncorrectedCount, totalDowntimeHours, topATAChapter };
  }, [discrepancies, analyticsData]);

  // Transform analytics data for charts
  const ataChapterAnalytics = useMemo(() => {
    if (!analyticsData) return [];
    return (analyticsData as { _id: string; count: number; totalDowntimeHours: number }[]).map(
      (item) => ({
        ataChapter: item._id,
        count: item.count,
        totalDowntimeHours: item.totalDowntimeHours || 0,
      })
    );
  }, [analyticsData]);

  // Calculate responsibility distribution from discrepancies
  const responsibilityAnalytics = useMemo(() => {
    const responsibilityMap = new Map<string, { count: number; totalDowntimeHours: number }>();
    
    discrepancies.forEach((d) => {
      const responsibility = d.responsibility || 'Unassigned';
      const existing = responsibilityMap.get(responsibility) || { count: 0, totalDowntimeHours: 0 };
      responsibilityMap.set(responsibility, {
        count: existing.count + 1,
        totalDowntimeHours: existing.totalDowntimeHours + (d.downtimeHours || 0),
      });
    });
    
    return Array.from(responsibilityMap.entries())
      .map(([responsibility, data]) => ({
        responsibility,
        count: data.count,
        totalDowntimeHours: data.totalDowntimeHours,
      }))
      .sort((a, b) => b.count - a.count);
  }, [discrepancies]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          Discrepancies Analytics
        </motion.h1>

        <ExportButton
          exportType="discrepancies"
          filters={{ ...dateRange, aircraftId: aircraftFilter || undefined }}
          filename={`discrepancies-analytics-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
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
        totalDiscrepancies={summaryStats.totalDiscrepancies}
        uncorrectedCount={summaryStats.uncorrectedCount}
        totalDowntimeHours={summaryStats.totalDowntimeHours}
        topATAChapter={summaryStats.topATAChapter}
      />

      {/* ATA Chapter Charts */}
      <ATAChapterCharts data={ataChapterAnalytics} />

      {/* Responsibility Distribution */}
      <ResponsibilityChart data={responsibilityAnalytics} />
    </div>
  );
}
