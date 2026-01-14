import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronRight, FileWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DefectPatternsResponse, DefectPattern } from '@/types';
import { GlossaryTerm } from './GlossaryTooltip';

interface DefectPatternsProps {
  data?: DefectPatternsResponse;
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

function getTrendConfig(trend: DefectPattern['trend']) {
  switch (trend) {
    case 'increasing':
      return {
        icon: TrendingUp,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        label: 'Increasing',
      };
    case 'decreasing':
      return {
        icon: TrendingDown,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        label: 'Decreasing',
      };
    case 'stable':
    default:
      return {
        icon: Minus,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/30',
        borderColor: 'border-transparent',
        label: 'Stable',
      };
  }
}

function PatternBar({
  pattern,
  maxCount,
  index,
  onClick,
}: {
  pattern: DefectPattern;
  maxCount: number;
  index: number;
  onClick: () => void;
}) {
  const trendConfig = getTrendConfig(pattern.trend);
  const TrendIcon = trendConfig.icon;
  const barWidth = maxCount > 0 ? (pattern.count / maxCount) * 100 : 0;
  const isWarning = pattern.trend === 'increasing';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01] border ${trendConfig.bgColor} ${trendConfig.borderColor}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-foreground">
            <GlossaryTerm term="ATA" /> {pattern.ataChapter}
          </span>
          {isWarning && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs ${trendConfig.color}`}>
            <TrendIcon className="w-3 h-3" />
            {trendConfig.label}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
        {pattern.ataDescription}
      </p>
      
      {/* Progress bar */}
      <div className="relative h-6 bg-muted/50 rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`absolute inset-y-0 left-0 ${isWarning ? 'bg-red-500/30' : 'bg-primary/30'} rounded`}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <span className="text-xs font-medium text-foreground">
            {pattern.count} issues
          </span>
          {pattern.previousCount > 0 && (
            <span className="text-xs text-muted-foreground">
              prev: {pattern.previousCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Top affected aircraft */}
      {pattern.topAircraft && pattern.topAircraft.length > 0 && (
        <div className="flex items-center gap-1 mt-2">
          <span className="text-xs text-muted-foreground">Top:</span>
          {pattern.topAircraft.slice(0, 3).map((reg) => (
            <span key={reg} className="text-xs px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">
              {reg}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <div className="animate-pulse bg-muted h-4 w-16 rounded" />
            <div className="animate-pulse bg-muted h-4 w-20 rounded" />
          </div>
          <div className="animate-pulse bg-muted h-3 w-full rounded mb-2" />
          <div className="animate-pulse bg-muted h-6 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

export function DefectPatterns({
  data,
  isLoading,
  className = '',
  maxItems = 5,
}: DefectPatternsProps) {
  const navigate = useNavigate();

  const handlePatternClick = (pattern: DefectPattern) => {
    navigate(`/discrepancies?ataChapter=${pattern.ataChapter}`);
  };

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileWarning className="w-5 h-5 text-primary" />
          </div>
          <div className="animate-pulse h-5 w-32 bg-muted rounded" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Handle no data case
  if (!data || data.patterns.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileWarning className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Defect Patterns</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <FileWarning className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No defect patterns detected</p>
            <p className="text-xs mt-1">Patterns will appear as discrepancies are logged</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const displayPatterns = data.patterns.slice(0, maxItems);
  const maxCount = Math.max(...displayPatterns.map(p => p.count));
  const increasingCount = data.patterns.filter(p => p.trend === 'increasing').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileWarning className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Defect Patterns</h3>
            <p className="text-xs text-muted-foreground">
              Top {displayPatterns.length} ATA chapters by issue count
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {data.totalDiscrepancies} total
          </span>
          {increasingCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 font-medium">
              {increasingCount} increasing
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {displayPatterns.map((pattern, index) => (
          <PatternBar
            key={pattern.ataChapter}
            pattern={pattern}
            maxCount={maxCount}
            index={index}
            onClick={() => handlePatternClick(pattern)}
          />
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Period: {new Date(data.period.startDate).toLocaleDateString()} - {new Date(data.period.endDate).toLocaleDateString()}
        </p>
        <button
          onClick={() => navigate('/discrepancies')}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View all discrepancies →
        </button>
      </div>
    </motion.div>
  );
}

export default DefectPatterns;
