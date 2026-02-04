import { 
  AlertCircle, 
  Wrench, 
  Calendar, 
  Building2, 
  Sparkles 
} from 'lucide-react';

interface CategoryBadgeProps {
  category: 'aog' | 'scheduled' | 'unscheduled' | 'mro' | 'cleaning';
  showTooltip?: boolean;
}

const CATEGORY_CONFIG = {
  aog: {
    label: 'AOG',
    color: 'red',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-600',
    borderClass: 'border-red-500/30',
    icon: AlertCircle,
    description: 'Aircraft On Ground - Critical grounding event',
  },
  unscheduled: {
    label: 'U-MX',
    color: 'amber',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-500/30',
    icon: Wrench,
    description: 'Unscheduled Maintenance - Reactive maintenance',
  },
  scheduled: {
    label: 'S-MX',
    color: 'blue',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-500/30',
    icon: Calendar,
    description: 'Scheduled Maintenance - Planned maintenance',
  },
  mro: {
    label: 'MRO',
    color: 'purple',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-600',
    borderClass: 'border-purple-500/30',
    icon: Building2,
    description: 'Maintenance Repair Overhaul - Extended facility-based maintenance',
  },
  cleaning: {
    label: 'CLEANING',
    color: 'green',
    bgClass: 'bg-green-500/15',
    textClass: 'text-green-600',
    borderClass: 'border-green-500/30',
    icon: Sparkles,
    description: 'Operational Cleaning',
  },
};

export function CategoryBadge({ category, showTooltip = true }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <div className="relative group inline-flex">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
