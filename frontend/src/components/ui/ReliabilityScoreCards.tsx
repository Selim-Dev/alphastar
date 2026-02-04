import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';
import { AircraftReliability } from '../../lib/reliabilityScore';
import { ChartEmptyState } from './ChartEmptyState';

interface ReliabilityScoreCardsProps {
  mostReliable: AircraftReliability[];
  needsAttention: AircraftReliability[];
  isLoading?: boolean;
}

/**
 * ReliabilityScoreCards Component
 * 
 * Displays two columns showing:
 * - Most Reliable: Top 5 aircraft with highest reliability scores
 * - Needs Attention: Top 5 aircraft with lowest reliability scores
 * 
 * Each card shows:
 * - Aircraft registration
 * - Reliability score (0-100) with color gauge
 * - Event count
 * - Total downtime hours
 * - Trend indicator (↑ improving, → stable, ↓ declining)
 */
export function ReliabilityScoreCards({
  mostReliable,
  needsAttention,
  isLoading,
}: ReliabilityScoreCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (
    (!mostReliable || mostReliable.length === 0) &&
    (!needsAttention || needsAttention.length === 0)
  ) {
    return <ChartEmptyState message="No aircraft reliability data available" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Most Reliable Column */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-foreground">Most Reliable</h3>
        </div>
        <div className="space-y-3">
          {mostReliable.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No reliable aircraft data available
            </div>
          ) : (
            mostReliable.map((aircraft) => (
              <ReliabilityCard
                key={aircraft.aircraftId}
                aircraft={aircraft}
                variant="reliable"
              />
            ))
          )}
        </div>
      </div>

      {/* Needs Attention Column */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-semibold text-foreground">Needs Attention</h3>
        </div>
        <div className="space-y-3">
          {needsAttention.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No aircraft needing attention
            </div>
          ) : (
            needsAttention.map((aircraft) => (
              <ReliabilityCard
                key={aircraft.aircraftId}
                aircraft={aircraft}
                variant="attention"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface ReliabilityCardProps {
  aircraft: AircraftReliability;
  variant: 'reliable' | 'attention';
}

function ReliabilityCard({ aircraft, variant }: ReliabilityCardProps) {
  const borderColor =
    variant === 'reliable'
      ? 'border-green-500 dark:border-green-600'
      : 'border-red-500 dark:border-red-600';

  const scoreColor = getScoreColor(aircraft.reliabilityScore);

  return (
    <div
      className={`p-4 bg-card border-2 ${borderColor} rounded-lg hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-lg font-bold text-foreground">{aircraft.registration}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className={`text-2xl font-bold ${scoreColor}`}>
              {aircraft.reliabilityScore}
            </div>
            <div className="text-sm text-muted-foreground">/ 100</div>
            <TrendIndicator trend={aircraft.trend} />
          </div>
        </div>
        <ReliabilityGauge score={aircraft.reliabilityScore} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Events</div>
          <div className="font-semibold text-foreground">{aircraft.eventCount}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Downtime</div>
          <div className="font-semibold text-foreground">
            {aircraft.totalDowntimeHours.toFixed(1)}h
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  if (trend === 'improving') {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <TrendingUp className="w-4 h-4" />
        <span className="text-xs font-medium">Improving</span>
      </div>
    );
  }

  if (trend === 'declining') {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <TrendingDown className="w-4 h-4" />
        <span className="text-xs font-medium">Declining</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="w-4 h-4" />
      <span className="text-xs font-medium">Stable</span>
    </div>
  );
}

function ReliabilityGauge({ score }: { score: number }) {
  const percentage = score;
  const color = getScoreColor(score);

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={`${(percentage / 100) * 175.93} 175.93`}
          className={color}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-bold ${color}`}>{score}</span>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}
