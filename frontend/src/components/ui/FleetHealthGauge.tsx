import { motion } from 'framer-motion';
import type { FleetHealthScore } from '@/types';

interface FleetHealthGaugeProps {
  data?: FleetHealthScore;
  isLoading?: boolean;
  size?: number;
}

export function FleetHealthGauge({ data, isLoading, size = 180 }: FleetHealthGaugeProps) {
  const score = data?.score ?? 0;
  const status = data?.status ?? 'warning';
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'healthy': return { stroke: '#22c55e', bg: 'bg-green-500/10', text: 'text-green-500' };
      case 'caution': return { stroke: '#eab308', bg: 'bg-yellow-500/10', text: 'text-yellow-500' };
      case 'warning': return { stroke: '#f97316', bg: 'bg-orange-500/10', text: 'text-orange-500' };
      case 'critical': return { stroke: '#ef4444', bg: 'bg-red-500/10', text: 'text-red-500' };
      default: return { stroke: '#6b7280', bg: 'bg-gray-500/10', text: 'text-gray-500' };
    }
  };

  const colors = getStatusColor(status);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 rounded-xl ${colors.bg}`} style={{ width: size, height: size + 40 }}>
        <div className="animate-pulse bg-muted rounded-full" style={{ width: size - 40, height: size - 40 }} />
        <div className="animate-pulse bg-muted h-4 w-20 mt-2 rounded" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-xl border border-border ${colors.bg}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/30"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-4xl font-bold ${colors.text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Score</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-semibold text-foreground">Fleet Health</p>
        <p className={`text-xs capitalize ${colors.text}`}>{status}</p>
      </div>
    </div>
  );
}
