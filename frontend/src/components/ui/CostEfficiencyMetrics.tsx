/**
 * Cost Efficiency Metrics Component
 * 
 * Displays two metric cards showing cost per hour and cost per event
 * with delta indicators and sparklines.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { formatCurrency, calculateCostDelta } from '../../lib/costAnalysis';

interface CostEfficiencyData {
  costPerHour: number;
  costPerEvent: number;
  previousCostPerHour?: number;
  previousCostPerEvent?: number;
  sparklineData?: Array<{ value: number }>;
}

interface CostEfficiencyMetricsProps {
  data: CostEfficiencyData;
  isLoading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  sparklineData?: Array<{ value: number }>;
  isLoading?: boolean;
}

function MetricCard({ title, value, previousValue, sparklineData, isLoading }: MetricCardProps) {
  const delta = previousValue !== undefined ? calculateCostDelta(value, previousValue) : null;
  
  // Determine delta color and icon
  const getDeltaDisplay = () => {
    if (delta === null) {
      return null;
    }
    
    const isIncrease = delta > 0;
    const isDecrease = delta < 0;
    
    const colorClass = isDecrease
      ? 'text-green-600 dark:text-green-400'
      : isIncrease
      ? 'text-red-600 dark:text-red-400'
      : 'text-muted-foreground';
    
    const Icon = isDecrease ? TrendingDown : isIncrease ? TrendingUp : Minus;
    
    return (
      <div className={`flex items-center gap-1 text-sm font-medium ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span>{Math.abs(delta).toFixed(1)}%</span>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2 mb-4" />
        <div className="h-8 bg-muted rounded w-3/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    );
  }
  
  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {getDeltaDisplay()}
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-foreground">
          {formatCurrency(value)}
        </div>
        {previousValue !== undefined && (
          <div className="text-xs text-muted-foreground mt-1">
            vs {formatCurrency(previousValue)} previous period
          </div>
        )}
      </div>
      
      {sparklineData && sparklineData.length > 0 && (
        <div className="h-12 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-muted-foreground text-center mt-1">
            Last {sparklineData.length} months trend
          </div>
        </div>
      )}
    </div>
  );
}

export function CostEfficiencyMetrics({ data, isLoading }: CostEfficiencyMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <MetricCard
        title="Cost per Hour"
        value={data.costPerHour}
        previousValue={data.previousCostPerHour}
        sparklineData={data.sparklineData}
        isLoading={isLoading}
      />
      
      <MetricCard
        title="Cost per Event"
        value={data.costPerEvent}
        previousValue={data.previousCostPerEvent}
        sparklineData={data.sparklineData}
        isLoading={isLoading}
      />
    </div>
  );
}
