import { motion } from 'framer-motion';
import { Activity, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, Plane } from 'lucide-react';
import type { OperationalEfficiency } from '@/types';
import { GlossaryTerm } from './GlossaryTooltip';

interface OperationalEfficiencyPanelProps {
  data?: OperationalEfficiency;
  isLoading?: boolean;
  className?: string;
}

function TrendIndicator({ 
  trend, 
  invertColors = false 
}: { 
  trend: 'up' | 'down' | 'flat'; 
  invertColors?: boolean;
}) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  // For MTBF and dispatch reliability, up is good. For MTTR, down is good (invertColors)
  const isGood = invertColors ? trend === 'down' : trend === 'up';
  const colorClass = trend === 'flat' 
    ? 'text-muted-foreground' 
    : isGood 
      ? 'text-green-500' 
      : 'text-red-500';

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium capitalize">{trend}</span>
    </div>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  isWarning,
  invertTrendColors,
  isLoading,
  description,
}: {
  icon: React.ElementType;
  label: React.ReactNode;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  isWarning?: boolean;
  invertTrendColors?: boolean;
  isLoading?: boolean;
  description?: string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
        <div className="animate-pulse bg-muted h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="animate-pulse bg-muted h-3 w-16 rounded" />
          <div className="animate-pulse bg-muted h-6 w-24 rounded" />
          <div className="animate-pulse bg-muted h-3 w-12 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        isWarning 
          ? 'bg-red-500/10 border border-red-500/20' 
          : 'bg-muted/30 border border-transparent'
      }`}
    >
      <div className={`p-2 rounded-lg ${isWarning ? 'bg-red-500/20' : 'bg-primary/10'}`}>
        <Icon className={`w-4 h-4 ${isWarning ? 'text-red-500' : 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className={`text-lg font-bold ${isWarning ? 'text-red-500' : 'text-foreground'}`}>
            {value.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </p>
          {isWarning && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <TrendIndicator trend={trend} invertColors={invertTrendColors} />
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function OperationalEfficiencyPanel({
  data,
  isLoading,
  className = '',
}: OperationalEfficiencyPanelProps) {
  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="animate-pulse h-5 w-40 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          <MetricItem
            icon={Clock}
            label="MTBF"
            value={0}
            unit="hours"
            trend="flat"
            isLoading
          />
          <MetricItem
            icon={Clock}
            label="MTTR"
            value={0}
            unit="hours"
            trend="flat"
            isLoading
          />
          <MetricItem
            icon={Plane}
            label="Dispatch Reliability"
            value={0}
            unit="%"
            trend="flat"
            isLoading
          />
        </div>
      </div>
    );
  }

  // Handle no data case
  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Operational Efficiency</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No efficiency data available</p>
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
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Operational Efficiency</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        <MetricItem
          icon={Clock}
          label={<>Mean Time Between Failures (<GlossaryTerm term="MTBF" />)</>}
          value={data.mtbf.value}
          unit={data.mtbf.unit}
          trend={data.mtbf.trend}
          description="Higher is better"
        />
        
        <MetricItem
          icon={Clock}
          label={<>Mean Time To Repair (<GlossaryTerm term="MTTR" />)</>}
          value={data.mttr.value}
          unit={data.mttr.unit}
          trend={data.mttr.trend}
          isWarning={data.mttr.warning}
          invertTrendColors
          description={data.mttr.warning ? 'Exceeds 24h threshold' : 'Lower is better'}
        />
        
        <MetricItem
          icon={Plane}
          label="Dispatch Reliability"
          value={data.dispatchReliability.value}
          unit="%"
          trend={data.dispatchReliability.trend}
          description="Higher is better"
        />
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Period: {new Date(data.period.startDate).toLocaleDateString()} - {new Date(data.period.endDate).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
}

export default OperationalEfficiencyPanel;
