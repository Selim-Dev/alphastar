import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Clock, 
  User, 
  FileText, 
  ArrowRight
} from 'lucide-react';
import type { StatusHistoryEntry, AOGWorkflowStatus } from '@/types';
import { AOG_WORKFLOW_STATUS_LABELS, BLOCKING_STATUSES, TERMINAL_STATUSES } from '@/types';

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
  currentStatus?: AOGWorkflowStatus;
  isLegacy?: boolean;
}

// Get color for status
function getStatusColor(status: AOGWorkflowStatus): { bg: string; border: string; text: string; dot: string } {
  if (TERMINAL_STATUSES.includes(status)) {
    return { 
      bg: 'bg-green-500/10', 
      border: 'border-green-500/30', 
      text: 'text-green-600',
      dot: 'bg-green-500'
    };
  }
  if (BLOCKING_STATUSES.includes(status)) {
    return { 
      bg: 'bg-amber-500/10', 
      border: 'border-amber-500/30', 
      text: 'text-amber-600',
      dot: 'bg-amber-500'
    };
  }
  if (status === 'REPORTED') {
    return { 
      bg: 'bg-red-500/10', 
      border: 'border-red-500/30', 
      text: 'text-red-600',
      dot: 'bg-red-500'
    };
  }
  return { 
    bg: 'bg-blue-500/10', 
    border: 'border-blue-500/30', 
    text: 'text-blue-600',
    dot: 'bg-blue-500'
  };
}

export function StatusTimeline({ history, currentStatus, isLegacy }: StatusTimelineProps) {
  if (isLegacy || history.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 text-center">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          {isLegacy 
            ? 'This is a legacy event. Status history is not available.'
            : 'No status transitions recorded yet.'}
        </p>
        {currentStatus && (
          <div className="mt-4">
            <span className="text-sm text-muted-foreground">Current Status: </span>
            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(currentStatus).bg} ${getStatusColor(currentStatus).text}`}>
              {AOG_WORKFLOW_STATUS_LABELS[currentStatus]}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />
        
        {history.map((entry, index) => {
          const colors = getStatusColor(entry.toStatus);
          const isLast = index === history.length - 1;
          
          return (
            <motion.div
              key={`${entry.timestamp}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-10 pb-6 last:pb-0"
            >
              {/* Timeline dot */}
              <div 
                className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${colors.bg} ${colors.border} border-2`}
              >
                <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
              </div>
              
              {/* Content card */}
              <div className={`bg-card border ${isLast ? colors.border : 'border-border'} rounded-lg p-4 shadow-sm`}>
                {/* Status transition header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(entry.fromStatus).bg} ${getStatusColor(entry.fromStatus).text}`}>
                    {AOG_WORKFLOW_STATUS_LABELS[entry.fromStatus]}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className={`px-2 py-0.5 text-xs rounded-full ${colors.bg} ${colors.text} font-medium`}>
                    {AOG_WORKFLOW_STATUS_LABELS[entry.toStatus]}
                  </span>
                </div>
                
                {/* Timestamp and actor */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{entry.actorRole}</span>
                  </div>
                </div>
                
                {/* Notes */}
                {entry.notes && (
                  <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border">
                    <FileText className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{entry.notes}</p>
                  </div>
                )}
                
                {/* Metadata references */}
                {(entry.partRequestId || entry.financeRef || entry.shippingRef || entry.opsRunRef) && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border">
                    {entry.partRequestId && (
                      <span className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-600 rounded-full">
                        Part: {entry.partRequestId.slice(-6)}
                      </span>
                    )}
                    {entry.financeRef && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 rounded-full">
                        Finance: {entry.financeRef}
                      </span>
                    )}
                    {entry.shippingRef && (
                      <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-600 rounded-full">
                        Shipping: {entry.shippingRef}
                      </span>
                    )}
                    {entry.opsRunRef && (
                      <span className="px-2 py-0.5 text-xs bg-orange-500/10 text-orange-600 rounded-full">
                        Ops Run: {entry.opsRunRef}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default StatusTimeline;
