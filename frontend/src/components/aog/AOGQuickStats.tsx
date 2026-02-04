import { FileText, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { formatDuration } from '@/lib/formatDuration';
import type { AOGEvent } from '@/types';

interface AOGQuickStatsProps {
  events: (AOGEvent & { downtimeHours?: number })[];
}

export function AOGQuickStats({ events }: AOGQuickStatsProps) {
  // Calculate stats
  const totalEvents = events.length;
  const activeEvents = events.filter((e) => !e.clearedAt).length;
  const resolvedEvents = events.filter((e) => e.clearedAt).length;
  
  // Calculate average duration (only for events with downtimeHours)
  const eventsWithDuration = events.filter((e) => e.downtimeHours !== undefined && e.downtimeHours > 0);
  const totalDuration = eventsWithDuration.reduce((sum, e) => sum + (e.downtimeHours || 0), 0);
  const avgDuration = eventsWithDuration.length > 0 ? totalDuration / eventsWithDuration.length : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        title="Total Events"
        value={totalEvents}
        icon={<FileText />}
        delay={0}
      />
      
      <KPICard
        title="Active Events"
        value={activeEvents}
        icon={<AlertCircle />}
        className="border-red-500/30 bg-red-500/5"
        delay={0.1}
      />
      
      <KPICard
        title="Resolved Events"
        value={resolvedEvents}
        icon={<CheckCircle2 />}
        className="border-green-500/30 bg-green-500/5"
        delay={0.2}
      />
      
      <KPICard
        title="Average Duration"
        value={avgDuration > 0 ? formatDuration(avgDuration) : 'N/A'}
        icon={<Clock />}
        delay={0.3}
      />
    </div>
  );
}
