/**
 * NextStepActionPanel - Simplified Milestone-Based Workflow
 * 
 * This component has been simplified to work with the milestone-based AOG workflow.
 * Instead of complex 18-state transitions, it now guides users through setting
 * milestone timestamps in the correct order.
 * 
 * The actual milestone editing is handled by MilestoneEditForm component.
 * This panel provides guidance on what the next logical step should be.
 */

import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface NextStepActionPanelProps {
  milestones: {
    reportedAt?: string | Date;
    procurementRequestedAt?: string | Date;
    availableAtStoreAt?: string | Date;
    issuedBackAt?: string | Date;
    installationCompleteAt?: string | Date;
    testStartAt?: string | Date;
    upAndRunningAt?: string | Date;
  };
  isLegacy?: boolean;
  isActive: boolean;
}

/**
 * Determine the next logical milestone to set
 */
function getNextMilestone(milestones?: NextStepActionPanelProps['milestones']): {
  milestone: string;
  label: string;
  description: string;
} | null {
  // Handle undefined milestones
  if (!milestones) {
    return null;
  }

  // If event is completed (upAndRunningAt is set), no next step
  if (milestones.upAndRunningAt) {
    return null;
  }

  // If installation is complete but not up and running
  if (milestones.installationCompleteAt && !milestones.upAndRunningAt) {
    // Check if ops test is needed
    if (!milestones.testStartAt) {
      return {
        milestone: 'testStartAt',
        label: 'Start Ops Test (Optional)',
        description: 'If operational testing is required, set the test start time. Otherwise, proceed to mark aircraft as Up & Running.',
      };
    }
    // Ops test started, now complete it
    return {
      milestone: 'upAndRunningAt',
      label: 'Mark Up & Running',
      description: 'Set the timestamp when the aircraft was returned to service and the AOG event was cleared.',
    };
  }

  // If parts are issued but installation not complete
  if (milestones.issuedBackAt && !milestones.installationCompleteAt) {
    return {
      milestone: 'installationCompleteAt',
      label: 'Mark Installation Complete',
      description: 'Set the timestamp when the repair work and installation were completed.',
    };
  }

  // If parts are available but not issued
  if (milestones.availableAtStoreAt && !milestones.issuedBackAt) {
    return {
      milestone: 'issuedBackAt',
      label: 'Mark Parts Issued (Optional)',
      description: 'Set the timestamp when parts were issued to maintenance. This is optional - you can skip to Installation Complete.',
    };
  }

  // If procurement requested but parts not available
  if (milestones.procurementRequestedAt && !milestones.availableAtStoreAt) {
    return {
      milestone: 'availableAtStoreAt',
      label: 'Mark Parts Available',
      description: 'Set the timestamp when the required parts arrived and became available in stores.',
    };
  }

  // If reported but no procurement requested and no installation complete
  if (milestones.reportedAt && !milestones.procurementRequestedAt && !milestones.installationCompleteAt) {
    return {
      milestone: 'procurementRequestedAt',
      label: 'Request Procurement (Optional)',
      description: 'If parts are needed, set the procurement request time. If no parts needed, skip to Installation Complete.',
    };
  }

  // If reported but no installation complete (no parts path)
  if (milestones.reportedAt && !milestones.installationCompleteAt) {
    return {
      milestone: 'installationCompleteAt',
      label: 'Mark Installation Complete',
      description: 'If no parts were needed, set the timestamp when the repair work was completed.',
    };
  }

  // Default: should not reach here, but return null safely
  return null;
}

export function NextStepActionPanel({ 
  milestones,
  isLegacy,
  isActive
}: NextStepActionPanelProps) {
  const { canWrite } = usePermissions();

  // Viewer-only message
  if (!canWrite) {
    return (
      <div className="bg-muted/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Lock className="w-5 h-5" />
          <div>
            <p className="font-medium">View Only</p>
            <p className="text-sm">You don't have permission to update milestones.</p>
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
            <p className="text-sm">This is a legacy event. Milestone tracking is not available.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get next milestone
  const nextMilestone = getNextMilestone(milestones);

  // Event completed - only show this if the event is actually cleared (not active)
  if (!isActive) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <div>
            <p className="font-medium">Event Completed</p>
            <p className="text-sm">This AOG event has been resolved and cleared.</p>
          </div>
        </div>
      </div>
    );
  }

  // No next milestone found but event is still active - show generic message
  if (!nextMilestone) {
    return (
      <div className="bg-muted/30 rounded-xl p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <div>
            <p className="font-medium">No Next Step Available</p>
            <p className="text-sm">Unable to determine the next milestone. Please use "Edit Milestones" to update timestamps.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-blue-500/5">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-blue-500" />
          Suggested Next Step
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Based on the current milestones, here's what to do next
        </p>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-2">
              {nextMilestone.label}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {nextMilestone.description}
            </p>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-600 font-medium">
                💡 Tip: Click "Edit Milestones" in the Milestones tab above to update timestamps
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default NextStepActionPanel;
