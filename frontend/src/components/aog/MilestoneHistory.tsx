import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  Clock, 
  User, 
  History,
  AlertCircle
} from 'lucide-react';

/**
 * Milestone History Entry from backend
 */
interface MilestoneHistoryEntry {
  milestone: string;
  timestamp: Date | string;
  recordedAt: Date | string;
  recordedBy: string;
}

interface MilestoneHistoryProps {
  history?: MilestoneHistoryEntry[];
  isLegacy?: boolean;
}

/**
 * Get human-readable milestone label
 */
function getMilestoneLabel(milestone: string): string {
  const labels: Record<string, string> = {
    reportedAt: 'Reported',
    procurementRequestedAt: 'Procurement Requested',
    availableAtStoreAt: 'Available at Store',
    issuedBackAt: 'Issued Back',
    installationCompleteAt: 'Installation Complete',
    testStartAt: 'Test Start',
    upAndRunningAt: 'Up & Running',
  };
  return labels[milestone] || milestone;
}

/**
 * MilestoneHistory Component
 * 
 * Displays the audit trail of milestone timestamp changes.
 * Shows who recorded each milestone and when.
 */
export function MilestoneHistory({ history, isLegacy }: MilestoneHistoryProps) {
  // Legacy event or no history
  if (isLegacy || !history || history.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 text-center">
        <History className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">
          {isLegacy 
            ? 'This is a legacy event. Milestone history is not available.'
            : 'No milestone changes recorded yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Milestone Change History</h3>
      </div>

      <div className="space-y-3">
        {history.map((entry, index) => (
          <motion.div
            key={`${entry.milestone}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-lg p-4"
          >
            {/* Milestone name */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">
                {getMilestoneLabel(entry.milestone)}
              </span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-600">
                Updated
              </span>
            </div>

            {/* Timestamp value */}
            <div className="flex items-center gap-2 text-sm mb-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Set to:</span>
              <span className="font-medium text-foreground">
                {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>

            {/* Recorded metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Recorded by: {entry.recordedBy || 'System'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>On: {format(new Date(entry.recordedAt), 'MMM dd, yyyy HH:mm')}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Info message */}
      <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-600">
          This history shows when each milestone timestamp was recorded or updated. 
          It provides an audit trail of who made changes and when.
        </p>
      </div>
    </div>
  );
}

export default MilestoneHistory;
