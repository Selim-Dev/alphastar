import { format, differenceInMinutes } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  ArrowDown,
  Wrench,
  Package,
  Truck,
  Settings,
  PlayCircle,
  CheckSquare
} from 'lucide-react';

/**
 * Milestone definition for the simplified AOG workflow
 * Requirements: 3.4 - Display timestamps in a timeline view
 */
interface MilestoneDefinition {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isOptional: boolean;
  bucket: 'technical' | 'procurement' | 'ops' | null;
}

const MILESTONES: MilestoneDefinition[] = [
  {
    key: 'reportedAt',
    label: 'Reported',
    description: 'AOG event detected and reported',
    icon: AlertCircle,
    isOptional: false,
    bucket: 'technical',
  },
  {
    key: 'procurementRequestedAt',
    label: 'Procurement Requested',
    description: 'Parts procurement initiated',
    icon: Package,
    isOptional: true,
    bucket: 'technical',
  },
  {
    key: 'availableAtStoreAt',
    label: 'Available at Store',
    description: 'Parts arrived and available',
    icon: Truck,
    isOptional: true,
    bucket: 'procurement',
  },
  {
    key: 'issuedBackAt',
    label: 'Issued Back',
    description: 'Parts issued to maintenance',
    icon: Wrench,
    isOptional: true,
    bucket: 'technical',
  },
  {
    key: 'installationCompleteAt',
    label: 'Installation Complete',
    description: 'Parts installed and work completed',
    icon: Settings,
    isOptional: false,
    bucket: 'technical',
  },
  {
    key: 'testStartAt',
    label: 'Test Start',
    description: 'Operational testing initiated',
    icon: PlayCircle,
    isOptional: true,
    bucket: 'ops',
  },
  {
    key: 'upAndRunningAt',
    label: 'Up & Running',
    description: 'Aircraft returned to service',
    icon: CheckSquare,
    isOptional: false,
    bucket: 'ops',
  },
];

/**
 * Milestone timestamps from AOG event
 */
export interface MilestoneTimestamps {
  reportedAt?: string | Date;
  procurementRequestedAt?: string | Date;
  availableAtStoreAt?: string | Date;
  issuedBackAt?: string | Date;
  installationCompleteAt?: string | Date;
  testStartAt?: string | Date;
  upAndRunningAt?: string | Date;
}

/**
 * Computed downtime metrics
 */
export interface ComputedMetrics {
  technicalTimeHours: number;
  procurementTimeHours: number;
  opsTimeHours: number;
  totalDowntimeHours: number;
}

interface MilestoneTimelineProps {
  milestones: MilestoneTimestamps;
  computedMetrics?: ComputedMetrics;
  isLegacy?: boolean;
  detectedAt?: string | Date;
  clearedAt?: string | Date;
}

/**
 * Format duration between two timestamps
 */
function formatDuration(startDate: Date | null, endDate: Date | null): string {
  if (!startDate || !endDate) return '—';
  
  const totalMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remainingHours}h`;
}

/**
 * Get bucket color
 */
function getBucketColor(bucket: 'technical' | 'procurement' | 'ops' | null): string {
  switch (bucket) {
    case 'technical':
      return 'text-blue-500';
    case 'procurement':
      return 'text-amber-500';
    case 'ops':
      return 'text-purple-500';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Get bucket background color
 */
function getBucketBgColor(bucket: 'technical' | 'procurement' | 'ops' | null): string {
  switch (bucket) {
    case 'technical':
      return 'bg-blue-500/10 border-blue-500/30';
    case 'procurement':
      return 'bg-amber-500/10 border-amber-500/30';
    case 'ops':
      return 'bg-purple-500/10 border-purple-500/30';
    default:
      return 'bg-muted/30 border-border';
  }
}

/**
 * MilestoneTimeline Component
 * 
 * Displays milestone timestamps in a vertical timeline with computed time between milestones.
 * Indicates optional milestones that were skipped.
 * 
 * Requirements: 3.4 - Display timestamps in a timeline view
 */
export function MilestoneTimeline({ 
  milestones, 
  computedMetrics,
  isLegacy,
  detectedAt,
  clearedAt
}: MilestoneTimelineProps) {
  // For legacy events, show simplified view
  if (isLegacy) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">
          This is a legacy event. Milestone timeline is not available.
        </p>
        {detectedAt && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground">Detected:</span>
              <span className="font-medium text-foreground">
                {format(new Date(detectedAt), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
            {clearedAt && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-muted-foreground">Cleared:</span>
                <span className="font-medium text-foreground">
                  {format(new Date(clearedAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Parse milestone timestamps
  const parsedMilestones: Record<string, Date | null> = {};
  MILESTONES.forEach(m => {
    const value = milestones[m.key as keyof MilestoneTimestamps];
    parsedMilestones[m.key] = value ? new Date(value) : null;
  });

  // Find the last completed milestone index
  let lastCompletedIndex = -1;
  MILESTONES.forEach((m, index) => {
    if (parsedMilestones[m.key]) {
      lastCompletedIndex = index;
    }
  });

  return (
    <div className="space-y-6">
      {/* Downtime Summary */}
      {computedMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className={`rounded-lg p-3 border ${getBucketBgColor('technical')}`}>
            <p className="text-xs text-muted-foreground mb-1">Technical Time</p>
            <p className={`text-lg font-bold ${getBucketColor('technical')}`}>
              {computedMetrics.technicalTimeHours.toFixed(1)}h
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${getBucketBgColor('procurement')}`}>
            <p className="text-xs text-muted-foreground mb-1">Procurement Time</p>
            <p className={`text-lg font-bold ${getBucketColor('procurement')}`}>
              {computedMetrics.procurementTimeHours.toFixed(1)}h
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${getBucketBgColor('ops')}`}>
            <p className="text-xs text-muted-foreground mb-1">Ops Time</p>
            <p className={`text-lg font-bold ${getBucketColor('ops')}`}>
              {computedMetrics.opsTimeHours.toFixed(1)}h
            </p>
          </div>
          <div className="rounded-lg p-3 border bg-card border-border">
            <p className="text-xs text-muted-foreground mb-1">Total Downtime</p>
            <p className="text-lg font-bold text-foreground">
              {computedMetrics.totalDowntimeHours.toFixed(1)}h
            </p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />
        
        {MILESTONES.map((milestone, index) => {
          const timestamp = parsedMilestones[milestone.key];
          const isCompleted = !!timestamp;
          const isSkipped = !timestamp && milestone.isOptional && index < lastCompletedIndex;
          const isPending = !timestamp && !isSkipped;
          const Icon = milestone.icon;
          
          // Calculate duration to next milestone
          let durationToNext: string | null = null;
          if (timestamp && index < MILESTONES.length - 1) {
            // Find next completed milestone
            for (let i = index + 1; i < MILESTONES.length; i++) {
              const nextTimestamp = parsedMilestones[MILESTONES[i].key];
              if (nextTimestamp) {
                durationToNext = formatDuration(timestamp, nextTimestamp);
                break;
              }
            }
          }
          
          return (
            <motion.div
              key={milestone.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10 pb-6 last:pb-0"
            >
              {/* Timeline dot */}
              <div 
                className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                  isCompleted 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : isSkipped
                    ? 'bg-muted border-muted-foreground/30'
                    : 'bg-card border-border'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : isSkipped ? (
                  <Circle className="w-2 h-2 text-muted-foreground" />
                ) : (
                  <Circle className="w-2 h-2 text-muted-foreground" />
                )}
              </div>
              
              {/* Content card */}
              <div className={`bg-card border rounded-lg p-4 shadow-sm ${
                isCompleted 
                  ? `border-l-2 ${getBucketBgColor(milestone.bucket).split(' ')[1]} border-border`
                  : isSkipped
                  ? 'border-dashed border-muted-foreground/30 opacity-60'
                  : 'border-border'
              }`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${
                      isCompleted 
                        ? getBucketColor(milestone.bucket)
                        : 'text-muted-foreground'
                    }`} />
                    <span className={`font-medium ${
                      isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {milestone.label}
                    </span>
                    {milestone.isOptional && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </div>
                  
                  {/* Status badge */}
                  {isSkipped && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      Skipped
                    </span>
                  )}
                  {isPending && !milestone.isOptional && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-600">
                      Pending
                    </span>
                  )}
                </div>
                
                {/* Description */}
                <p className="text-xs text-muted-foreground mb-2">
                  {milestone.description}
                </p>
                
                {/* Timestamp */}
                {isCompleted && timestamp && (
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                      {format(timestamp, 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                )}
                
                {/* Duration to next */}
                {durationToNext && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                    <ArrowDown className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Duration to next: <span className="font-medium text-foreground">{durationToNext}</span>
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-3 h-3 rounded ${getBucketBgColor('technical').split(' ')[0]}`} />
          <span className="text-muted-foreground">Technical</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-3 h-3 rounded ${getBucketBgColor('procurement').split(' ')[0]}`} />
          <span className="text-muted-foreground">Procurement</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-3 h-3 rounded ${getBucketBgColor('ops').split(' ')[0]}`} />
          <span className="text-muted-foreground">Ops</span>
        </div>
      </div>
    </div>
  );
}

export default MilestoneTimeline;
