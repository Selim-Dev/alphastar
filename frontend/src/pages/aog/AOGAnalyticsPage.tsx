import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { useAOGEvents, useAOGAnalytics } from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import type { AOGEvent, Aircraft } from '@/types';

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

const RESPONSIBILITY_COLORS: Record<string, string> = {
  Internal: '#3b82f6',
  OEM: '#ef4444',
  Customs: '#f59e0b',
  Finance: '#10b981',
  Other: '#8b5cf6',
};

// Summary Statistics Cards
function SummaryCards({
  totalEvents,
  activeEvents,
  totalDowntimeHours,
  totalCost,
}: {
  totalEvents: number;
  activeEvents: number;
  totalDowntimeHours: number;
  totalCost: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Events</p>
        <p className="text-2xl font-bold text-foreground">{totalEvents.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Active <GlossaryTerm term="AOG" /></p>
        <p className="text-2xl font-bold text-destructive">{activeEvents.toLocaleString()}</p>
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
        <p className="text-sm text-muted-foreground">Total Cost</p>
        <p className="text-2xl font-bold text-foreground">
          {totalCost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
        </p>
      </motion.div>
    </div>
  );
}

// Downtime by Responsibility Chart
function DowntimeByResponsibilityChart({
  data,
}: {
  data: { responsibleParty: string; totalDowntimeHours: number; eventCount: number }[];
}) {
  const chartData = data.map((item) => ({
    name: item.responsibleParty,
    hours: Math.round(item.totalDowntimeHours * 10) / 10,
    events: item.eventCount,
  }));

  const pieData = data.map((item) => ({
    name: item.responsibleParty,
    value: Math.round(item.totalDowntimeHours * 10) / 10,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Downtime Hours by Responsibility
        </h3>
        {chartData.length > 0 ? (
          <div className="h-[300px]">
            <BarChartWrapper
              data={chartData}
              xAxisKey="name"
              bars={[
                { dataKey: 'hours', name: 'Downtime (hrs)', color: '#ef4444' },
                { dataKey: 'events', name: 'Events', color: '#3b82f6' },
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
          Downtime Distribution
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

// Event Timeline Component
function EventTimeline({
  events,
  aircraftMap,
}: {
  events: (AOGEvent & { downtimeHours?: number })[];
  aircraftMap: Map<string, Aircraft>;
}) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Event Timeline</h3>
      {sortedEvents.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {sortedEvents.slice(0, 20).map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 pb-4 border-b border-border last:border-0"
            >
              <div className="flex-shrink-0">
                <div
                  className="w-3 h-3 rounded-full mt-1.5"
                  style={{
                    backgroundColor: RESPONSIBILITY_COLORS[event.responsibleParty] || '#6b7280',
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {aircraftMap.get(String(event.aircraftId))?.registration || 'Unknown'}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      event.category === 'aog'
                        ? 'bg-destructive/10 text-destructive'
                        : event.category === 'unscheduled'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-blue-500/10 text-blue-600'
                    }`}
                  >
                    {event.category.toUpperCase()}
                  </span>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: `${RESPONSIBILITY_COLORS[event.responsibleParty]}20`,
                      color: RESPONSIBILITY_COLORS[event.responsibleParty],
                    }}
                  >
                    {event.responsibleParty}
                  </span>
                  {!event.clearedAt && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.reasonCode} - {event.actionTaken.substring(0, 100)}
                  {event.actionTaken.length > 100 ? '...' : ''}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    Detected: {format(new Date(event.detectedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                  {event.clearedAt && (
                    <span>
                      Cleared: {format(new Date(event.clearedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  )}
                  {event.downtimeHours !== undefined && (
                    <span className="font-medium text-foreground">
                      {event.downtimeHours.toFixed(1)} hrs downtime
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No events in selected period</p>
      )}
    </motion.div>
  );
}

export function AOGAnalyticsPage() {
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
  const { data: eventsData } = useAOGEvents({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: analyticsData } = useAOGAnalytics({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });

  const aircraft = aircraftData?.data || [];
  const events = (eventsData || []) as (AOGEvent & { downtimeHours?: number })[];

  // Create aircraft map for lookups
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraft.forEach((a) => {
      const aircraftId = a._id || a.id;
      if (aircraftId) {
        map.set(aircraftId, a);
      }
    });
    return map;
  }, [aircraft]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter((e) => !e.clearedAt).length;
    const totalDowntimeHours = events.reduce(
      (sum, e) => sum + ((e as { downtimeHours?: number }).downtimeHours || 0),
      0
    );
    const totalCost = events.reduce(
      (sum, e) => sum + (e.costLabor || 0) + (e.costParts || 0) + (e.costExternal || 0),
      0
    );
    return { totalEvents, activeEvents, totalDowntimeHours, totalCost };
  }, [events]);

  // Transform analytics data for charts
  const downtimeByResponsibility = useMemo(() => {
    if (!analyticsData) return [];
    return (analyticsData as { responsibleParty: string; totalDowntimeHours: number; eventCount: number }[]).map(
      (item) => ({
        responsibleParty: item.responsibleParty || 'Unknown',
        totalDowntimeHours: item.totalDowntimeHours || 0,
        eventCount: item.eventCount || 0,
      })
    );
  }, [analyticsData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        <GlossaryTerm term="AOG" /> Analytics
      </motion.h1>

      {/* Filters */}
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

      {/* Downtime by Responsibility Charts */}
      <DowntimeByResponsibilityChart data={downtimeByResponsibility} />

      {/* Event Timeline */}
      <EventTimeline events={events} aircraftMap={aircraftMap} />
    </div>
  );
}
