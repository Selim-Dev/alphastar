import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface StatusSummaryBarProps {
  active: number;
  inMaintenance: number;
  aog: number;
  total: number;
  isLoading?: boolean;
}

export function StatusSummaryBar({ active, inMaintenance, aog, total, isLoading }: StatusSummaryBarProps) {
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="animate-pulse bg-muted h-5 w-32 rounded" />
          <div className="animate-pulse bg-muted h-5 w-16 rounded" />
        </div>
        <div className="animate-pulse bg-muted h-8 rounded-full" />
      </div>
    );
  }

  const segments = [
    { label: 'Active', count: active, color: 'bg-green-500', hoverColor: 'hover:bg-green-600', percentage: total > 0 ? (active / total) * 100 : 0 },
    { label: 'Maintenance', count: inMaintenance, color: 'bg-amber-500', hoverColor: 'hover:bg-amber-600', percentage: total > 0 ? (inMaintenance / total) * 100 : 0 },
    { label: 'AOG', count: aog, color: 'bg-red-500', hoverColor: 'hover:bg-red-600', percentage: total > 0 ? (aog / total) * 100 : 0 },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Fleet Status</h3>
        <span className="text-sm text-muted-foreground">{total} Aircraft</span>
      </div>
      
      {/* Status Bar */}
      <div className="h-8 flex rounded-full overflow-hidden bg-muted/30">
        {segments.map((segment, index) => (
          segment.percentage > 0 && (
            <motion.div
              key={segment.label}
              initial={{ width: 0 }}
              animate={{ width: `${segment.percentage}%` }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
              onClick={() => navigate('/availability')}
              className={`${segment.color} ${segment.hoverColor} cursor-pointer transition-colors relative group`}
              title={`${segment.label}: ${segment.count} (${segment.percentage.toFixed(1)}%)`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <span className="font-medium">{segment.label}:</span> {segment.count} ({segment.percentage.toFixed(1)}%)
              </div>
            </motion.div>
          )
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${segment.color}`} />
            <span className="text-xs text-muted-foreground">
              {segment.label} ({segment.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
