import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { ChartContainer, BarChartWrapper, PieChartWrapper, TrendChart } from '@/components/ui/Charts';
import { AnalyticsPDFExport } from '@/components/ui/AnalyticsPDFExport';
import {
  useCategoryBreakdown,
  useLocationHeatmap,
  useDurationDistribution,
  useAircraftReliability,
  useMonthlyTrend,
  useInsights,
} from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { 
  CategoryBreakdownItem,
  LocationHeatmapItem,
  DurationDistributionItem,
  AircraftReliabilityItem,
} from '@/types';

type DatePreset = 'allTime' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

// Category colors matching CategoryBadge component
const CATEGORY_COLORS: Record<string, string> = {
  aog: '#ef4444',
  unscheduled: '#f59e0b',
  scheduled: '#3b82f6',
  mro: '#8b5cf6',
  cleaning: '#10b981',
};

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'allTime':
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

export function AOGAnalyticsPageEnhanced() {
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
  useAircraft(); // Load aircraft data for filters
  const { data: categoryData, isLoading: loadingCategory } = useCategoryBreakdown({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: locationData, isLoading: loadingLocation } = useLocationHeatmap({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    limit: 5,
  });
  const { data: durationData, isLoading: loadingDuration } = useDurationDistribution({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: reliabilityData, isLoading: loadingReliability } = useAircraftReliability(dateRange);
  const { data: trendData, isLoading: loadingTrend } = useMonthlyTrend({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  const { data: insightsData, isLoading: loadingInsights } = useInsights(dateRange);

  // Transform data for charts
  const categoryChartData = useMemo(() => {
    if (!categoryData?.categories) return [];
    return categoryData.categories.map((item: CategoryBreakdownItem) => ({
      name: item.category.toUpperCase(),
      value: item.count,
      percentage: item.percentage,
      color: CATEGORY_COLORS[item.category] || '#6b7280',
    }));
  }, [categoryData]);

  const locationChartData = useMemo(() => {
    if (!locationData?.locations) return [];
    return locationData.locations.map((item: LocationHeatmapItem) => ({
      name: item.location || 'Unknown',
      count: item.count,
    }));
  }, [locationData]);

  const durationChartData = useMemo(() => {
    if (!durationData?.ranges) return [];
    return durationData.ranges.map((item: DurationDistributionItem) => ({
      name: item.range,
      count: item.count,
    }));
  }, [durationData]);

  const monthlyChartData = useMemo(() => {
    if (!trendData?.trends) return [];
    return trendData.trends.map((item) => ({
      name: item.month,
      count: item.eventCount,
      hours: item.totalDowntimeHours,
    }));
  }, [trendData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          <GlossaryTerm term="AOG" /> Analytics Dashboard
        </motion.h1>
        
        {/* PDF Export Button - Requirements: 13.2, 13.4, 13.5 */}
        <AnalyticsPDFExport
          containerId="aog-analytics-content"
          filename={`aog-analytics-${datePreset === 'allTime' ? 'all-time' : `${dateRange.startDate}-to-${dateRange.endDate}`}.pdf`}
          label="Export PDF"
        />
      </div>

      {/* Wrap content in a container for PDF export */}
      <div id="aog-analytics-content">
        {/* Filters - Requirements: 8.6, 8.7 */}
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
              {(['last7days', 'last30days', 'thisMonth', 'lastMonth', 'allTime'] as DatePreset[]).map(
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
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Custom Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.startDate || '' : dateRange.startDate || ''}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value || undefined }));
                }}
                className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={datePreset === 'custom' ? customRange.endDate || '' : dateRange.endDate || ''}
                onChange={(e) => {
                  setDatePreset('custom');
                  setCustomRange((prev) => ({ ...prev, endDate: e.target.value || undefined }));
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Chart - Requirements: 8.1, 16.4 */}
        <ChartContainer
          title="Category Breakdown"
          subtitle="Event distribution by category"
          height={350}
          delay={0.1}
        >
          {loadingCategory ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categoryChartData.length > 0 ? (
            <PieChartWrapper data={categoryChartData} innerRadius={70} outerRadius={100} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          )}
        </ChartContainer>

        {/* Location Heatmap Chart - Requirements: 8.2, 16.3 */}
        <ChartContainer
          title="Top 5 Locations"
          subtitle="Events by location"
          height={350}
          delay={0.15}
        >
          {loadingLocation ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : locationChartData.length > 0 ? (
            <BarChartWrapper
              data={locationChartData}
              bars={[{ dataKey: 'count', color: '#3b82f6', name: 'Events' }]}
              layout="horizontal"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          )}
        </ChartContainer>

        {/* Duration Distribution Chart - Requirements: 8.3, 6.5 */}
        <ChartContainer
          title="Duration Distribution"
          subtitle="Events by downtime duration"
          height={350}
          delay={0.2}
        >
          {loadingDuration ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : durationChartData.length > 0 ? (
            <BarChartWrapper
              data={durationChartData}
              bars={[{ dataKey: 'count', color: '#f59e0b', name: 'Events' }]}
              layout="horizontal"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          )}
        </ChartContainer>

        {/* Monthly Trend Chart - Requirements: 8.5, 16.5 */}
        <ChartContainer
          title="Monthly Trend"
          subtitle="Event count and total hours over time"
          height={350}
          delay={0.25}
        >
          {loadingTrend ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : monthlyChartData.length > 0 ? (
            <TrendChart
              data={monthlyChartData}
              lines={[
                { dataKey: 'count', color: '#3b82f6', name: 'Event Count' },
                { dataKey: 'hours', color: '#ef4444', name: 'Total Hours' },
              ]}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No data available
            </div>
          )}
        </ChartContainer>
      </div>

      {/* Aircraft Reliability Ranking - Requirements: 8.4, 16.1 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Aircraft Reliability</h3>
        {loadingReliability ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reliabilityData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Reliable */}
            <div>
              <h4 className="text-sm font-medium text-green-600 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Most Reliable (Top 3)
              </h4>
              <div className="space-y-2">
                {reliabilityData.mostReliable.map((item: AircraftReliabilityItem, index: number) => (
                  <div
                    key={item.aircraftId}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                      <span className="font-medium text-foreground">{item.registration}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{item.eventCount} events</div>
                      <div className="text-xs text-muted-foreground">{item.totalHours.toFixed(1)} hrs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            <div>
              <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Needs Attention (Top 3)
              </h4>
              <div className="space-y-2">
                {reliabilityData.needsAttention.map((item: AircraftReliabilityItem, index: number) => (
                  <div
                    key={item.aircraftId}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-600">#{index + 1}</span>
                      <span className="font-medium text-foreground">{item.registration}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{item.eventCount} events</div>
                      <div className="text-xs text-muted-foreground">{item.totalHours.toFixed(1)} hrs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No data available</div>
        )}
      </motion.div>

      {/* Insights Panel - Requirements: 16.1-16.8 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">Auto-Generated Insights</h3>
        {loadingInsights ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : insightsData && insightsData.insights && insightsData.insights.length > 0 ? (
          <div className="space-y-4">
            {/* Automated Insights */}
            {insightsData.insights.map((insight, index) => (
              <div
                key={insight.id || index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'warning'
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                    : insight.type === 'success'
                    ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <h4 className="text-sm font-semibold text-foreground mb-1">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                {insight.metric !== undefined && (
                  <p className="text-xs font-medium text-foreground">
                    Metric: {insight.metric.toFixed(1)}
                  </p>
                )}
                {insight.recommendation && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </p>
                )}
              </div>
            ))}

            {/* Data Quality */}
            {insightsData.dataQuality && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="text-sm font-semibold text-foreground mb-2">Data Quality</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {insightsData.dataQuality.completenessPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Completeness</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {insightsData.dataQuality.totalEvents}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Events</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {insightsData.dataQuality.legacyEventCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Legacy Events</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No insights available</div>
        )}
      </motion.div>
      </div> {/* End of analytics-content */}
    </div>
  );
}
