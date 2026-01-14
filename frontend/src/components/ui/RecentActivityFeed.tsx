import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Clock, 
  DollarSign,
  ChevronRight,
  User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RecentActivityResponse, ActivityEvent } from '@/types';

interface RecentActivityFeedProps {
  data?: RecentActivityResponse;
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

function getActivityConfig(type: ActivityEvent['type']) {
  switch (type) {
    case 'aog_created':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-red-500/10',
        iconColor: 'text-red-500',
        label: 'AOG Created',
      };
    case 'aog_cleared':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-500/10',
        iconColor: 'text-green-500',
        label: 'AOG Cleared',
      };
    case 'wo_created':
      return {
        icon: FileText,
        bgColor: 'bg-blue-500/10',
        iconColor: 'text-blue-500',
        label: 'Work Order Created',
      };
    case 'wo_closed':
      return {
        icon: CheckCircle,
        bgColor: 'bg-green-500/10',
        iconColor: 'text-green-500',
        label: 'Work Order Closed',
      };
    case 'status_updated':
      return {
        icon: Clock,
        bgColor: 'bg-amber-500/10',
        iconColor: 'text-amber-500',
        label: 'Status Updated',
      };
    case 'budget_updated':
      return {
        icon: DollarSign,
        bgColor: 'bg-purple-500/10',
        iconColor: 'text-purple-500',
        label: 'Budget Updated',
      };
    default:
      return {
        icon: Activity,
        bgColor: 'bg-muted',
        iconColor: 'text-muted-foreground',
        label: 'Activity',
      };
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function ActivityItem({
  activity,
  index,
  onClick,
}: {
  activity: ActivityEvent;
  index: number;
  onClick?: () => void;
}) {
  const config = getActivityConfig(activity.type);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
        onClick ? 'cursor-pointer hover:bg-muted/50' : ''
      }`}
    >
      <div className={`p-1.5 rounded-md flex-shrink-0 ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
          {activity.aircraftRegistration && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">
              {activity.aircraftRegistration}
            </span>
          )}
        </div>
        <p className="text-sm text-foreground mt-0.5 line-clamp-2">
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(activity.timestamp)}
          </span>
          {activity.userName && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              {activity.userName}
            </span>
          )}
        </div>
      </div>
      
      {onClick && (
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
      )}
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <div className="animate-pulse bg-muted h-7 w-7 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="animate-pulse bg-muted h-3 w-20 rounded" />
            <div className="animate-pulse bg-muted h-4 w-full rounded" />
            <div className="animate-pulse bg-muted h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivityFeed({
  data,
  isLoading,
  className = '',
  maxItems = 10,
}: RecentActivityFeedProps) {
  const navigate = useNavigate();

  const handleActivityClick = (activity: ActivityEvent) => {
    if (activity.actionUrl) {
      navigate(activity.actionUrl);
    } else if (activity.aircraftId) {
      navigate(`/aircraft/${activity.aircraftId}`);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="animate-pulse h-5 w-32 bg-muted rounded" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Handle no data case
  if (!data || data.activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-xs mt-1">Activity will appear here as changes are made</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const displayActivities = data.activities.slice(0, maxItems);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {data.totalCount} total
        </span>
      </div>
      
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {displayActivities.map((activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            index={index}
            onClick={activity.actionUrl || activity.aircraftId 
              ? () => handleActivityClick(activity) 
              : undefined
            }
          />
        ))}
      </div>
    </motion.div>
  );
}

export default RecentActivityFeed;
