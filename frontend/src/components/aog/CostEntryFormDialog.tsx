import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import { Button, Input, FormField } from '@/components/ui/Form';
import { Dialog } from '@/components/ui/Dialog';
import {
  useCreateCostEntry,
  useUpdateCostEntry,
  type CostEntryDepartment,
  type CostEntryResponse,
} from '@/hooks/useAOGCostEntries';

// ── Constants ──────────────────────────────────────────────────────────────────

const DEPARTMENTS: CostEntryDepartment[] = [
  'QC',
  'Engineering',
  'Project Management',
  'Procurement',
  'Technical',
  'Others',
];

const DEPT_COLORS: Record<CostEntryDepartment, string> = {
  QC: 'bg-amber-500/15 text-amber-700 border-amber-500/40',
  Engineering: 'bg-blue-500/15 text-blue-700 border-blue-500/40',
  'Project Management': 'bg-purple-500/15 text-purple-700 border-purple-500/40',
  Procurement: 'bg-teal-500/15 text-teal-700 border-teal-500/40',
  Technical: 'bg-slate-500/15 text-slate-700 border-slate-500/40',
  Others: 'bg-green-500/15 text-green-700 border-green-500/40',
};

// ── Zod Schema ─────────────────────────────────────────────────────────────────

const costEntrySchema = z.object({
  internalCost: z
    .number({ message: 'Must be a number' })
    .min(0, 'Must be 0 or greater'),
  externalCost: z
    .number({ message: 'Must be a number' })
    .min(0, 'Must be 0 or greater'),
  note: z.string().optional(),
});

type CostEntryFormData = z.infer<typeof costEntrySchema>;

// ── Props ──────────────────────────────────────────────────────────────────────

interface CostEntryFormDialogProps {
  open: boolean;
  onClose: () => void;
  parentId: string;
  editingEntry?: CostEntryResponse | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CostEntryFormDialog({
  open,
  onClose,
  parentId,
  editingEntry,
  onSuccess,
  onError,
}: CostEntryFormDialogProps) {
  const isEditMode = !!editingEntry;

  // Step 1: department selection; Step 2: cost fields
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDept, setSelectedDept] = useState<CostEntryDepartment | null>(null);

  const createMutation = useCreateCostEntry();
  const updateMutation = useUpdateCostEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CostEntryFormData>({
    resolver: zodResolver(costEntrySchema),
    defaultValues: { internalCost: 0, externalCost: 0, note: '' },
  });

  // Reset state when dialog opens/closes or editing entry changes
  useEffect(() => {
    if (!open) return;
    if (editingEntry) {
      setSelectedDept(editingEntry.department);
      setStep(2);
      reset({
        internalCost: editingEntry.internalCost,
        externalCost: editingEntry.externalCost,
        note: editingEntry.note || '',
      });
    } else {
      setStep(1);
      setSelectedDept(null);
      reset({ internalCost: 0, externalCost: 0, note: '' });
    }
  }, [open, editingEntry, reset]);

  const handleDeptSelect = (dept: CostEntryDepartment) => {
    setSelectedDept(dept);
    setStep(2);
  };

  const onSubmit = async (data: CostEntryFormData) => {
    if (!selectedDept) return;
    try {
      if (isEditMode && editingEntry) {
        await updateMutation.mutateAsync({
          parentId,
          entryId: editingEntry._id,
          data: {
            department: selectedDept,
            internalCost: data.internalCost,
            externalCost: data.externalCost,
            note: data.note || undefined,
          },
        });
        onSuccess?.('Cost entry updated');
      } else {
        await createMutation.mutateAsync({
          parentId,
          data: {
            department: selectedDept,
            internalCost: data.internalCost,
            externalCost: data.externalCost,
            note: data.note || undefined,
          },
        });
        onSuccess?.('Cost entry created');
      }
      onClose();
    } catch {
      onError?.(isEditMode ? 'Failed to update cost entry' : 'Failed to create cost entry');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const title = isEditMode
    ? 'Edit Cost Entry'
    : step === 1
      ? 'Add Cost Breakdown — Select Department'
      : `Add Cost Breakdown — ${selectedDept}`;

  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="md">
      {/* ── Step 1: Department Selection ──────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select the department responsible for this cost entry.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => handleDeptSelect(dept)}
                className={`flex items-center justify-center px-4 py-3 rounded-lg border text-sm font-medium transition-all hover:opacity-90 ${DEPT_COLORS[dept]}`}
              >
                {dept}
              </button>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Cost Fields ───────────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Department badge + back button (create mode only) */}
          {!isEditMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Change department
              </button>
              {selectedDept && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DEPT_COLORS[selectedDept]}`}
                >
                  {selectedDept}
                </span>
              )}
            </div>
          )}

          {/* Edit mode: department selector */}
          {isEditMode && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Department</p>
              <div className="grid grid-cols-3 gap-2">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      selectedDept === dept
                        ? DEPT_COLORS[dept] + ' ring-2 ring-offset-1 ring-current'
                        : 'border-border text-muted-foreground hover:border-foreground/30'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Internal Cost (USD)" error={errors.internalCost} required>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                error={!!errors.internalCost}
                {...register('internalCost', { valueAsNumber: true })}
              />
            </FormField>

            <FormField label="External Cost (USD)" error={errors.externalCost} required>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                error={!!errors.externalCost}
                {...register('externalCost', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField label="Note" error={errors.note}>
            <textarea
              placeholder="Optional note..."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              {...register('note')}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditMode ? 'Update Entry' : 'Create Entry'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
