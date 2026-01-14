import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Edit2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button, Input, FormField } from '@/components/ui/Form';
import { useUpdateAOGEvent } from '@/hooks/useAOGEvents';
import type { AOGEvent } from '@/types';

/**
 * Milestone definition for the form
 */
interface MilestoneField {
  key: string;
  label: string;
  description: string;
  isOptional: boolean;
}

const MILESTONE_FIELDS: MilestoneField[] = [
  {
    key: 'reportedAt',
    label: 'Reported',
    description: 'When the AOG event was detected and reported',
    isOptional: false,
  },
  {
    key: 'procurementRequestedAt',
    label: 'Procurement Requested',
    description: 'When parts procurement was initiated',
    isOptional: true,
  },
  {
    key: 'availableAtStoreAt',
    label: 'Available at Store',
    description: 'When parts arrived and became available',
    isOptional: true,
  },
  {
    key: 'issuedBackAt',
    label: 'Issued Back',
    description: 'When parts were issued to maintenance',
    isOptional: true,
  },
  {
    key: 'installationCompleteAt',
    label: 'Installation Complete',
    description: 'When parts were installed and work completed',
    isOptional: false,
  },
  {
    key: 'testStartAt',
    label: 'Test Start',
    description: 'When operational testing was initiated',
    isOptional: true,
  },
  {
    key: 'upAndRunningAt',
    label: 'Up & Running',
    description: 'When aircraft returned to service',
    isOptional: false,
  },
];

/**
 * Validation schema for milestone timestamps
 * Requirements: 3.2 - Validate chronological order
 */
const milestoneSchema = z.object({
  reportedAt: z.string().optional(),
  procurementRequestedAt: z.string().optional(),
  availableAtStoreAt: z.string().optional(),
  issuedBackAt: z.string().optional(),
  installationCompleteAt: z.string().optional(),
  testStartAt: z.string().optional(),
  upAndRunningAt: z.string().optional(),
}).refine((data) => {
  // Validate chronological order
  const timestamps: { key: string; value: Date | null }[] = [
    { key: 'reportedAt', value: data.reportedAt ? new Date(data.reportedAt) : null },
    { key: 'procurementRequestedAt', value: data.procurementRequestedAt ? new Date(data.procurementRequestedAt) : null },
    { key: 'availableAtStoreAt', value: data.availableAtStoreAt ? new Date(data.availableAtStoreAt) : null },
    { key: 'issuedBackAt', value: data.issuedBackAt ? new Date(data.issuedBackAt) : null },
    { key: 'installationCompleteAt', value: data.installationCompleteAt ? new Date(data.installationCompleteAt) : null },
    { key: 'testStartAt', value: data.testStartAt ? new Date(data.testStartAt) : null },
    { key: 'upAndRunningAt', value: data.upAndRunningAt ? new Date(data.upAndRunningAt) : null },
  ];

  let lastTimestamp: Date | null = null;
  for (const ts of timestamps) {
    if (ts.value) {
      if (lastTimestamp && ts.value < lastTimestamp) {
        return false;
      }
      lastTimestamp = ts.value;
    }
  }
  return true;
}, {
  message: 'Milestone timestamps must be in chronological order',
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

interface MilestoneEditFormProps {
  aogEvent: AOGEvent;
  onUpdate?: () => void;
  onCancel?: () => void;
}

/**
 * Format datetime-local input value
 */
function formatDateTimeLocal(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

/**
 * MilestoneEditForm Component
 * 
 * Allows editing individual milestone timestamps with validation.
 * 
 * Requirements:
 * - 3.1: Record timestamps for milestones
 * - 3.2: Validate chronological order
 * - 3.5: Preserve who recorded each timestamp
 */
export function MilestoneEditForm({ aogEvent, onUpdate, onCancel }: MilestoneEditFormProps) {
  const updateMutation = useUpdateAOGEvent();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema) as never,
    defaultValues: {
      reportedAt: formatDateTimeLocal(aogEvent.reportedAt || aogEvent.detectedAt),
      procurementRequestedAt: formatDateTimeLocal(aogEvent.procurementRequestedAt),
      availableAtStoreAt: formatDateTimeLocal(aogEvent.availableAtStoreAt),
      issuedBackAt: formatDateTimeLocal(aogEvent.issuedBackAt),
      installationCompleteAt: formatDateTimeLocal(aogEvent.installationCompleteAt),
      testStartAt: formatDateTimeLocal(aogEvent.testStartAt),
      upAndRunningAt: formatDateTimeLocal(aogEvent.upAndRunningAt || aogEvent.clearedAt),
    },
  });

  const handleSubmit = async (data: MilestoneFormData) => {
    setError(null);
    setSuccess(false);

    try {
      const eventId = (aogEvent as unknown as { id?: string }).id || aogEvent._id;
      
      // Convert empty strings to undefined
      const updateData: Record<string, string | undefined> = {};
      Object.entries(data).forEach(([key, value]) => {
        updateData[key] = value || undefined;
      });

      await updateMutation.mutateAsync({
        id: eventId,
        ...updateData,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onUpdate?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update milestones');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Edit2 className="w-4 h-4 text-primary" />
          Edit Milestone Timestamps
        </h3>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {MILESTONE_FIELDS.map((field) => (
          <div key={field.key} className="bg-muted/30 rounded-lg p-4">
            <FormField
              label={
                <div className="flex items-center gap-2">
                  <span>{field.label}</span>
                  {field.isOptional && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
                      Optional
                    </span>
                  )}
                </div>
              }
              error={form.formState.errors[field.key as keyof MilestoneFormData]}
            >
              <div className="space-y-1">
                <Input
                  type="datetime-local"
                  {...form.register(field.key as keyof MilestoneFormData)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
            </FormField>
          </div>
        ))}

        {/* Validation error message */}
        <AnimatePresence>
          {form.formState.errors.root && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
            >
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Milestones updated successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Changes will be recorded with your user ID</span>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" isLoading={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default MilestoneEditForm;
