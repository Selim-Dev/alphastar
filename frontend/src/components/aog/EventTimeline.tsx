import { format, differenceInHours, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface EventTimelineProps {
  detectedAt: Date | string;
  clearedAt?: Date | string | null;
  isActive: boolean;
}

function formatDuration(detectedAt: Date, clearedAt?: Date): { value: string; unit: string } {
  const endDate = clearedAt || new Date();
  const diffHours = differenceInHours(endDate, detectedAt);
  const diffDays = differenceInDays(endDate, detectedAt);
  
  if (diffHours < 1) {
    return { value: '<1', unit: 'hour' };
  }
  if (diffHours < 24) {
    return { value: diffHours.toString(), unit: diffHours === 1 ? 'hour' : 'hours' };
  }
  if (diffDays < 7) {
    const remainingHours = diffHours % 24;
    return { 
      value: `${diffDays}d ${remainingHours}h`, 
      unit: '' 
    };
  }
  if (diffDays < 30) {
    return { value: diffDays.toString(), unit: 'days' };
  }
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  return { 
    value: `${months}mo ${remainingDays}d`, 
    unit: '' 
  };
}

/**
 * Visual timeline component showing event start and end with duration
 * Requirements: 3.6, 10.1
 */
export function EventTimeline({ detectedAt, clearedAt, isActive }: EventTimelineProps) {
  const startDate = new Date(detectedAt);
  const endDate = clearedAt ? new Date(clearedAt) : undefined;
  const duration = formatDuration(startDate, endDate);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Event Timeline</h3>
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        {/* Horizontal line */}
        <div className="absolute top-8 left-12 right-12 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-green-500 rounded-full" />
        
        <div className="relative flex justify-between items-start">
          {/* Start point */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 z-10"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Detected
              </p>
              <p className="text-sm font-semibold text-foreground">
                {format(startDate, 'MMM dd, yyyy')}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(startDate, 'HH:mm')}
              </p>
            </div>
          </motion.div>

          {/* Duration display */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2 z-10 bg-card px-4 py-2 rounded-lg border border-border shadow-sm"
          >
            <Calendar className="w-5 h-5 text-primary" />
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {duration.value}
              </p>
              {duration.unit && (
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {duration.unit}
                </p>
              )}
            </div>
            {isActive && (
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs font-medium text-amber-600 dark:text-amber-400"
              >
                Ongoing
              </motion.p>
            )}
          </motion.div>

          {/* End point */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-3 z-10"
          >
            {isActive ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 relative">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-amber-500 opacity-30"
                  />
                  <Clock className="w-8 h-8 text-white relative z-10" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Status
                  </p>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    Still Active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Not yet cleared
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Cleared
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {endDate ? format(endDate, 'MMM dd, yyyy') : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {endDate ? format(endDate, 'HH:mm') : ''}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Additional info */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Start Date & Time</p>
            <p className="font-medium text-foreground">
              {format(startDate, 'EEEE, MMMM dd, yyyy')} at {format(startDate, 'HH:mm')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">
              {isActive ? 'Current Duration' : 'Total Duration'}
            </p>
            <p className="font-medium text-foreground">
              {duration.value} {duration.unit}
              {isActive && ' (and counting)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
