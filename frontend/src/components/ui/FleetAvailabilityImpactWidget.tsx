import { AlertTriangle, TrendingDown } from 'lucide-react';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

interface UnavailableAircraft {
  registration: string;
  reason: string;
  durationDays: number;
}

interface FleetAvailabilityImpactWidgetProps {
  unavailableAircraft?: UnavailableAircraft[];
  totalAircraft?: number;
  isLoading?: boolean;
}

export function FleetAvailabilityImpactWidget({ 
  unavailableAircraft, 
  totalAircraft = 17, // Default fleet size
  isLoading 
}: FleetAvailabilityImpactWidgetProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fleet Availability Impact</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!unavailableAircraft || unavailableAircraft.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fleet Availability Impact</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No aircraft unavailable</p>
          <p className="text-sm">Full fleet operational</p>
        </div>
      </Card>
    );
  }

  const impactPercentage = ((unavailableAircraft.length / totalAircraft) * 100).toFixed(1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Fleet Availability Impact</h3>
        <div className="flex items-center gap-2 text-red-600">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-medium">-{impactPercentage}%</span>
        </div>
      </div>

      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Unavailable Aircraft</span>
          <span className="text-lg font-semibold text-red-600">
            {unavailableAircraft.length} / {totalAircraft}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {unavailableAircraft.map((aircraft, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="font-semibold text-foreground">
                {aircraft.registration}
              </span>
              <span className="text-xs text-muted-foreground">
                {aircraft.durationDays}d
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {aircraft.reason}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fleet Impact</span>
          <span className="font-medium text-red-600">
            {impactPercentage}% capacity reduction
          </span>
        </div>
      </div>
    </Card>
  );
}
