import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ChartContainer, TrendChart, BarChartWrapper } from '@/components/ui/Charts';
import { ExportButton } from '@/components/ui/ExportButton';
import { FilterBar, FilterGroup, FilterInput } from '@/components/ui/FilterBar';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { useDashboardKPIs, useDashboardTrends, useAOGSummary } from '@/hooks/useDashboard';
import {
  useFleetHealthScore,
  useExecutiveAlerts,
  usePeriodComparison,
  useFleetComparison,
  useMaintenanceForecast,
  useRecentActivity,
  useYoYComparison,
  useDefectPatterns,
  useDataQuality,
} from '@/hooks/useDashboardExecutive';
import { Plane, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

// Executive Dashboard Components
import { FleetHealthGauge } from '@/components/ui/FleetHealthGauge';
import { AlertsPanel } from '@/components/ui/AlertsPanel';
import { StatusSummaryBar } from '@/components/ui/StatusSummaryBar';
import { KPICardEnhanced } from '@/components/ui/KPICardEnhanced';
import { FleetComparison } from '@/components/ui/FleetComparison';
import { MaintenanceForecast } from '@/components/ui/MaintenanceForecast';
import { RecentActivityFeed } from '@/components/ui/RecentActivityFeed';
import { YoYComparison } from '@/components/ui/YoYComparison';
import { DefectPatterns } from '@/components/ui/DefectPatterns';
import { DataQualityIndicator } from '@/components/ui/DataQualityIndicator';
import { ActiveAOGEventsWidget } from '@/components/ui/ActiveAOGEventsWidget';
import { FleetAvailabilityImpactWidget } from '@/components/ui/FleetAvailabilityImpactWidget';
import { AOGMiniTrendChart } from '@/components/ui/AOGMiniTrendChart';
import { ExecutivePDFExport } from '@/components/ui/ExecutivePDFExport';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ComingSoonSection } from '@/components/ui/ComingSoonSection';

// Icon wrapper components
const PlaneIcon = () => <Plane className="w-6 h-6" />;
const ClockIcon = () => <Clock className="w-6 h-6" />;
const CycleIcon = () => <RefreshCw className="w-6 h-6" />;
const AlertIcon = () => <AlertTriangle className="w-6 h-6" />;

type DatePreset = 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRange {
  startDate: string;
  endDate: string;
  [key: string]: unknown;
}


function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'today':
      return {
        startDate: format(today, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
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

export function DashboardPage() {
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [trendPeriod, setTrendPeriod] = useState<'day' | 'month' | 'year'>('day');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Existing dashboard hooks
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useDashboardKPIs(dateRange);
  const { data: trends, isLoading: trendsLoading } = useDashboardTrends({
    ...dateRange,
    period: trendPeriod,
  });
  const { data: aogSummary, isLoading: aogSummaryLoading } = useAOGSummary();

  // Executive dashboard hooks
  const { data: healthScore, isLoading: healthScoreLoading } = useFleetHealthScore(dateRange);
  const { data: alerts, isLoading: alertsLoading } = useExecutiveAlerts();
  const { data: periodComparison, isLoading: periodComparisonLoading } = usePeriodComparison(dateRange);
  const { data: fleetComparison, isLoading: fleetComparisonLoading } = useFleetComparison(dateRange);
  const { data: maintenanceForecast, isLoading: maintenanceForecastLoading } = useMaintenanceForecast();
  const { data: recentActivity, isLoading: recentActivityLoading } = useRecentActivity();
  const { data: yoyComparison, isLoading: yoyComparisonLoading } = useYoYComparison(dateRange);
  const { data: defectPatterns, isLoading: defectPatternsLoading } = useDefectPatterns(dateRange);
  const { data: dataQuality, isLoading: dataQualityLoading } = useDataQuality();


  // Transform trend data for charts
  const availabilityChartData = useMemo(() => {
    if (!trends?.availability) return [];
    return trends.availability.map((point) => ({
      name: point.period,
      availability: point.availabilityPercentage,
    }));
  }, [trends]);

  const utilizationChartData = useMemo(() => {
    if (!trends?.utilization) return [];
    return trends.utilization.map((point) => ({
      name: point.period,
      flightHours: point.flightHours,
      cycles: point.cycles,
    }));
  }, [trends]);

  // Calculate status summary from KPIs and data quality
  // Note: AOG count from KPIs is the number of AOG EVENTS, not aircraft count
  // We estimate aircraft status based on availability and AOG events
  const statusSummary = useMemo(() => {
    // Get total aircraft count from data quality coverage (actual DB count)
    const total = dataQuality?.coverage?.dailyStatus?.total ?? 17; // 17 is the seeded fleet size
    
    // AOG aircraft: estimate based on active AOG events (capped at reasonable number)
    // Each AOG event typically grounds 1 aircraft, but cap at 30% of fleet
    const aogEvents = kpis?.activeAOGCount ?? 0;
    const aog = Math.min(aogEvents, Math.floor(total * 0.3));
    
    // Maintenance aircraft: estimate from availability loss (excluding AOG)
    // If availability is 90%, roughly 10% of fleet-hours are in maintenance
    const availabilityLoss = 100 - (kpis?.fleetAvailabilityPercentage ?? 100);
    // Convert availability loss to estimated aircraft count (rough: 10% loss ≈ 1-2 aircraft)
    const estimatedMaintenanceAircraft = Math.max(0, Math.round((availabilityLoss / 100) * total) - aog);
    const inMaintenance = Math.min(estimatedMaintenanceAircraft, total - aog);
    
    // Active aircraft: remaining after AOG and maintenance
    const active = Math.max(0, total - aog - inMaintenance);
    
    return { active, inMaintenance, aog, total };
  }, [kpis, dataQuality]);

  const handleKPIClick = (metric: string) => {
    switch (metric) {
      case 'availability':
        navigate('/availability');
        break;
      case 'flightHours':
      case 'cycles':
        navigate('/availability');
        break;
      case 'aog':
        navigate('/aog/list');
        break;
    }
  };

  return (
    <div className="space-y-6" data-pdf-content>
      {/* Header with Filter Bar and Data Quality Indicator */}
      <FilterBar justify="between" className="mb-2">
        <FilterGroup>
          <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
            {(['last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${datePreset === preset
                    ? 'bg-background text-primary shadow-sm border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }
                `}
              >
                {preset === 'last7days' && '7 Days'}
                {preset === 'last30days' && '30 Days'}
                {preset === 'thisMonth' && 'This Month'}
                {preset === 'lastMonth' && 'Last Month'}
              </button>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Custom Range:">
          <FilterInput
            type="date"
            value={datePreset === 'custom' ? customRange.startDate : dateRange.startDate}
            onChange={(e) => {
              setDatePreset('custom');
              setCustomRange((prev) => ({ ...prev, startDate: e.target.value }));
            }}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <FilterInput
            type="date"
            value={datePreset === 'custom' ? customRange.endDate : dateRange.endDate}
            onChange={(e) => {
              setDatePreset('custom');
              setCustomRange((prev) => ({ ...prev, endDate: e.target.value }));
            }}
          />
          <DataQualityIndicator data={dataQuality} isLoading={dataQualityLoading} />
          <ExecutivePDFExport dateRange={dateRange} />
          <ExportButton
            exportType="dashboard"
            filters={dateRange}
            filename={`dashboard-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
            label="Export"
          />
        </FilterGroup>
      </FilterBar>

      {/* Error State */}
      {kpisError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive"
        >
          Failed to load dashboard data. Please try again later.
        </motion.div>
      )}


      {/* Executive Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Health Gauge */}
        <div className="flex justify-center lg:justify-start">
          <FleetHealthGauge data={healthScore} isLoading={healthScoreLoading} />
        </div>
        
        {/* Alerts Panel */}
        <div className="lg:col-span-2">
          <AlertsPanel data={alerts} isLoading={alertsLoading} maxHeight={220} />
        </div>
      </div>

      {/* Status Summary Bar */}
      <StatusSummaryBar
        active={statusSummary.active}
        inMaintenance={statusSummary.inMaintenance}
        aog={statusSummary.aog}
        total={statusSummary.total}
        isLoading={kpisLoading || dataQualityLoading}
      />

      {/* Enhanced KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardEnhanced
          title="Fleet Availability"
          value={kpisLoading ? '...' : `${kpis?.fleetAvailabilityPercentage?.toFixed(1) ?? 0}%`}
          subtitle={kpis ? <>{kpis.totalFmcHours.toFixed(0)} <GlossaryTerm term="FMC" /> / {kpis.totalPosHours.toFixed(0)} <GlossaryTerm term="POS Hours" display="POS" /> hours</> : undefined}
          icon={<PlaneIcon />}
          delta={periodComparison?.deltas?.fleetAvailability}
          onClick={() => handleKPIClick('availability')}
          isLoading={kpisLoading || periodComparisonLoading}
          className={kpis && kpis.fleetAvailabilityPercentage < 90 ? 'border-yellow-500/50' : ''}
        />

        <KPICardEnhanced
          title="Total Flight Hours"
          value={kpisLoading ? '...' : kpis?.totalFlightHours?.toLocaleString(undefined, { maximumFractionDigits: 1 }) ?? 0}
          subtitle={<>Airframe <GlossaryTerm term="TTSN" display="hours" /> in period</>}
          icon={<ClockIcon />}
          delta={periodComparison?.deltas?.totalFlightHours}
          onClick={() => handleKPIClick('flightHours')}
          isLoading={kpisLoading || periodComparisonLoading}
        />

        <KPICardEnhanced
          title="Total Cycles"
          value={kpisLoading ? '...' : kpis?.totalCycles?.toLocaleString() ?? 0}
          subtitle={<>Flight <GlossaryTerm term="Cycle" display="cycles" /> in period</>}
          icon={<CycleIcon />}
          delta={periodComparison?.deltas?.totalCycles}
          onClick={() => handleKPIClick('cycles')}
          isLoading={kpisLoading || periodComparisonLoading}
        />

        <KPICardEnhanced
          title={<>Active <GlossaryTerm term="AOG" /></>}
          value={kpisLoading ? '...' : kpis?.activeAOGCount ?? 0}
          subtitle="Aircraft on ground"
          icon={<AlertIcon />}
          delta={periodComparison?.deltas?.activeAOGCount}
          invertDelta
          onClick={() => handleKPIClick('aog')}
          isLoading={kpisLoading || periodComparisonLoading}
          className={kpis && kpis.activeAOGCount > 0 ? 'border-red-500/50 bg-red-500/5' : ''}
        />
      </div>

      {/* AOG Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICardEnhanced
          title="Total AOG This Month"
          value={aogSummaryLoading ? '...' : aogSummary?.totalThisMonth ?? 0}
          subtitle="Events detected"
          icon={<AlertIcon />}
          onClick={() => navigate('/aog/list')}
          isLoading={aogSummaryLoading}
        />

        <KPICardEnhanced
          title="Average AOG Duration"
          value={aogSummaryLoading ? '...' : `${aogSummary?.avgDurationHours?.toFixed(1) ?? 0}h`}
          subtitle="Mean time to resolve"
          icon={<ClockIcon />}
          onClick={() => navigate('/aog/analytics')}
          isLoading={aogSummaryLoading}
        />

        <KPICardEnhanced
          title="Total Downtime Hours"
          value={aogSummaryLoading ? '...' : aogSummary?.totalDowntimeHours?.toFixed(0) ?? 0}
          subtitle="Cumulative this month"
          icon={<ClockIcon />}
          onClick={() => navigate('/aog/analytics')}
          isLoading={aogSummaryLoading}
        />
      </div>

      {/* Active AOG Events Widget */}
      {aogSummary && aogSummary.activeCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActiveAOGEventsWidget 
            events={aogSummary.activeEvents} 
            isLoading={aogSummaryLoading} 
          />
          <FleetAvailabilityImpactWidget
            unavailableAircraft={aogSummary.unavailableAircraft}
            totalAircraft={statusSummary.total}
            isLoading={aogSummaryLoading}
          />
        </div>
      )}

      {/* AOG Trend Chart */}
      <AOGMiniTrendChart 
        trendData={aogSummary?.trendData} 
        isLoading={aogSummaryLoading} 
      />

      {/* Spacer for PDF page break - helps prevent Performance Trends from splitting */}
      <div className="h-12" aria-hidden="true" />

      {/* Trends Section */}
      <CollapsibleSection title="Performance Trends" storageKey="trends" defaultExpanded={true}>
        <FilterBar className="w-fit mb-4">
          <FilterGroup label="Trend Period:">
            <div className="flex p-1 bg-muted/50 rounded-xl border border-border/50">
              {(['day', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTrendPeriod(period)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${trendPeriod === period
                      ? 'bg-background text-primary shadow-sm border border-border/80'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }
                  `}
                >
                  {period === 'day' ? 'Daily' : period === 'month' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </FilterGroup>
        </FilterBar>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Availability Trend" height={350}>
            {trendsLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading chart data...
              </div>
            ) : availabilityChartData.length > 0 ? (
              <TrendChart
                data={availabilityChartData}
                lines={[
                  { dataKey: 'availability', color: '#22c55e', name: 'Availability %' },
                ]}
                target={{ value: 92, label: 'Target', color: '#6b7280' }}
                yAxisDomain={[0, 100]}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No availability data for selected period
              </div>
            )}
          </ChartContainer>

          <ChartContainer title="Utilization Trend" height={350}>
            {trendsLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Loading chart data...
              </div>
            ) : utilizationChartData.length > 0 ? (
              <BarChartWrapper
                data={utilizationChartData}
                bars={[
                  { dataKey: 'flightHours', color: '#3b82f6', name: 'Flight Hours' },
                  { dataKey: 'cycles', color: '#8b5cf6', name: 'Cycles' },
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No utilization data for selected period
              </div>
            )}
          </ChartContainer>
        </div>
      </CollapsibleSection>

      {/* Fleet Comparison Section */}
      <CollapsibleSection title="Fleet Comparison" storageKey="fleet-comparison" defaultExpanded={true}>
        <FleetComparison data={fleetComparison} isLoading={fleetComparisonLoading} />
      </CollapsibleSection>

      {/* Operational Insights Section */}
      <CollapsibleSection title="Operational Insights" storageKey="operational-insights" defaultExpanded={true}>
        <DefectPatterns data={defectPatterns} isLoading={defectPatternsLoading} />
      </CollapsibleSection>

      {/* Activity & Forecast Section */}
      <CollapsibleSection title="Activity & Forecast" storageKey="activity-forecast" defaultExpanded={true}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivityFeed data={recentActivity} isLoading={recentActivityLoading} />
          <MaintenanceForecast data={maintenanceForecast} isLoading={maintenanceForecastLoading} />
        </div>
      </CollapsibleSection>

      {/* Coming Soon Section */}
      <ComingSoonSection />

      {/* Year-over-Year Comparison */}
      <CollapsibleSection title="Year-over-Year Comparison" storageKey="yoy-comparison" defaultExpanded={true}>
        <YoYComparison data={yoyComparison} isLoading={yoyComparisonLoading} />
      </CollapsibleSection>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Fleet Availability', path: '/availability', color: 'bg-green-500/10 hover:bg-green-500/20 text-green-600' },
          { label: 'Maintenance Tasks', path: '/maintenance', color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600' },
          { label: 'Work Orders', path: '/work-orders', color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-600' },
          { label: 'Budget & Costs', path: '/budget', color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600' },
        ].map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`p-4 rounded-lg border border-border text-sm font-medium transition-colors ${link.color}`}
          >
            {link.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
