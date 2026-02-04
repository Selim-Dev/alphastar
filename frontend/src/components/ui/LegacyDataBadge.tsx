import { AlertTriangle, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LegacyDataBadgeProps {
  legacyCount: number;
  totalCount: number;
  className?: string;
}

/**
 * LegacyDataBadge Component
 * 
 * Displays a warning badge when legacy AOG events (without milestone timestamps)
 * are present in the dataset. Provides clear messaging about data limitations.
 * 
 * Requirements: FR-1.1, FR-1.3
 */
export function LegacyDataBadge({ legacyCount, totalCount, className = '' }: LegacyDataBadgeProps) {
  if (legacyCount === 0) return null;
  
  const percentage = (legacyCount / totalCount) * 100;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${className}`}>
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <span className="text-sm text-amber-800 dark:text-amber-200">
        <strong>Limited Analytics:</strong> {legacyCount} event{legacyCount !== 1 ? 's' : ''} ({percentage.toFixed(1)}%) lack milestone data
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex-shrink-0">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 cursor-help" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="space-y-2">
              <p className="font-semibold">What are legacy events?</p>
              <p className="text-sm">
                Legacy events were created before the milestone-based tracking system was implemented. 
                They show total downtime (clearedAt - detectedAt) but cannot be broken down into 
                Technical, Procurement, and Ops time buckets.
              </p>
              <p className="text-sm font-medium mt-2">
                To improve analytics accuracy, update recent events with milestone timestamps:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Reported At</li>
                <li>Procurement Requested At (if parts needed)</li>
                <li>Available At Store At (if parts ordered)</li>
                <li>Installation Complete At</li>
                <li>Test Start At (if ops testing required)</li>
                <li>Up & Running At</li>
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export default LegacyDataBadge;
