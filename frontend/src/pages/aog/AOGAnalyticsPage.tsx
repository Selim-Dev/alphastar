import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { ThreeBucketChart, BucketSummaryCards } from '@/components/ui/ThreeBucketChart';
import { BucketTrendChart } from '@/components/ui/BucketTrendChart';
import { WaterfallChart } from '@/components/ui/WaterfallChart';
import { MonthlyTrendChart } from '@/components/ui/MonthlyTrendChart';
import { MovingAverageChart } from '@/components/ui/MovingAverageChart';
import { YearOverYearChart } from '@/components/ui/YearOverYearChart';
import { AircraftHeatmap } from '@/components/ui/AircraftHeatmap';
import { ReliabilityScoreCards } from '@/components/ui/ReliabilityScoreCards';
import { ParetoChart } from '@/components/ui/ParetoChart';
import { CategoryBreakdownPie } from '@/components/ui/CategoryBreakdownPie';
import { ResponsibilityDistributionChart } from '@/components/ui/ResponsibilityDistributionChart';
import { CostBreakdownChart } from '@/components/ui/CostBreakdownChart';
import { CostEfficiencyMetrics } from '@/components/ui/CostEfficiencyMetrics';
import { ForecastChart } from '@/components/ui/ForecastChart';
import { RiskScoreGauge } from '@/components/ui/RiskScoreGauge';
import { InsightsPanel } from '@/components/ui/InsightsPanel';
import { AnalyticsSectionErrorBoundary } from '@/components/ui/AnalyticsSectionErrorBoundary';
import { ChartSkeleton } from '@/components/ui/ChartSkeleton';
import { AOGAircraftBreakdownTable } from '@/components/aog/AOGAircraftBreakdownTable';
import { EnhancedAOGAnalyticsPDFExport } from '@/components/ui/EnhancedAOGAnalyticsPDFExport';
import { 
  useAOGEvents, 
  useThreeBucketAnalytics,
  useMonthlyTrend,
  useCategoryBreakdown,
  useForecast,
  useInsights,
} from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import { 
  calculateReliabilityScores, 
  getMostReliable, 
  getNeedsAttention,
  type AircraftReliabilityData,
} from '@/lib/reliabilityScore';
import {
  aggregateCostsByMonth,
  calculateCostPerHour,
  calculateCostPerEvent,
  calculateTotalCosts,
  getLastNMonths,
} from '@/lib/costAnalysis';
import {
  calculateRiskScores,
  getHighRiskAircraft,
} from '@/lib/riskScore';
import type { AOGEvent, Aircraft, ThreeBucketBreakdown } from '@/types';

type DatePreset = 'allTime' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

// Fleet groups available in the system
const FLEET_GROUPS = ['A340', 'A330', 'G650ER', 'Hawker', 'Cessna', 'A320', 'A319', 'A318'];

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'allTime':
      // Return empty object - no date filtering
      return {};
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

// Summary Statistics Cards - Updated for three-bucket model
function SummaryCards({
  totalEvents,
  activeEvents,
  totalDowntimeHours,
  averageDowntimeHours,
  totalCost,
}: {
  totalEvents: number;
  activeEvents: number;
  totalDowntimeHours: number;
  averageDowntimeHours: number;
  totalCost: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted-foreground">Total Events</p>
          <InfoTooltip
            content={
              <div>
                <p className="font-medium mb-1">Total Events</p>
                <p className="text-xs">
                  The total number of AOG events in the selected period, including active and resolved events.
                </p>
              </div>
            }
          />
        </div>
        <p className="text-2xl font-bold text-foreground">{totalEvents.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted-foreground">Active <GlossaryTerm term="AOG" /></p>
          <InfoTooltip
            content={
              <div>
                <p className="font-medium mb-1">Active AOG</p>
                <p className="text-xs">
                  Aircraft currently grounded (AOG events without a cleared date). These require immediate attention.
                </p>
              </div>
            }
          />
        </div>
        <p className="text-2xl font-bold text-destructive">{activeEvents.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted-foreground">Total Downtime</p>
          <InfoTooltip
            content={
              <div>
                <p className="font-medium mb-1">Total Downtime</p>
                <p className="text-xs">
                  Sum of all downtime hours across all events in the selected period. 
                  Calculated from reportedAt to upAndRunningAt timestamps.
                </p>
              </div>
            }
          />
        </div>
        <p className="text-2xl font-bold text-foreground">{totalDowntimeHours.toFixed(1)} hrs</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted-foreground">Avg Downtime</p>
          <InfoTooltip
            content={
              <div>
                <p className="font-medium mb-1">Average Downtime</p>
                <p className="text-xs">
                  Average downtime per event. Calculated as total downtime hours divided by total events.
                  Lower is better.
                </p>
              </div>
            }
          />
        </div>
        <p className="text-2xl font-bold text-foreground">{averageDowntimeHours.toFixed(1)} hrs</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-muted-foreground">Total Cost</p>
          <InfoTooltip
            content={
              <div>
                <p className="font-medium mb-1">Total Cost</p>
                <p className="text-xs">
                  Sum of internal and external costs for all events in the selected period. 
                  Includes labor, parts, and third-party services.
                </p>
              </div>
            }
          />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {totalCost.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
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
  // Sort by createdAt descending (newest first) so newly created events appear at top
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Events</h3>
      {sortedEvents.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {sortedEvents.slice(0, 10).map((event, index) => (
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

// Aircraft Performance Heatmap Wrapper Component
function AircraftPerformanceHeatmap({
  dateRange,
  aircraftFilter,
  fleetFilter,
}: {
  dateRange: DateRange;
  aircraftFilter: string;
  fleetFilter: string;
}) {
  const { data: eventsData, isLoading } = useAOGEvents({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    fleetGroup: fleetFilter || undefined,
  });

  const { data: aircraftData } = useAircraft();
  const aircraft = aircraftData?.data || [];

  // Transform events data into heatmap format
  const heatmapData = useMemo(() => {
    if (!eventsData || !aircraft) return [];

    // Group events by aircraft and month
    const aircraftMonthlyData = new Map<string, Map<string, number>>();

    (eventsData as AOGEvent[]).forEach((event) => {
      const aircraftId = String(event.aircraftId);
      const month = format(new Date(event.detectedAt), 'yyyy-MM');
      const downtime = event.totalDowntimeHours || 0;

      if (!aircraftMonthlyData.has(aircraftId)) {
        aircraftMonthlyData.set(aircraftId, new Map());
      }

      const monthlyData = aircraftMonthlyData.get(aircraftId)!;
      monthlyData.set(month, (monthlyData.get(month) || 0) + downtime);
    });

    // Convert to heatmap format
    return aircraft.map((ac) => {
      const aircraftId = ac._id || ac.id || '';
      const monthlyData = aircraftMonthlyData.get(aircraftId) || new Map();

      return {
        aircraftId,
        registration: ac.registration,
        monthlyData: Array.from(monthlyData.entries()).map(([month, downtimeHours]) => ({
          month,
          downtimeHours,
        })),
      };
    });
  }, [eventsData, aircraft]);

  const handleCellClick = (aircraftId: string, month: string) => {
    // TODO: Implement drill-down navigation
    console.log('Drill down:', { aircraftId, month });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Aircraft Downtime Heatmap
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Visual representation of downtime intensity per aircraft over the last 12 months.
        Click on a cell to drill down into specific aircraft/month details.
      </p>
      <AircraftHeatmap 
        data={heatmapData} 
        isLoading={isLoading}
        onCellClick={handleCellClick}
      />
    </div>
  );
}

// Aircraft Reliability Cards Wrapper Component
function AircraftReliabilityCards({
  dateRange,
  aircraftFilter,
  fleetFilter,
}: {
  dateRange: DateRange;
  aircraftFilter: string;
  fleetFilter: string;
}) {
  const { data: eventsData, isLoading } = useAOGEvents({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    fleetGroup: fleetFilter || undefined,
  });

  const { data: aircraftData } = useAircraft();
  const aircraft = aircraftData?.data || [];

  // Calculate reliability scores
  const reliabilityData = useMemo(() => {
    if (!eventsData || !aircraft) return { mostReliable: [], needsAttention: [] };

    // Group events by aircraft
    const aircraftEvents = new Map<string, AOGEvent[]>();
    (eventsData as AOGEvent[]).forEach((event) => {
      const aircraftId = String(event.aircraftId);
      if (!aircraftEvents.has(aircraftId)) {
        aircraftEvents.set(aircraftId, []);
      }
      aircraftEvents.get(aircraftId)!.push(event);
    });

    // Calculate reliability data for each aircraft
    const reliabilityDataArray: AircraftReliabilityData[] = aircraft.map((ac) => {
      const aircraftId = ac._id || ac.id || '';
      const events = aircraftEvents.get(aircraftId) || [];
      
      const eventCount = events.length;
      const totalDowntimeHours = events.reduce(
        (sum, e) => sum + (e.totalDowntimeHours || 0),
        0
      );

      return {
        aircraftId,
        registration: ac.registration,
        eventCount,
        totalDowntimeHours,
      };
    });

    // Calculate scores and trends
    const withScores = calculateReliabilityScores(reliabilityDataArray);

    // Get top 5 most reliable and top 5 needing attention
    const mostReliable = getMostReliable(withScores, 5);
    const needsAttention = getNeedsAttention(withScores, 5);

    return { mostReliable, needsAttention };
  }, [eventsData, aircraft]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Aircraft Reliability Scores
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Reliability scores (0-100) based on event frequency and total downtime.
        Higher scores indicate more reliable aircraft.
      </p>
      <ReliabilityScoreCards
        mostReliable={reliabilityData.mostReliable}
        needsAttention={reliabilityData.needsAttention}
        isLoading={isLoading}
      />
    </div>
  );
}

export function AOGAnalyticsPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>('allTime');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [fleetFilter, setFleetFilter] = useState<string>('');

  // Progressive loading state
  const [loadPriority2, setLoadPriority2] = useState(false);
  const [loadPriority3, setLoadPriority3] = useState(false);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to clear filters
      if (e.key === 'Escape') {
        setAircraftFilter('');
        setFleetFilter('');
        setDatePreset('allTime');
      }

      // Keyboard shortcuts for date presets (Alt + number)
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setDatePreset('allTime');
            break;
          case '2':
            e.preventDefault();
            setDatePreset('last7days');
            break;
          case '3':
            e.preventDefault();
            setDatePreset('last30days');
            break;
          case '4':
            e.preventDefault();
            setDatePreset('thisMonth');
            break;
          case '5':
            e.preventDefault();
            setDatePreset('lastMonth');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Progressive loading: Priority 2 queries load after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadPriority2(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Progressive loading: Priority 3 queries load after 1000ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadPriority3(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Priority 1: Critical data (loads immediately)
  const { data: aircraftData } = useAircraft();
  const { data: eventsData } = useAOGEvents({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    fleetGroup: fleetFilter || undefined,
  });
  
  // Fetch three-bucket analytics (Priority 1)
  const { data: threeBucketData, isLoading: isLoadingBuckets } = useThreeBucketAnalytics({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    fleetGroup: fleetFilter || undefined,
  });

  // Priority 2: Important visualizations (loads after 500ms)
  // These will be used by chart components in future tasks (4.x, 5.x, 7.x)
  const { data: monthlyTrendData, isLoading: isLoadingMonthlyTrend } = useMonthlyTrend(
    {
      ...dateRange,
      aircraftId: aircraftFilter || undefined,
      fleetGroup: fleetFilter || undefined,
    },
    { enabled: loadPriority2 }
  );

  const { data: categoryBreakdownData, isLoading: isLoadingCategoryBreakdown, error: categoryBreakdownError } = useCategoryBreakdown(
    {
      ...dateRange,
      aircraftId: aircraftFilter || undefined,
      fleetGroup: fleetFilter || undefined,
    },
    { enabled: loadPriority2 }
  );

  // Debug logging for category breakdown
  useEffect(() => {
    if (loadPriority2) {
      console.log('📊 Category Breakdown Debug:', {
        isLoading: isLoadingCategoryBreakdown,
        hasData: !!categoryBreakdownData,
        dataLength: categoryBreakdownData?.length,
        data: categoryBreakdownData,
        error: categoryBreakdownError,
        filters: { dateRange, aircraftFilter, fleetFilter },
      });
    }
  }, [categoryBreakdownData, isLoadingCategoryBreakdown, categoryBreakdownError, loadPriority2, dateRange, aircraftFilter, fleetFilter]);

  // Priority 3: Nice-to-have analytics (loads after 1000ms)
  // These will be used by predictive analytics components in future tasks (9.x)
  const { data: forecastData, isLoading: isLoadingForecast } = useForecast(
    {
      ...dateRange,
      aircraftId: aircraftFilter || undefined,
      fleetGroup: fleetFilter || undefined,
    },
    { enabled: loadPriority3 }
  );

  const { data: insightsData, isLoading: isLoadingInsights } = useInsights(
    {
      ...dateRange,
      aircraftId: aircraftFilter || undefined,
      fleetGroup: fleetFilter || undefined,
    },
    { enabled: loadPriority3 }
  );

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

  // Calculate total cost from events
  const totalCost = useMemo(() => {
    return events.reduce(
      (sum, e) => {
        // Use new simplified cost fields if available, fallback to legacy fields
        const internalCost = e.internalCost || e.costLabor || 0;
        const externalCost = e.externalCost || (e.costParts || 0) + (e.costExternal || 0);
        return sum + internalCost + externalCost;
      },
      0
    );
  }, [events]);

  // Default bucket data when loading or no data
  const defaultBuckets: ThreeBucketBreakdown = {
    technical: { totalHours: 0, averageHours: 0, percentage: 0 },
    procurement: { totalHours: 0, averageHours: 0, percentage: 0 },
    ops: { totalHours: 0, averageHours: 0, percentage: 0 },
  };

  const buckets = threeBucketData?.buckets || defaultBuckets;
  const summary = threeBucketData?.summary || {
    totalEvents: 0,
    activeEvents: 0,
    totalDowntimeHours: 0,
    averageDowntimeHours: 0,
  };
  const byAircraft = threeBucketData?.byAircraft || [];

  // Compute bucket trend data from events (last 12 months)
  const bucketTrendData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Group events by month and calculate bucket totals
    const monthlyBuckets = new Map<string, { technical: number; procurement: number; ops: number }>();

    events.forEach((event) => {
      // Only include events with milestone data
      if (!event.technicalTimeHours && !event.procurementTimeHours && !event.opsTimeHours) {
        return;
      }

      const month = format(new Date(event.detectedAt), 'yyyy-MM');
      const existing = monthlyBuckets.get(month) || { technical: 0, procurement: 0, ops: 0 };

      monthlyBuckets.set(month, {
        technical: existing.technical + (event.technicalTimeHours || 0),
        procurement: existing.procurement + (event.procurementTimeHours || 0),
        ops: existing.ops + (event.opsTimeHours || 0),
      });
    });

    // Convert to array and sort by month
    const trendData = Array.from(monthlyBuckets.entries())
      .map(([month, buckets]) => ({
        month,
        technicalHours: buckets.technical,
        procurementHours: buckets.procurement,
        opsHours: buckets.ops,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    return trendData;
  }, [events]);

  // Generate filename for PDF export
  const pdfFilename = useMemo(() => {
    const dateStr = datePreset === 'allTime' 
      ? 'all-time' 
      : `${dateRange.startDate || 'start'}-to-${dateRange.endDate || 'end'}`;
    const filterStr = fleetFilter ? `-${fleetFilter}` : aircraftFilter ? `-${aircraftMap.get(aircraftFilter)?.registration || 'aircraft'}` : '';
    return `aog-analytics-${dateStr}${filterStr}.pdf`;
  }, [datePreset, dateRange, fleetFilter, aircraftFilter, aircraftMap]);

  // Prepare Pareto chart data (top 10 reason codes by count)
  const paretoData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Count events by reason code
    const reasonCodeCounts = new Map<string, number>();
    events.forEach((event) => {
      const reasonCode = event.reasonCode || 'Unknown';
      reasonCodeCounts.set(reasonCode, (reasonCodeCounts.get(reasonCode) || 0) + 1);
    });

    // Convert to array and sort by count descending
    const sortedReasonCodes = Array.from(reasonCodeCounts.entries())
      .map(([reasonCode, count]) => ({
        reasonCode,
        count,
        percentage: (count / events.length) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate cumulative percentage
    let cumulative = 0;
    return sortedReasonCodes.map((item) => {
      cumulative += item.percentage;
      return {
        ...item,
        cumulativePercentage: cumulative,
      };
    });
  }, [events]);

  // Prepare responsibility distribution data
  const responsibilityData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Group by responsible party
    const responsibilityMap = new Map<string, { totalHours: number; eventCount: number }>();
    
    events.forEach((event) => {
      const party = event.responsibleParty || 'Other';
      const existing = responsibilityMap.get(party) || { totalHours: 0, eventCount: 0 };
      
      responsibilityMap.set(party, {
        totalHours: existing.totalHours + (event.totalDowntimeHours || 0),
        eventCount: existing.eventCount + 1,
      });
    });

    // Calculate total hours for percentage
    const totalHours = Array.from(responsibilityMap.values()).reduce(
      (sum, item) => sum + item.totalHours,
      0
    );

    // Convert to array format
    return Array.from(responsibilityMap.entries()).map(([responsibleParty, data]) => ({
      responsibleParty: responsibleParty as 'Internal' | 'OEM' | 'Customs' | 'Finance' | 'Other',
      totalHours: data.totalHours,
      eventCount: data.eventCount,
      percentage: totalHours > 0 ? (data.totalHours / totalHours) * 100 : 0,
    }));
  }, [events]);

  // Prepare cost analysis data
  const costAnalysisData = useMemo(() => {
    if (!events || events.length === 0) {
      return {
        monthlyCosts: [],
        costPerHour: 0,
        costPerEvent: 0,
        totalCosts: { totalInternalCost: 0, totalExternalCost: 0, totalCost: 0 },
      };
    }

    // Aggregate costs by month
    const monthlyCosts = aggregateCostsByMonth(events);
    
    // Get last 12 months
    const last12Months = getLastNMonths(monthlyCosts, 12);

    // Calculate total costs
    const totals = calculateTotalCosts(events);

    // Calculate cost efficiency metrics
    const totalDowntime = events.reduce((sum, e) => sum + (e.totalDowntimeHours || 0), 0);
    const costPerHour = calculateCostPerHour(totals.totalCost, totalDowntime);
    const costPerEvent = calculateCostPerEvent(totals.totalCost, events.length);

    return {
      monthlyCosts: last12Months,
      costPerHour,
      costPerEvent,
      totalCosts: totals,
    };
  }, [events]);

  // Calculate risk scores for top 3 high-risk aircraft
  const highRiskAircraft = useMemo(() => {
    if (!events || !aircraft || events.length === 0) return [];

    const aircraftList = aircraft.map((a) => ({
      id: a._id || a.id || '',
      registration: a.registration,
    }));

    const riskScores = calculateRiskScores(aircraftList, events as any[]);
    return getHighRiskAircraft(riskScores, 3);
  }, [events, aircraft]);

  return (
    <div className="space-y-6">
      {/* Header with PDF Export */}
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          <GlossaryTerm term="AOG" /> Analytics - Three-Bucket Breakdown
        </motion.h1>
        
        {/* PDF Export Button */}
        <EnhancedAOGAnalyticsPDFExport
          filters={{
            dateRange,
            aircraftFilter,
            fleetFilter,
          }}
          summary={{
            totalEvents: summary.totalEvents,
            activeEvents: summary.activeEvents,
            totalDowntimeHours: summary.totalDowntimeHours,
            averageDowntimeHours: summary.averageDowntimeHours,
            totalCost,
          }}
          insights={insightsData?.insights || []}
          filename={pdfFilename}
          label="Export PDF"
        />
      </div>

      {/* Keyboard shortcuts hint */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/30 border border-border rounded-lg px-4 py-2 text-xs text-muted-foreground"
      >
        <span className="font-medium">Keyboard shortcuts:</span> Alt+1-5 for date presets, Esc to clear filters
      </motion.div>

      {/* Wrap all content for PDF export */}
      <div id="aog-analytics-content">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-end gap-4">
          {/* Date Preset Buttons */}
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-sm font-medium text-muted-foreground">
              Date Range <span className="text-xs text-muted-foreground/70">(Alt+1-5)</span>
            </label>
            <div className="flex flex-wrap rounded-lg border border-border overflow-hidden">
              {(['allTime', 'last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map(
                (preset, index) => (
                  <button
                    key={preset}
                    onClick={() => setDatePreset(preset)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDatePreset(preset);
                      }
                    }}
                    aria-label={`${preset === 'allTime' ? 'All Time' : preset === 'last7days' ? '7 Days' : preset === 'last30days' ? '30 Days' : preset === 'thisMonth' ? 'This Month' : 'Last Month'} (Alt+${index + 1})`}
                    aria-pressed={datePreset === preset}
                    tabIndex={0}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors flex-1 md:flex-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                      datePreset === preset
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {preset === 'allTime' && 'All Time'}
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
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-sm font-medium text-muted-foreground">Custom Range</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.startDate || '' : dateRange.startDate || ''}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value || undefined }));
                }}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground w-full sm:w-auto"
              />
              <span className="text-muted-foreground text-center sm:text-left">to</span>
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.endDate || '' : dateRange.endDate || ''}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, endDate: e.target.value || undefined }));
                }}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground w-full sm:w-auto"
              />
            </div>
          </div>

          {/* Fleet Filter */}
          <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[140px]">
            <label className="text-sm font-medium text-muted-foreground">Fleet Group</label>
            <select
              value={fleetFilter}
              onChange={(e) => {
                setFleetFilter(e.target.value);
                // Clear aircraft filter when fleet changes
                if (e.target.value) {
                  setAircraftFilter('');
                }
              }}
              className={`h-9 px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 w-full ${
                fleetFilter
                  ? 'bg-primary/10 border-primary text-primary font-medium'
                  : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <option value="">All Fleets</option>
              {FLEET_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Aircraft Filter */}
          <div className="flex flex-col gap-2 w-full md:w-auto md:min-w-[180px]">
            <label className="text-sm font-medium text-muted-foreground">Aircraft</label>
            <AircraftSelect
              value={aircraftFilter}
              onChange={(value) => {
                setAircraftFilter(value);
                // Clear fleet filter when specific aircraft is selected
                if (value) {
                  setFleetFilter('');
                }
              }}
              includeAll
              allLabel="All Aircraft"
            />
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="mt-6">
        <SummaryCards
          totalEvents={summary.totalEvents}
          activeEvents={summary.activeEvents}
          totalDowntimeHours={summary.totalDowntimeHours}
          averageDowntimeHours={summary.averageDowntimeHours}
          totalCost={totalCost}
        />
      </div>

      {/* Three-Bucket Summary Cards */}
      <div className="mt-6">
        <BucketSummaryCards data={buckets} />
      </div>

      {/* Three-Bucket Charts with Legacy Data Handling */}
      <div className="mt-6">
        <ThreeBucketChart 
          data={buckets} 
          isLoading={isLoadingBuckets}
          legacyEventCount={threeBucketData?.legacyEventCount || 0}
          totalEventCount={summary.totalEvents}
          legacyDowntimeHours={threeBucketData?.legacyDowntimeHours || 0}
        />
      </div>

      {/* Enhanced Three-Bucket Visualizations */}
      <motion.div
        id="three-bucket-section"
        className="space-y-6 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <AnalyticsSectionErrorBoundary sectionName="Bucket Trend Chart">
          <BucketTrendChart 
            data={bucketTrendData} 
            isLoading={isLoadingBuckets}
          />
        </AnalyticsSectionErrorBoundary>

        <AnalyticsSectionErrorBoundary sectionName="Waterfall Chart">
          <WaterfallChart
            technicalHours={buckets.technical.totalHours}
            procurementHours={buckets.procurement.totalHours}
            opsHours={buckets.ops.totalHours}
            totalHours={summary.totalDowntimeHours}
            isLoading={isLoadingBuckets}
          />
        </AnalyticsSectionErrorBoundary>
      </motion.div>

      {/* Per-Aircraft Breakdown with Export */}
      <div className="mt-8">
        <AOGAircraftBreakdownTable 
          data={byAircraft} 
          filterInfo={{
            dateRange,
            fleetGroup: fleetFilter || undefined,
            aircraftFilter: aircraftFilter ? aircraftMap.get(aircraftFilter)?.registration : undefined,
          }}
          isLoading={isLoadingBuckets}
        />
      </div>

      {/* Trend Analysis Section */}
      <motion.div
        id="trend-analysis-section"
        className="space-y-6 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-foreground"
        >
          Trend Analysis
        </motion.h2>

        {/* Monthly Trend Chart */}
        <AnalyticsSectionErrorBoundary sectionName="Monthly Trend Chart">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Monthly Event Count & Downtime
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track event frequency and total downtime hours over time to identify patterns and trends.
            </p>
            {isLoadingMonthlyTrend ? (
              <ChartSkeleton />
            ) : monthlyTrendData?.trends && monthlyTrendData.trends.length > 0 ? (
              <MonthlyTrendChart 
                data={monthlyTrendData.trends}
                isLoading={false}
              />
            ) : (
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">No trend data available for the selected period</p>
              </div>
            )}
          </motion.div>
        </AnalyticsSectionErrorBoundary>

        {/* Moving Average Chart */}
        <AnalyticsSectionErrorBoundary sectionName="Moving Average Chart">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              3-Month Moving Average
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Smooth out volatility with a 3-month moving average to reveal underlying trends.
            </p>
            {isLoadingMonthlyTrend ? (
              <ChartSkeleton />
            ) : monthlyTrendData?.trends && monthlyTrendData.trends.length > 0 ? (
              <MovingAverageChart 
                data={monthlyTrendData.trends.map((trend, index) => ({
                  month: trend.month,
                  actual: trend.totalDowntimeHours,
                  movingAverage: monthlyTrendData.movingAverage[index]?.value || trend.totalDowntimeHours,
                }))}
                isLoading={false}
              />
            ) : (
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">No trend data available for the selected period</p>
              </div>
            )}
          </motion.div>
        </AnalyticsSectionErrorBoundary>

        {/* Year-over-Year Comparison Chart */}
        <AnalyticsSectionErrorBoundary sectionName="Year-over-Year Comparison">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Year-over-Year Comparison
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Compare current year performance against the previous year to measure improvement.
            </p>
            {isLoadingMonthlyTrend ? (
              <ChartSkeleton />
            ) : monthlyTrendData?.trends && monthlyTrendData.trends.length > 0 ? (
              (() => {
                // Split data into current year and previous year
                const currentYear = new Date().getFullYear();
                const currentYearData = monthlyTrendData.trends
                  .filter(t => t.month.startsWith(String(currentYear)))
                  .map(t => ({ month: t.month, value: t.totalDowntimeHours }));
                
                const previousYearData = monthlyTrendData.trends
                  .filter(t => t.month.startsWith(String(currentYear - 1)))
                  .map(t => ({ 
                    month: t.month.replace(String(currentYear - 1), String(currentYear)), 
                    value: t.totalDowntimeHours 
                  }));

                return currentYearData.length > 0 ? (
                  <YearOverYearChart 
                    currentYearData={currentYearData}
                    previousYearData={previousYearData}
                    isLoading={false}
                  />
                ) : (
                  <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground">
                      Insufficient data for year-over-year comparison. Need data from current and previous year.
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">No trend data available for the selected period</p>
              </div>
            )}
          </motion.div>
        </AnalyticsSectionErrorBoundary>
      </motion.div>

      {/* Aircraft Performance Section */}
      <motion.div
        id="aircraft-performance-section"
        className="space-y-6 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-foreground"
        >
          Aircraft Performance
        </motion.h2>

        {/* Aircraft Heatmap */}
        <AnalyticsSectionErrorBoundary sectionName="Aircraft Heatmap">
          <AircraftPerformanceHeatmap
            dateRange={dateRange}
            aircraftFilter={aircraftFilter}
            fleetFilter={fleetFilter}
          />
        </AnalyticsSectionErrorBoundary>

        {/* Reliability Score Cards */}
        <AnalyticsSectionErrorBoundary sectionName="Reliability Score Cards">
          <AircraftReliabilityCards
            dateRange={dateRange}
            aircraftFilter={aircraftFilter}
            fleetFilter={fleetFilter}
          />
        </AnalyticsSectionErrorBoundary>
      </motion.div>

      {/* Root Cause Analysis Section */}
      <motion.div
        id="root-cause-section"
        className="space-y-6 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-foreground"
        >
          Root Cause Analysis
        </motion.h2>

        {/* Pareto Chart - Top 10 Reason Codes */}
        <AnalyticsSectionErrorBoundary sectionName="Pareto Chart">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Top Reason Codes (Pareto Analysis)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Identify the most frequent issues using the Pareto principle. The 80% line shows which issues account for the majority of events.
            </p>
            <ParetoChart 
              data={paretoData}
              isLoading={false}
            />
          </motion.div>
        </AnalyticsSectionErrorBoundary>

        {/* Category Breakdown Pie Chart */}
        <AnalyticsSectionErrorBoundary sectionName="Category Breakdown">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Event Category Distribution
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Breakdown of events by category: AOG (critical), Unscheduled (unexpected), and Scheduled (planned maintenance).
            </p>
            {isLoadingCategoryBreakdown ? (
              <ChartSkeleton />
            ) : categoryBreakdownData && Array.isArray(categoryBreakdownData) && categoryBreakdownData.length > 0 ? (
              <CategoryBreakdownPie 
                data={categoryBreakdownData}
                isLoading={false}
              />
            ) : (
              <div className="h-80 flex flex-col items-center justify-center bg-muted/20 rounded-lg border border-border gap-2">
                <p className="text-sm text-muted-foreground">No category data available for the selected period</p>
                {categoryBreakdownError && (
                  <p className="text-xs text-destructive">Error: {String(categoryBreakdownError)}</p>
                )}
                {!isLoadingCategoryBreakdown && !categoryBreakdownData && (
                  <p className="text-xs text-muted-foreground">Data is undefined - check console for details</p>
                )}
                {categoryBreakdownData && !Array.isArray(categoryBreakdownData) && (
                  <p className="text-xs text-muted-foreground">Data format error - expected array, got {typeof categoryBreakdownData}</p>
                )}
                {categoryBreakdownData && Array.isArray(categoryBreakdownData) && categoryBreakdownData.length === 0 && (
                  <p className="text-xs text-muted-foreground">API returned empty array - no events match the filters</p>
                )}
              </div>
            )}
          </motion.div>
        </AnalyticsSectionErrorBoundary>

        {/* Responsibility Distribution Chart */}
        <AnalyticsSectionErrorBoundary sectionName="Responsibility Distribution">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Downtime by Responsible Party
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Total downtime hours attributed to each responsible party. Helps identify whether issues are internal or external.
            </p>
            <ResponsibilityDistributionChart 
              data={responsibilityData}
              isLoading={false}
            />
          </motion.div>
        </AnalyticsSectionErrorBoundary>
      </motion.div>

      {/* Cost Analysis Section */}
      <motion.div
        id="cost-analysis-section"
        className="space-y-6 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-foreground"
        >
          Cost Analysis
        </motion.h2>

        {/* Cost Breakdown Chart */}
        <AnalyticsSectionErrorBoundary sectionName="Cost Breakdown Chart">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Monthly Cost Breakdown
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track internal vs external costs over time. The trend line shows total cost trajectory.
            </p>
            {costAnalysisData.monthlyCosts.length > 0 ? (
              <CostBreakdownChart 
                data={costAnalysisData.monthlyCosts}
                isLoading={false}
              />
            ) : (
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">No cost data available for the selected period</p>
              </div>
            )}
          </motion.div>
        </AnalyticsSectionErrorBoundary>

        {/* Cost Efficiency Metrics */}
        <AnalyticsSectionErrorBoundary sectionName="Cost Efficiency Metrics">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Cost Efficiency Metrics
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Key cost efficiency indicators showing cost per hour of downtime and cost per event.
            </p>
            <CostEfficiencyMetrics 
              data={{
                costPerHour: costAnalysisData.costPerHour,
                costPerEvent: costAnalysisData.costPerEvent,
                sparklineData: costAnalysisData.monthlyCosts.slice(-6).map(m => ({ value: m.totalCost })),
              }}
              isLoading={false}
            />
          </motion.div>
        </AnalyticsSectionErrorBoundary>
      </motion.div>

      {/* Predictive Analytics Section */}
      <motion.div
        id="predictive-section"
        className="space-y-6 mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.8 }}
      >
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold text-foreground"
        >
          Predictive Analytics
        </motion.h2>

        {/* Forecast Chart */}
        <AnalyticsSectionErrorBoundary sectionName="Forecast Chart">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              3-Month Downtime Forecast
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Predictive forecast based on historical trends using linear regression. 
              The shaded area represents the confidence interval (±20%).
            </p>
            {isLoadingForecast ? (
              <ChartSkeleton />
            ) : forecastData?.historical && forecastData.historical.length > 0 ? (
              <ForecastChart 
                historical={forecastData.historical}
                forecast={forecastData.forecast}
                isLoading={false}
              />
            ) : (
              <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  Insufficient historical data for forecast. Need at least 3 months of data.
                </p>
              </div>
            )}
          </motion.div>
        </AnalyticsSectionErrorBoundary>

        {/* Risk Score Gauges - Top 3 High-Risk Aircraft */}
        {highRiskAircraft.length > 0 && (
          <AnalyticsSectionErrorBoundary sectionName="Risk Score Gauges">
            <motion.div
              className="bg-card border border-border rounded-lg p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                High-Risk Aircraft Assessment
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Risk scores (0-100) for aircraft requiring attention. Scores are based on recent event frequency, 
                downtime trends, cost trends, and recurring issues.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highRiskAircraft.map((aircraft, index) => (
                  <motion.div
                    key={aircraft.aircraftId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    <RiskScoreGauge
                      aircraftId={aircraft.aircraftId}
                      registration={aircraft.registration}
                      riskScore={aircraft.riskScore}
                      factors={aircraft.factors}
                      isLoading={false}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnalyticsSectionErrorBoundary>
        )}

        {/* Insights Panel */}
        <AnalyticsSectionErrorBoundary sectionName="Insights Panel">
          <motion.div
            className="bg-card border border-border rounded-lg p-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Automated Insights & Recommendations
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              AI-generated insights based on pattern detection in your AOG data. 
              These recommendations are designed to help you identify and address issues proactively.
            </p>
            {isLoadingInsights ? (
              <ChartSkeleton />
            ) : (
              <InsightsPanel 
                insights={insightsData?.insights || []}
                isLoading={false}
              />
            )}
          </motion.div>
        </AnalyticsSectionErrorBoundary>
      </motion.div>

      {/* Event Timeline */}
      <div className="mt-12">
        <EventTimeline events={events} aircraftMap={aircraftMap} />
      </div>
      </div> {/* End of aog-analytics-content */}
    </div>
  );
}
