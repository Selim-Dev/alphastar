import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import type { AOGSummaryEvent } from '@/hooks/useDashboard';

interface ActiveAOGEventsWidgetProps {
  events?: AOGSummaryEvent[];
  isLoading?: boolean;
}

export function ActiveAOGEventsWidget({ events, isLoading }: ActiveAOGEventsWidgetProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active AOG Events</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active AOG Events</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No active AOG events</p>
          <p className="text-sm">All aircraft are operational</p>
        </div>
      </Card>
    );
  }

  const formatDuration = (hours: number): string => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Active AOG Events</h3>
        <button
          onClick={() => navigate('/aog/list')}
          className="text-sm text-primary hover:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {events.slice(0, 5).map((event) => (
          <div
            key={event.id}
            onClick={() => navigate(`/aog/${event.id}`)}
            className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {event.registration}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600 border border-red-500/20">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    ACTIVE
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {event.reasonCode}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {event.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(event.durationHours)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length > 5 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/aog/list')}
            className="text-sm text-primary hover:underline"
          >
            +{events.length - 5} more events
          </button>
        </div>
      )}
    </Card>
  );
}
