import { motion } from 'framer-motion';
import { Wrench, Calendar, AlertTriangle, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MaintenanceForecastResponse, MaintenanceItem } from '@/types';

interface MaintenanceForecastProps {
  data?: MaintenanceForecastResponse;
  isLoading?: boolean;
  className?: string;
  maxItems?: number;
}

function getPriorityConfig(priority: MaintenanceItem['priority']) {
  switch (priority) {
    case 'critical':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        textColor: 'text-red-500',
        badgeColor: 'bg-red-500',
        label: 'Overdue',
      };
    case 'warning':
      return {
        icon: AlertCircle,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        textColor: 'text-amber-500',
        badgeColor: 'bg-amber-500',
        label: 'Due Soon',
      };
    case 'info':
    default:
      return {
        icon: Info,
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        textColor: 'text-blue-500',
        badgeColor: 'bg-blue-500',
        label: 'Upcoming',
      };
  }
}

function MaintenanceItemRow({
  item,
  index,
  onClick,
}: {
  item: MaintenanceItem;
  index: number;
  onClick: () => void;
}) {
  const config = getPriorityConfig(item.priority);
  const Icon = config.icon;
  const dueDate = new Date(item.dueDate);
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:scale-[1.01] ${config.bgColor} border ${config.borderColor}`}
    >
      <div className={`p-1.5 rounded-md ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.textColor}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{item.registration}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full text-white ${config.badgeColor}`}>
            {config.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {item.maintenanceType}
        </p>
      </div>
      
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
        <p className={`text-xs font-medium ${config.textColor}`}>
          {item.daysUntilDue < 0 
            ? `${Math.abs(item.daysUntilDue)}d overdue`
            : item.daysUntilDue === 0 
              ? 'Due today'
              : `${item.daysUntilDue}d remaining`
          }
        </p>
      </div>
      
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="animate-pulse bg-muted h-8 w-8 rounded-md" />
          <div className="flex-1 space-y-2">
            <div className="animate-pulse bg-muted h-4 w-24 rounded" />
            <div className="animate-pulse bg-muted h-3 w-32 rounded" />
          </div>
          <div className="space-y-1">
            <div className="animate-pulse bg-muted h-3 w-16 rounded" />
            <div className="animate-pulse bg-muted h-3 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MaintenanceForecast({
  data,
  isLoading,
  className = '',
  maxItems = 5,
}: MaintenanceForecastProps) {
  const navigate = useNavigate();

  const handleItemClick = (item: MaintenanceItem) => {
    navigate(`/aircraft/${item.aircraftId}`);
  };

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div className="animate-pulse h-5 w-40 bg-muted rounded" />
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Handle no data case
  if (!data || data.items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-card border border-border rounded-xl p-5 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Maintenance Forecast</h3>
        </div>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <div className="text-center">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No upcoming maintenance</p>
            <p className="text-xs mt-1">All aircraft are up to date</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const displayItems = data.items.slice(0, maxItems);
  const hasMore = data.items.length > maxItems;

  // Count by priority
  const criticalCount = data.items.filter(i => i.priority === 'critical').length;
  const warningCount = data.items.filter(i => i.priority === 'warning').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Maintenance Forecast</h3>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 font-medium">
              {criticalCount} overdue
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 font-medium">
              {warningCount} due soon
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {displayItems.map((item, index) => (
          <MaintenanceItemRow
            key={item.id}
            item={item}
            index={index}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => navigate('/maintenance')}
            className="w-full text-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View all {data.totalCount} items →
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default MaintenanceForecast;
