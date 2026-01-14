import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DeltaValue } from '@/types';

interface KPICardEnhancedProps {
  title: React.ReactNode;
  value: string | number;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  delta?: DeltaValue;
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
  invertDelta?: boolean; // For metrics where down is good (e.g., AOG count)
}

function Sparkline({ data, trend }: { data: number[]; trend: 'up' | 'down' | 'flat' }) {
  if (!data || data.length < 2) return null;

  const width = 80;
  const height = 24;
  const padding = 2;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#6b7280';

  return (
    <svg width={width} height={height} className="ml-2">
      <motion.polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

function DeltaIndicator({ delta, invert }: { delta: DeltaValue; invert?: boolean }) {
  const isPositive = delta.value > 0;
  const isGood = invert ? !isPositive : isPositive;
  
  const Icon = delta.trend === 'up' ? TrendingUp : delta.trend === 'down' ? TrendingDown : Minus;
  const colorClass = delta.trend === 'flat' 
    ? 'text-muted-foreground' 
    : isGood 
      ? 'text-green-500' 
      : 'text-red-500';

  return (
    <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span>{delta.percentage > 0 ? '+' : ''}{delta.percentage.toFixed(1)}%</span>
    </div>
  );
}

export function KPICardEnhanced({
  title,
  value,
  subtitle,
  icon,
  delta,
  sparklineData,
  onClick,
  className = '',
  isLoading,
  invertDelta,
}: KPICardEnhancedProps) {
  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="animate-pulse bg-muted h-4 w-24 rounded" />
            <div className="animate-pulse bg-muted h-8 w-20 rounded" />
            <div className="animate-pulse bg-muted h-3 w-32 rounded" />
          </div>
          <div className="animate-pulse bg-muted h-10 w-10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      onClick={onClick}
      className={`bg-card border border-border rounded-xl p-4 transition-all ${onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-lg' : ''} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sparklineData && delta && (
              <Sparkline data={sparklineData} trend={invertDelta ? (delta.trend === 'up' ? 'down' : delta.trend === 'down' ? 'up' : 'flat') : delta.trend} />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {delta && <DeltaIndicator delta={delta} invert={invertDelta} />}
          </div>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
