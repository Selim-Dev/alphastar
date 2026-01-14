import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronDown,
  ChevronUp,
  Plane,
  Wrench,
  DollarSign,
  Clock
} from 'lucide-react';
import type { InsightsResponse, Insight } from '@/types';

interface InsightsPanelProps {
  data?: InsightsResponse;
  isLoading?: boolean;
  className?: string;
  defaultCollapsed?: boolean;
}

function getCategoryConfig(category: Insight['category']) {
  switch (category) {
    case 'positive':
      return {
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        textColor: 'text-green-600 dark:text-green-400',
        dotColor: 'bg-green-500',
      };
    case 'concerning':
      return {
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-600 dark:text-amber-400',
        dotColor: 'bg-amber-500',
      };
    case 'neutral':
    default:
      return {
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-600 dark:text-blue-400',
        dotColor: 'bg-blue-500',
      };
  }
}

function getTypeIcon(type: Insight['type']) {
  switch (type) {
    case 'availability':
      return Plane;
    case 'maintenance':
      return Wrench;
    case 'budget':
      return DollarSign;
    case 'utilization':
      return Clock;
    default:
      return Lightbulb;
  }
}

function MetricChange({ metric }: { metric: Insight['metric'] }) {
  if (!metric) return null;

  const isPositive = metric.change > 0;
  const Icon = isPositive ? TrendingUp : metric.change < 0 ? TrendingDown : Minus;
  const changeColor = metric.change === 0 
    ? 'text-muted-foreground' 
    : isPositive 
      ? 'text-green-500' 
      : 'text-red-500';

  return (
    <div className="flex items-center gap-2 mt-2 text-xs">
      <span className="text-muted-foreground">
        {metric.previous.toFixed(1)} → {metric.current.toFixed(1)}
      </span>
      <span className={`flex items-center gap-0.5 font-medium ${changeColor}`}>
        <Icon className="w-3 h-3" />
        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
      </span>
    </div>
  );
}

function InsightItem({
  insight,
  index,
}: {
  insight: Insight;
  index: number;
}) {
  const categoryConfig = getCategoryConfig(insight.category);
  const TypeIcon = getTypeIcon(insight.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`p-3 rounded-lg border ${categoryConfig.bgColor} ${categoryConfig.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${categoryConfig.dotColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <TypeIcon className={`w-4 h-4 ${categoryConfig.textColor}`} />
            <span className={`text-sm font-medium ${categoryConfig.textColor}`}>
              {insight.title}
            </span>
            {insight.aircraftRegistration && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">
                {insight.aircraftRegistration}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {insight.description}
          </p>
          {insight.metric && <MetricChange metric={insight.metric} />}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="animate-pulse bg-muted h-2 w-2 rounded-full mt-1.5" />
            <div className="flex-1 space-y-2">
              <div className="animate-pulse bg-muted h-4 w-32 rounded" />
              <div className="animate-pulse bg-muted h-3 w-full rounded" />
              <div className="animate-pulse bg-muted h-3 w-24 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InsightsPanel({
  data,
  isLoading,
  className = '',
  defaultCollapsed = false,
}: InsightsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div className="animate-pulse h-5 w-32 bg-muted rounded" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Handle no data case
  if (!data || data.insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No insights available</p>
            <p className="text-xs mt-1">Insights will appear as patterns are detected</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Group insights by category
  const positiveInsights = data.insights.filter(i => i.category === 'positive');
  const concerningInsights = data.insights.filter(i => i.category === 'concerning');
  const neutralInsights = data.insights.filter(i => i.category === 'neutral');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-5 ${className}`}
    >
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Insights</h3>
          <span className="text-xs text-muted-foreground">
            ({data.insights.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Category summary badges */}
          <div className="flex items-center gap-2">
            {positiveInsights.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                {positiveInsights.length} positive
              </span>
            )}
            {concerningInsights.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                {concerningInsights.length} concerning
              </span>
            )}
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {/* Show concerning first, then neutral, then positive */}
              {[...concerningInsights, ...neutralInsights, ...positiveInsights].map((insight, index) => (
                <InsightItem
                  key={insight.id}
                  insight={insight}
                  index={index}
                />
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Generated: {new Date(data.generatedAt).toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default InsightsPanel;
