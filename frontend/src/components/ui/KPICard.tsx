import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface KPICardProps {
  title: ReactNode;
  value: string | number | null | undefined;
  unit?: string;
  subtitle?: ReactNode;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  className?: string;
  delay?: number;
  loading?: boolean;
  emptyStateMessage?: string;
}

// Check if value is empty (null, undefined, 0, or empty string)
function isEmptyValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (value === 0) return true;
  if (value === '') return true;
  if (typeof value === 'string' && value.trim() === '0') return true;
  return false;
}

// Animated counter for numeric values
function AnimatedValue({ value }: { value: string | number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={String(displayValue)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {displayValue}
      </motion.span>
    </AnimatePresence>
  );
}


// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <AlertCircle className="h-4 w-4" />
        <span className="text-small">{message}</span>
      </div>
    </motion.div>
  );
}

// Trend indicator component
function TrendIndicator({ 
  trend, 
  delay 
}: { 
  trend: { value: number; isPositive: boolean }; 
  delay: number;
}) {
  const TrendIcon = trend.isPositive ? TrendingUp : TrendingDown;
  
  return (
    <motion.div 
      className="flex items-center gap-1.5 mt-3"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.25 }}
    >
      <motion.div
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-small font-medium ${
          trend.isPositive 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.3, delay: delay + 0.3 }}
      >
        <TrendIcon className="h-3 w-3" />
        <span>{Math.abs(trend.value)}%</span>
      </motion.div>
      <span className="text-tiny text-muted-foreground">vs last period</span>
    </motion.div>
  );
}

export function KPICard({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  onClick,
  className = '',
  delay = 0,
  loading = false,
  emptyStateMessage = 'No data available',
}: KPICardProps) {
  const isEmpty = isEmptyValue(value);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        scale: onClick ? 1.02 : 1,
        boxShadow: onClick ? 'var(--shadow-md)' : undefined,
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`bg-card border border-border rounded-xl p-5 shadow-theme-sm transition-all duration-200 min-h-[120px] ${
        onClick ? 'cursor-pointer hover:border-aviation/50 hover:shadow-theme' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title/Label */}
          <motion.p 
            className="text-small font-medium text-muted-foreground truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.1 }}
          >
            {title}
          </motion.p>
          
          {/* Value Display */}
          <motion.div
            className="mt-2"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.15, duration: 0.3 }}
          >
            {loading ? (
              <motion.div 
                className="h-10 w-24 bg-muted rounded-lg"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : isEmpty ? (
              <EmptyState message={emptyStateMessage} />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-display text-foreground">
                  <AnimatedValue value={value!} />
                </span>
                {unit && (
                  <span className="text-body text-muted-foreground font-medium">
                    {unit}
                  </span>
                )}
              </div>
            )}
          </motion.div>
          
          {/* Subtitle */}
          {subtitle && !isEmpty && (
            <motion.p 
              className="text-small text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
          
          {/* Trend Indicator */}
          {trend && !isEmpty && (
            <TrendIndicator trend={trend} delay={delay} />
          )}
        </div>
        
        {/* Icon Container */}
        {icon && (
          <motion.div 
            className="flex-shrink-0 w-11 h-11 rounded-lg bg-aviation-muted flex items-center justify-center text-aviation [&>svg]:w-6 [&>svg]:h-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
