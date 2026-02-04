import { format, differenceInHours, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { History, ArrowRight, Clock, Calendar } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import type { AOGEvent } from '@/types';

interface RelatedEventsProps {
  events: AOGEvent[];
  currentEventId: string;
}

function formatDuration(detectedAt: Date | string, clearedAt?: Date | string | null): string {
  const startDate = new Date(detectedAt);
  const endDate = clearedAt ? new Date(clearedAt) : new Date();
  const diffHours = differenceInHours(endDate, startDate);
  const diffDays = differenceInDays(endDate, startDate);
  
  if (diffHours < 1) return '<1 hour';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) return `${diffDays} days`;
  const months = Math.floor(diffDays / 30);
  return `${months} month${months > 1 ? 's' : ''}`;
}

/**
 * Related events component showing other events for the same aircraft
 * Requirements: 10.3
 */
export function RelatedEvents({ events, currentEventId }: RelatedEventsProps) {
  // Filter out current event and sort by date (most recent first)
  const relatedEvents = events
    .filter(e => e._id !== currentEventId)
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
    .slice(0, 5); // Show max 5 related events

  if (relatedEvents.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Related Events</h3>
        </div>
        <div className="text-center py-8">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No other events found for this aircraft</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Related Events</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {relatedEvents.length} event{relatedEvents.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {relatedEvents.map((event, index) => {
          const isActive = !event.clearedAt;
          const duration = formatDuration(event.detectedAt, event.clearedAt);

          return (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/aog/${event._id}`}
                className="block group"
              >
                <div className="bg-muted/30 hover:bg-muted/50 rounded-lg p-4 transition-all border border-transparent hover:border-primary/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Status and Category */}
                      <div className="flex items-center gap-2 mb-2">
                        <StatusBadge isActive={isActive} size="sm" />
                        <CategoryBadge category={event.category} showTooltip={false} />
                      </div>

                      {/* Defect description */}
                      <p className="text-sm font-medium text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.reasonCode || 'No description'}
                      </p>

                      {/* Date and duration */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(event.detectedAt), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Arrow icon */}
                    <div className="flex-shrink-0 mt-1">
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {events.length > 6 && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            Showing {relatedEvents.length} of {events.length - 1} related events
          </p>
        </div>
      )}
    </div>
  );
}
