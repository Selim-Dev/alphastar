/**
 * Downtime Pattern Analysis Component
 * 
 * Provides detailed analysis of downtime patterns including:
 * - Breakdown of scheduled vs unscheduled maintenance hours
 * - Visual charts showing downtime categories
 * - Trend analysis over time periods
 * 
 * Requirements: 5.3 - Downtime pattern analysis
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek } from 'date-fns';
import { 
  Wrench, 
  AlertCircle, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Minus
} from 'lucide-react';
import { ChartContainer, BarChartWrapper, TrendChart, PieChartWrapper } from '@/components/ui/Charts';
import { SkeletonChart } from '@/components/ui/Skeleton';
import type { DailyStatusWithCalculations } from './DailyStatusSummary';

// ============================================
// Types
// ============================================

interface DowntimeAnalysisProps {
  data: DailyStatusWithCalculations[];
  isLoading: boolean;
}

interface DowntimeMetrics {
  totalScheduled: number;
  totalUnscheduled: number;
  totalSupply: number;
  totalDowntime: number;
  avgDailyScheduled: number;
  avgDailyUnscheduled: number;
  avgDailySupply: number;
  scheduledTrend: 'up' | 'down' | 'flat';
  unscheduledTrend: 'up' | 'down' | 'flat';
}

interface WeeklyDowntime {
  name: string;
  scheduled: number;
  unscheduled: number;
  supply: number;
  [key: string]: string | number;
}

interface DailyDowntimeTrend {
  name: string;
  scheduled: number;
  unscheduled: number;
  [key: string]: string | number;
}

interface AircraftDowntime {
  registration: string;
  scheduled: number;
  unscheduled: number;
  supply: number;
  total: number;
  [key: string]: string | number;
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculates comprehensive downtime metrics
 * Requirements: 5.3
 */
function calculateDowntimeMetrics(data: DailyStatusWithCalculations[]): DowntimeMetrics {
  if (!data.length) {
    return {
      totalScheduled: 0,
      totalUnscheduled: 0,
      totalSupply: 0,
      totalDowntime: 0,
      avgDailyScheduled: 0,
      avgDailyUnscheduled: 0,
      avgDailySupply: 0,
      scheduledTrend: 'flat',
      unscheduledTrend: 'flat',
    };
  }

  const totalScheduled = data.reduce((sum, item) => sum + item.nmcmSHours, 0);
  const totalUnscheduled = data.reduce((sum, item) => sum + item.nmcmUHours, 0);
  const totalSupply = data.reduce((sum, item) => sum + (item.nmcsHours || 0), 0);
  const totalDowntime = totalScheduled + totalUnscheduled + totalSupply;

  // Get unique dates for averaging
  const uniqueDates = new Set(data.map(item => item.date.split('T')[0]));
  const dayCount = uniqueDates.size || 1;

  const avgDailyScheduled = totalScheduled / dayCount;
  const avgDailyUnscheduled = totalUnscheduled / dayCount;
  const avgDailySupply = totalSupply / dayCount;

  // Calculate trends by comparing first half vs second half
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const midpoint = Math.floor(sortedData.length / 2);
  const firstHalf = sortedData.slice(0, midpoint);
  const secondHalf = sortedData.slice(midpoint);

  const firstHalfScheduled = firstHalf.reduce((sum, item) => sum + item.nmcmSHours, 0) / (firstHalf.length || 1);
  const secondHalfScheduled = secondHalf.reduce((sum, item) => sum + item.nmcmSHours, 0) / (secondHalf.length || 1);
  const firstHalfUnscheduled = firstHalf.reduce((sum, item) => sum + item.nmcmUHours, 0) / (firstHalf.length || 1);
  const secondHalfUnscheduled = secondHalf.reduce((sum, item) => sum + item.nmcmUHours, 0) / (secondHalf.length || 1);

  const scheduledTrend = secondHalfScheduled > firstHalfScheduled * 1.1 ? 'up' 
    : secondHalfScheduled < firstHalfScheduled * 0.9 ? 'down' 
    : 'flat';
  const unscheduledTrend = secondHalfUnscheduled > firstHalfUnscheduled * 1.1 ? 'up' 
    : secondHalfUnscheduled < firstHalfUnscheduled * 0.9 ? 'down' 
    : 'flat';

  return {
    totalScheduled,
    totalUnscheduled,
    totalSupply,
    totalDowntime,
    avgDailyScheduled,
    avgDailyUnscheduled,
    avgDailySupply,
    scheduledTrend,
    unscheduledTrend,
  };
}

/**
 * Prepares weekly downtime aggregation for trend analysis
 * Requirements: 5.3
 */
function prepareWeeklyDowntime(data: DailyStatusWithCalculations[]): WeeklyDowntime[] {
  if (!data.length) return [];

  // Group by week
  const byWeek = new Map<string, { scheduled: number; unscheduled: number; supply: number }>();
  
  data.forEach((item) => {
    const date = new Date(item.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'MMM dd');
    
    const existing = byWeek.get(weekKey) || { scheduled: 0, unscheduled: 0, supply: 0 };
    byWeek.set(weekKey, {
      scheduled: existing.scheduled + item.nmcmSHours,
      unscheduled: existing.unscheduled + item.nmcmUHours,
      supply: existing.supply + (item.nmcsHours || 0),
    });
  });

  return Array.from(byWeek.entries())
    .map(([name, values]) => ({ name, ...values }))
    .slice(-8); // Last 8 weeks
}

/**
 * Prepares daily downtime trend for line chart
 * Requirements: 5.3
 */
function prepareDailyDowntimeTrend(data: DailyStatusWithCalculations[]): DailyDowntimeTrend[] {
  if (!data.length) return [];

  // Group by date
  const byDate = new Map<string, { scheduled: number; unscheduled: number }>();
  
  data.forEach((item) => {
    const dateKey = format(new Date(item.date), 'MMM dd');
    const existing = byDate.get(dateKey) || { scheduled: 0, unscheduled: 0 };
    byDate.set(dateKey, {
      scheduled: existing.scheduled + item.nmcmSHours,
      unscheduled: existing.unscheduled + item.nmcmUHours,
    });
  });

  return Array.from(byDate.entries())
    .map(([name, values]) => ({ name, ...values }))
    .reverse()
    .slice(-14); // Last 14 days
}

/**
 * Prepares aircraft-level downtime breakdown
 * Requirements: 5.3
 */
function prepareAircraftDowntime(data: DailyStatusWithCalculations[]): AircraftDowntime[] {
  if (!data.length) return [];

  // Group by aircraft
  const byAircraft = new Map<string, { 
    registration: string; 
    scheduled: number; 
    unscheduled: number; 
    supply: number;
  }>();
  
  data.forEach((item) => {
    const key = item.aircraftId;
    const existing = byAircraft.get(key) || { 
      registration: item.registration || 'Unknown', 
      scheduled: 0, 
      unscheduled: 0, 
      supply: 0 
    };
    byAircraft.set(key, {
      registration: existing.registration,
      scheduled: existing.scheduled + item.nmcmSHours,
      unscheduled: existing.unscheduled + item.nmcmUHours,
      supply: existing.supply + (item.nmcsHours || 0),
    });
  });

  return Array.from(byAircraft.values())
    .map((item) => ({
      ...item,
      total: item.scheduled + item.unscheduled + item.supply,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Top 10 aircraft by downtime
}

// ============================================
// Helper Components
// ============================================

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-red-500" />;
  }
  if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-green-500" />;
  }
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  unit, 
  trend, 
  avgValue,
  color,
  delay 
}: { 
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'flat';
  avgValue?: number;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && <TrendIcon trend={trend} />}
      </div>
      <div className="mt-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">
          {value.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
        {avgValue !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            Avg: {avgValue.toFixed(1)} {unit}/day
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function DowntimeAnalysis({ data, isLoading }: DowntimeAnalysisProps) {
  // Calculate metrics - automatically updates when data changes (Requirements: 5.5)
  const metrics = useMemo(() => calculateDowntimeMetrics(data), [data]);
  const weeklyData = useMemo(() => prepareWeeklyDowntime(data), [data]);
  const dailyTrend = useMemo(() => prepareDailyDowntimeTrend(data), [data]);
  const aircraftDowntime = useMemo(() => prepareAircraftDowntime(data), [data]);

  // Prepare pie chart data
  const pieData = useMemo(() => [
    { name: 'Scheduled', value: metrics.totalScheduled, color: '#f59e0b' },
    { name: 'Unscheduled', value: metrics.totalUnscheduled, color: '#ef4444' },
    { name: 'Supply', value: metrics.totalSupply, color: '#8b5cf6' },
  ].filter(item => item.value > 0), [metrics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 h-32 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart height={250} />
          <SkeletonChart height={250} />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Downtime Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          label="Scheduled Maintenance"
          value={metrics.totalScheduled}
          unit="hrs"
          trend={metrics.scheduledTrend}
          avgValue={metrics.avgDailyScheduled}
          color="bg-amber-100 dark:bg-amber-900/30"
          delay={0.1}
        />
        <MetricCard
          icon={<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
          label="Unscheduled Maintenance"
          value={metrics.totalUnscheduled}
          unit="hrs"
          trend={metrics.unscheduledTrend}
          avgValue={metrics.avgDailyUnscheduled}
          color="bg-red-100 dark:bg-red-900/30"
          delay={0.15}
        />
        <MetricCard
          icon={<Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
          label="Supply Issues"
          value={metrics.totalSupply}
          unit="hrs"
          avgValue={metrics.avgDailySupply}
          color="bg-purple-100 dark:bg-purple-900/30"
          delay={0.2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Distribution Pie Chart */}
        {pieData.length > 0 && (
          <ChartContainer
            title="Downtime Distribution"
            subtitle="Breakdown by category"
            height={250}
            delay={0.25}
          >
            <PieChartWrapper
              data={pieData}
              innerRadius={50}
              outerRadius={80}
            />
          </ChartContainer>
        )}

        {/* Daily Trend Line Chart */}
        {dailyTrend.length > 0 && (
          <ChartContainer
            title="Daily Downtime Trend"
            subtitle="Scheduled vs Unscheduled over time"
            height={250}
            delay={0.3}
          >
            <TrendChart
              data={dailyTrend}
              lines={[
                { dataKey: 'scheduled', color: '#f59e0b', name: 'Scheduled' },
                { dataKey: 'unscheduled', color: '#ef4444', name: 'Unscheduled' },
              ]}
            />
          </ChartContainer>
        )}
      </div>

      {/* Weekly Breakdown and Aircraft Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Breakdown Bar Chart */}
        {weeklyData.length > 0 && (
          <ChartContainer
            title="Weekly Downtime"
            subtitle="Aggregated by week"
            height={250}
            delay={0.35}
          >
            <BarChartWrapper
              data={weeklyData}
              bars={[
                { dataKey: 'scheduled', color: '#f59e0b', name: 'Scheduled' },
                { dataKey: 'unscheduled', color: '#ef4444', name: 'Unscheduled' },
                { dataKey: 'supply', color: '#8b5cf6', name: 'Supply' },
              ]}
              layout="horizontal"
            />
          </ChartContainer>
        )}

        {/* Top Aircraft by Downtime */}
        {aircraftDowntime.length > 0 && (
          <ChartContainer
            title="Aircraft Downtime"
            subtitle="Top aircraft by total downtime"
            height={250}
            delay={0.4}
          >
            <BarChartWrapper
              data={aircraftDowntime.map(a => ({ 
                name: a.registration, 
                scheduled: a.scheduled,
                unscheduled: a.unscheduled,
                supply: a.supply,
              }))}
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
    </div>
  );
}

export default DowntimeAnalysis;
