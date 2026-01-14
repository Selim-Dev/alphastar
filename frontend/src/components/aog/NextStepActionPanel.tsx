import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Pause,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Button, Textarea, Select, FormField } from '@/components/ui/Form';
import { useTransitionAOGStatus } from '@/hooks/useAOGEvents';
import { usePermissions } from '@/hooks/usePermissions';
import type { AOGWorkflowStatus, BlockingReason, CreateTransitionDto } from '@/types';
import { 
  AOG_WORKFLOW_STATUS_LABELS,
  ALLOWED_TRANSITIONS, 
  BLOCKING_STATUSES, 
  TERMINAL_STATUSES 
} from '@/types';

interface NextStepActionPanelProps {
  aogEventId: string;
  currentStatus: AOGWorkflowStatus;
  isLegacy?: boolean;
  onTransitionSuccess?: () => void;
}

// Get color for status button
function getStatusButtonStyle(status: AOGWorkflowStatus): string {
  if (TERMINAL_STATUSES.includes(status)) {
    return 'bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20';
  }
  if (BLOCKING_STATUSES.includes(status)) {
    return 'bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20';
  }
  return 'bg-blue-500/10 border-blue-500/30 text-blue-600 hover:bg-blue-500/20';
}

// Blocking reason options
const BLOCKING_REASON_OPTIONS: { value: BlockingReason; label: string }[] = [
  { value: 'Finance', label: 'Finance' },
  { value: 'Port', label: 'Port' },
  { value: 'Customs', label: 'Customs' },
  { value: 'Vendor', label: 'Vendor' },
  { value: 'Ops', label: 'Operations' },
  { value: 'Other', label: 'Other' },
];

export function NextStepActionPanel({ 
  aogEventId, 
  currentStatus, 
  isLegacy,
  onTransitionSuccess 
}: NextStepActionPanelProps) {
  const { canWrite } = usePermissions();
  const transitionMutation = useTransitionAOGStatus();
  
  const [selectedStatus, setSelectedStatus] = useState<AOGWorkflowStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [blockingReason, setBlockingReason] = useState<BlockingReason | ''>('');
  const [showForm, setShowForm] = useState(false);

  // Get available transitions for current status
  const availableTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
  const isTerminal = TERMINAL_STATUSES.includes(currentStatus);
  const requiresBlockingReason = selectedStatus && BLOCKING_STATUSES.includes(selectedStatus);

  const handleSelectTransition = (status: AOGWorkflowStatus) => {
    setSelectedStatus(status);
    setShowForm(true);
    setNotes('');
    setBlockingReason('');
  };

  const handleCancel = () => {
    setSelectedStatus(null);
    setShowForm(false);
    setNotes('');
    setBlockingReason('');
  };

  const handleSubmit = async () => {
    if (!selectedStatus) return;
    
    // Validate blocking reason if required
    if (requiresBlockingReason && !blockingReason) {
      return;
    }

    const transition: CreateTransitionDto = {
      toStatus: selectedStatus,
      notes: notes || undefined,
      blockingReason: requiresBlockingReason ? (blockingReason as BlockingReason) : undefined,
    };

    try {
      await transitionMutation.mutateAsync({
        id: aogEventId,
        transition,
      });
      handleCancel();
      onTransitionSuccess?.();
    } catch (error) {
      console.error('Failed to transition status:', error);
    }
  };

  // Viewer-only message
  if (!canWrite) {
    return (
      <div className="bg-muted/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Lock className="w-5 h-5" />
          <div>
            <p className="font-medium">View Only</p>
            <p className="text-sm">You don't have permission to transition AOG status.</p>
          </div>
        </div>
      </div>
    );
  }

  // Legacy event message
  if (isLegacy) {
    return (
      <div className="bg-muted/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">Legacy Event</p>
            <p className="text-sm">This is a legacy event. Status transitions are not available.</p>
          </div>
        </div>
      </div>
    );
  }

  // Terminal status message
  if (isTerminal) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <div>
            <p className="font-medium">Event Completed</p>
            <p className="text-sm">This AOG event has been resolved and closed.</p>
          </div>
        </div>
      </div>
    );
  }

  // No available transitions
  if (availableTransitions.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Pause className="w-5 h-5" />
          <div>
            <p className="font-medium">No Available Transitions</p>
            <p className="text-sm">There are no available next steps from the current status.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-primary" />
          Next Steps
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select the next status for this AOG event
        </p>
      </div>

      {/* Content */}
      <div className="p-5">
        {!showForm ? (
          /* Available transitions */
          <div className="space-y-2">
            {availableTransitions.map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectTransition(status)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${getStatusButtonStyle(status)}`}
              >
                <div className="flex items-center gap-3">
                  {TERMINAL_STATUSES.includes(status) ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : BLOCKING_STATUSES.includes(status) ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                  <span className="font-medium">{AOG_WORKFLOW_STATUS_LABELS[status]}</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            ))}
          </div>
        ) : (
          /* Transition form */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Selected transition */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Transitioning to:</span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusButtonStyle(selectedStatus!)}`}>
                {AOG_WORKFLOW_STATUS_LABELS[selectedStatus!]}
              </span>
            </div>

            {/* Blocking reason (if required) */}
            {requiresBlockingReason && (
              <FormField label="Blocking Reason" required>
                <Select
                  value={blockingReason}
                  onChange={(e) => setBlockingReason(e.target.value as BlockingReason | '')}
                  options={BLOCKING_REASON_OPTIONS}
                  error={!blockingReason}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This status requires a blocking reason to be specified.
                </p>
              </FormField>
            )}

            {/* Notes */}
            <FormField label="Notes">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transition..."
                rows={3}
              />
            </FormField>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={transitionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={transitionMutation.isPending}
                disabled={!!requiresBlockingReason && !blockingReason}
              >
                Confirm Transition
              </Button>
            </div>

            {/* Error message */}
            {transitionMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to transition status. Please try again.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default NextStepActionPanel;
