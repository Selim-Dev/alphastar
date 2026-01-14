/**
 * Daily Status Summary Statistics Component
 * 
 * Provides comprehensive summary statistics for daily status data including:
 * - Average fleet availability
 * - Aircraft tracking counts
 * - Threshold-based counting (below 85%, below 70%)
 * - Downtime pattern analysis (scheduled vs unscheduled)
 * 
 * Requirements: 5.1, 5.4, 5.5 - Summary statistics with threshold counting
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Plane, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Wrench,
  AlertCircle,
  Package
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { ChartContainer, BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import { SkeletonKPICards, SkeletonChart } from '@/components/ui/Skeleton';
import { calculateFleetAvailability } from '@/lib/availability';
import type { DailyStatus } from '@/types';

// ============================================
// Types
// ============================================

export interface DailyStatusWithCalculations extends DailyStatus {
  registration?: string;
  fleetGroup?: string;
  availabilityPercentage: number;
  totalDowntime: number;
}

export interface SummaryStatistics {
  // Core metrics
  averageAvailability: number;
  totalAircraftTracked: number;
  totalRecords: number;
  recordsWithDowntime: number;
  
  // Threshold-based counts (Requirements: 5.4)
  belowThreshold85: number;
  belowThreshold70: number;
  aircraftBelowThreshold85: number;  // Unique aircraft count
  aircraftBelowThreshold70: number;  // Unique aircraft count
  
  // Downtime breakdown (Requirements: 5.3)
  totalScheduledDowntime: number;
  totalUnscheduledDowntime: number;
  totalSupplyDowntime: number;
  totalDowntimeHours: number;
  
  // Percentages
  downtimePercentage: number;
  scheduledPercentage: number;
  unscheduledPercentage: number;
}

export interface DowntimeByCategory {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface DowntimeTrendPoint {
  name: string;
  scheduled: number;
  unscheduled: number;
  supply: number;
  [key: string]: string | number;
}

interface DailyStatusSummaryProps {
  data: DailyStatusWithCalculations[];
  isLoading: boolean;
  showCharts?: boolean;
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculates comprehensive summary statistics from daily status data
 * Requirements: 5.1, 5.4, 5.5
 */
export function calculateSummaryStatistics(
  data: DailyStatusWithCalculations[]
): SummaryStatistics {
  if (!data.length) {
    return {
      averageAvailability: 0,
      totalAircraftTracked: 0,
      totalRecords: 0,
      recordsWithDowntime: 0,
      belowThreshold85: 0,
      belowThreshold70: 0,
      aircraftBelowThreshold85: 0,
      aircraftBelowThreshold70: 0,
      totalScheduledDowntime: 0,
      totalUnscheduledDowntime: 0,
      totalSupplyDowntime: 0,
      totalDowntimeHours: 0,
      downtimePercentage: 0,
      scheduledPercentage: 0,
      unscheduledPercentage: 0,
    };
  }

  // Unique aircraft tracking
  const uniqueAircraft = new Set(data.map((item) => item.aircraftId));
  
  // Calculate fleet-wide availability using centralized function (Requirements: 8.3)
  const averageAvailability = calculateFleetAvailability(data);
  
  // Records with any downtime
  const recordsWithDowntime = data.filter(
    (item) => item.nmcmSHours > 0 || item.nmcmUHours > 0 || (item.nmcsHours || 0) > 0
  ).length;
  
  // Threshold-based record counts (Requirements: 5.4)
  const belowThreshold85 = data.filter((item) => item.availabilityPercentage < 85).length;
  const belowThreshold70 = data.filter((item) => item.availabilityPercentage < 70).length;
  
  // Threshold-based unique aircraft counts (Requirements: 5.4)
  const aircraftBelow85 = new Set(
    data.filter((item) => item.availabilityPercentage < 85).map((item) => item.aircraftId)
  );
  const aircraftBelow70 = new Set(
    data.filter((item) => item.availabilityPercentage < 70).map((item) => item.aircraftId)
  );
  
  // Downtime breakdown (Requirements: 5.3)
  const totalScheduledDowntime = data.reduce((sum, item) => sum + item.nmcmSHours, 0);
  const totalUnscheduledDowntime = data.reduce((sum, item) => sum + item.nmcmUHours, 0);
  const totalSupplyDowntime = data.reduce((sum, item) => sum + (item.nmcsHours || 0), 0);
  const totalDowntimeHours = totalScheduledDowntime + totalUnscheduledDowntime + totalSupplyDowntime;
  
  // Total POS hours for percentage calculations
  const totalPosHours = data.reduce((sum, item) => sum + item.posHours, 0);
  
  // Calculate percentages
  const downtimePercentage = totalPosHours > 0 
    ? (totalDowntimeHours / totalPosHours) * 100 
    : 0;
  const scheduledPercentage = totalDowntimeHours > 0 
    ? (totalScheduledDowntime / totalDowntimeHours) * 100 
    : 0;
  const unscheduledPercentage = totalDowntimeHours > 0 
    ? (totalUnscheduledDowntime / totalDowntimeHours) * 100 
    : 0;

  return {
    averageAvailability,
    totalAircraftTracked: uniqueAircraft.size,
    totalRecords: data.length,
    recordsWithDowntime,
    belowThreshold85,
    belowThreshold70,
    aircraftBelowThreshold85: aircraftBelow85.size,
    aircraftBelowThreshold70: aircraftBelow70.size,
    totalScheduledDowntime,
    totalUnscheduledDowntime,
    totalSupplyDowntime,
    totalDowntimeHours,
    downtimePercentage,
    scheduledPercentage,
    unscheduledPercentage,
  };
}

/**
 * Prepares downtime breakdown data for pie/bar charts
 * Requirements: 5.3
 */
export function prepareDowntimeBreakdown(stats: SummaryStatistics): DowntimeByCategory[] {
  return [
    { 
      name: 'Scheduled (NMCM-S)', 
      value: stats.totalScheduledDowntime, 
      color: '#f59e0b' // amber
    },
    { 
      name: 'Unscheduled (NMCM-U)', 
      value: stats.totalUnscheduledDowntime, 
      color: '#ef4444' // red
    },
    { 
      name: 'Supply (NMCS)', 
      value: stats.totalSupplyDowntime, 
      color: '#8b5cf6' // purple
    },
  ].filter(item => item.value > 0);
}

/**
 * Prepares downtime trend data grouped by date
 * Requirements: 5.3
 */
export function prepareDowntimeTrend(
  data: DailyStatusWithCalculations[]
): DowntimeTrendPoint[] {
  if (!data.length) return [];

  // Group by date
  const byDate = new Map<string, { scheduled: number; unscheduled: number; supply: number }>();
  
  data.forEach((item) => {
    const dateKey = new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const existing = byDate.get(dateKey) || { scheduled: 0, unscheduled: 0, supply: 0 };
    byDate.set(dateKey, {
      scheduled: existing.scheduled + item.nmcmSHours,
      unscheduled: existing.unscheduled + item.nmcmUHours,
      supply: existing.supply + (item.nmcsHours || 0),
    });
  });

  return Array.from(byDate.entries())
    .map(([name, values]) => ({
      name,
      ...values,
    }))
    .reverse()
    .slice(-14); // Last 14 data points
}

// ============================================
// Component
// ============================================

export function DailyStatusSummary({ 
  data, 
  isLoading,
  showCharts = true 
}: DailyStatusSummaryProps) {
  // Calculate statistics - automatically updates when data changes (Requirements: 5.5)
  const stats = useMemo(() => calculateSummaryStatistics(data), [data]);
  
  // Prepare chart data
  const downtimeBreakdown = useMemo(() => prepareDowntimeBreakdown(stats), [stats]);
  const downtimeTrend = useMemo(() => prepareDowntimeTrend(data), [data]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonKPICards count={4} />
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart height={250} />
            <SkeletonChart height={250} />
          </div>
        )}
      </div>
    );
  }

  if (!data.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-muted/50 border border-border rounded-lg p-8 text-center"
      >
        <Plane className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Data Available</h3>
        <p className="text-sm text-muted-foreground">
          No daily status records found for the selected filters.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary KPI Cards (Requirements: 5.1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Average Availability"
          value={stats.averageAvailability.toFixed(1)}
          unit="%"
          icon={stats.averageAvailability >= 85 ? <TrendingUp /> : <TrendingDown />}
          subtitle={`${stats.totalRecords} records`}
          delay={0.1}
          className={
            stats.averageAvailability < 70 
              ? 'border-red-500/50' 
              : stats.averageAvailability < 85 
                ? 'border-amber-500/50' 
                : ''
          }
        />
        <KPICard
          title="Aircraft Tracked"
          value={stats.totalAircraftTracked}
          icon={<Plane />}
          subtitle="Unique aircraft"
          delay={0.15}
        />
        <KPICard
          title="Records with Downtime"
          value={stats.recordsWithDowntime}
          icon={<Clock />}
          subtitle={`${((stats.recordsWithDowntime / stats.totalRecords) * 100).toFixed(0)}% of records`}
          delay={0.2}
        />
        <KPICard
          title="Below 85% Availability"
          value={stats.belowThreshold85}
          icon={<AlertTriangle />}
          subtitle={
            stats.belowThreshold70 > 0 
              ? `${stats.belowThreshold70} critical (<70%)` 
              : 'No critical records'
          }
          delay={0.25}
          className={
            stats.belowThreshold70 > 0 
              ? 'border-red-500/50' 
              : stats.belowThreshold85 > 0 
                ? 'border-amber-500/50' 
                : ''
          }
        />
      </div>

      {/* Secondary Statistics Row (Requirements: 5.3, 5.4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Downtime</p>
              <p className="text-xl font-semibold text-foreground">
                {stats.totalScheduledDowntime.toFixed(1)} hrs
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.scheduledPercentage.toFixed(0)}% of total downtime
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unscheduled Downtime</p>
              <p className="text-xl font-semibold text-foreground">
                {stats.totalUnscheduledDowntime.toFixed(1)} hrs
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.unscheduledPercentage.toFixed(0)}% of total downtime
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supply Downtime</p>
              <p className="text-xl font-semibold text-foreground">
                {stats.totalSupplyDowntime.toFixed(1)} hrs
              </p>
              <p className="text-xs text-muted-foreground">
                NMCS hours
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aircraft Below Target</p>
              <p className="text-xl font-semibold text-foreground">
                {stats.aircraftBelowThreshold85}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.aircraftBelowThreshold70} critical (&lt;70%)
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section (Requirements: 5.3) */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Downtime Breakdown Pie Chart */}
          {downtimeBreakdown.length > 0 && (
            <ChartContainer
              title="Downtime Breakdown"
              subtitle="Distribution by category"
              height={250}
              delay={0.5}
            >
              <PieChartWrapper
                data={downtimeBreakdown}
                innerRadius={50}
                outerRadius={80}
              />
            </ChartContainer>
          )}

          {/* Downtime Trend Bar Chart */}
          {downtimeTrend.length > 0 && (
            <ChartContainer
              title="Downtime Trend"
              subtitle="Daily breakdown over time"
              height={250}
              delay={0.55}
            >
              <BarChartWrapper
                data={downtimeTrend}
                bars={[
                  { dataKey: 'scheduled', color: '#f59e0b', name: 'Scheduled' },
                  { dataKey: 'unscheduled', color: '#ef4444', name: 'Unscheduled' },
                  { dataKey: 'supply', color: '#8b5cf6', name: 'Supply' },
                ]}
                layout="horizontal"
              />
            </ChartContainer>
          )}
        </div>
      )}
    </div>
  );
}

export default DailyStatusSummary;
