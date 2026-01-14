import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import type { CostEfficiency } from '@/types';

interface CostEfficiencyCardProps {
  data?: CostEfficiency;
  isLoading?: boolean;
  className?: string;
}

function TrendIndicator({ 
  trend, 
  isWarning 
}: { 
  trend: 'up' | 'down' | 'flat'; 
  isWarning: boolean;
}) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  // For costs, up is bad (warning), down is good (green)
  const colorClass = trend === 'flat' 
    ? 'text-muted-foreground' 
    : isWarning 
      ? 'text-red-500' 
      : 'text-green-500';

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">
        {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  previousValue,
  trend,
  isLoading,
}: {
  label: string;
  value: number;
  previousValue?: number;
  trend: 'up' | 'down' | 'flat';
  isLoading?: boolean;
}) {
  const isWarning = trend === 'up'; // Cost increase is a warning
  const formattedValue = value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-4 rounded-lg bg-muted/30">
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-7 w-28 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex-1 p-4 rounded-lg transition-colors ${
        isWarning 
          ? 'bg-red-500/10 border border-red-500/20' 
          : 'bg-muted/30 border border-transparent'
      }`}
    >
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <p className={`text-xl font-bold ${isWarning ? 'text-red-500' : 'text-foreground'}`}>
          {formattedValue}
        </p>
        {isWarning && <AlertTriangle className="w-4 h-4 text-red-500" />}
      </div>
      <div className="mt-2">
        <TrendIndicator trend={trend} isWarning={isWarning} />
      </div>
      {previousValue !== undefined && (
        <p className="text-xs text-muted-foreground mt-1">
          Previous: {previousValue.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      )}
    </motion.div>
  );
}

export function CostEfficiencyCard({
  data,
  isLoading,
  className = '',
}: CostEfficiencyCardProps) {
  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div className="animate-pulse h-5 w-32 bg-muted rounded" />
        </div>
        <div className="flex gap-4">
          <MetricCard
            label="Cost per Flight Hour"
            value={0}
            trend="flat"
            isLoading
          />
          <MetricCard
            label="Cost per Cycle"
            value={0}
            trend="flat"
            isLoading
          />
        </div>
      </div>
    );
  }

  // Handle insufficient data case
  if (!data || (data.totalFlightHours === 0 && data.totalCycles === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Cost Efficiency</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm font-medium">Insufficient Data</p>
            <p className="text-xs mt-1">
              Cost efficiency metrics require utilization data.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Cost Efficiency</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          Total: {data.totalCost.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      </div>
      
      <div className="flex gap-4">
        <MetricCard
          label="Cost per Flight Hour"
          value={data.costPerFlightHour}
          previousValue={data.previousPeriod?.costPerFlightHour}
          trend={data.trend.costPerFlightHour}
        />
        <MetricCard
          label="Cost per Cycle"
          value={data.costPerCycle}
          previousValue={data.previousPeriod?.costPerCycle}
          trend={data.trend.costPerCycle}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Flight Hours: {data.totalFlightHours.toLocaleString()}</span>
          <span>Cycles: {data.totalCycles.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default CostEfficiencyCard;
