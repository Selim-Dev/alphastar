import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Select, Textarea, FormField } from '@/components/ui/Form';
import { Dialog } from '@/components/ui/Dialog';
import { useCreateSubEvent, useUpdateSubEvent, useAddHandoff, useUpdateHandoff, useRemoveHandoff } from '@/hooks/useAOGSubEvents';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DepartmentHandoffResponse {
  _id: string;
  department: 'QC' | 'Engineering' | 'Project Management' | 'Procurement' | 'Technical' | 'MCC' | 'Others';
  sentAt: string;
  returnedAt: string | null;
  notes: string | null;
}

interface SubEventResponse {
  _id: string;
  parentEventId: string;
  category: 'aog' | 'scheduled' | 'unscheduled';
  reasonCode: string;
  actionTaken: string;
  detectedAt: string;
  clearedAt: string | null;
  manpowerCount: number;
  manHours: number;
  departmentHandoffs: DepartmentHandoffResponse[];
  technicalTimeHours: number;
  departmentTimeHours: number;
  departmentTimeTotals: Record<string, number>;
  totalDowntimeHours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubEventFormDialogProps {
  open: boolean;
  onClose: () => void;
  parentId: string;
  editingSubEvent?: SubEventResponse | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

// ── Options ────────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'aog', label: 'AOG' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'unscheduled', label: 'Unscheduled' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'QC', label: 'QC' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Project Management', label: 'Project Management' },
  { value: 'Procurement', label: 'Procurement' },
  { value: 'Technical', label: 'Technical' },
  { value: 'MCC', label: 'MCC' },
  { value: 'Others', label: 'Others' },
];

// ── Zod Schema ─────────────────────────────────────────────────────────────────

const handoffSchema = z.object({
  department: z.enum(['QC', 'Engineering', 'Project Management', 'Procurement', 'Technical', 'MCC', 'Others'], {
    error: 'Department is required',
  }),
  sentAt: z.string().min(1, 'Sent date is required'),
  returnedAt: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => !data.returnedAt || !data.sentAt || data.returnedAt >= data.sentAt,
  { message: 'Returned date must be on or after sent date', path: ['returnedAt'] },
);

const subEventFormSchema = z.object({
  category: z.enum(['aog', 'scheduled', 'unscheduled'], {
    error: 'Category is required',
  }),
  reasonCode: z.string().min(1, 'Reason code is required'),
  actionTaken: z.string().min(1, 'Action taken is required'),
  detectedAt: z.string().min(1, 'Detected date is required'),
  clearedAt: z.string().optional(),
  manpowerCount: z.number().min(0, 'Must be 0 or greater'),
  manHours: z.number().min(0, 'Must be 0 or greater'),
  notes: z.string().optional(),
  departmentHandoffs: z.array(handoffSchema).optional(),
});

type SubEventFormData = z.infer<typeof subEventFormSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    return format(new Date(isoString), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function SubEventFormDialog({
  open,
  onClose,
  parentId,
  editingSubEvent,
  onSuccess,
  onError,
}: SubEventFormDialogProps) {
  const isEditMode = !!editingSubEvent;
  const createMutation = useCreateSubEvent();
  const updateMutation = useUpdateSubEvent();
  const addHandoffMutation = useAddHandoff();
  const updateHandoffMutation = useUpdateHandoff();
  const removeHandoffMutation = useRemoveHandoff();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubEventFormData>({
    resolver: zodResolver(subEventFormSchema),
    defaultValues: {
      category: 'aog',
      reasonCode: '',
      actionTaken: '',
      detectedAt: '',
      clearedAt: '',
      manpowerCount: 0,
      manHours: 0,
      notes: '',
      departmentHandoffs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'departmentHandoffs',
  });

  // Reset form when dialog opens or editingSubEvent changes
  useEffect(() => {
    if (!open) return;
    if (editingSubEvent) {
      reset({
        category: editingSubEvent.category,
        reasonCode: editingSubEvent.reasonCode,
        actionTaken: editingSubEvent.actionTaken,
        detectedAt: toDateTimeLocal(editingSubEvent.detectedAt),
        clearedAt: toDateTimeLocal(editingSubEvent.clearedAt),
        manpowerCount: editingSubEvent.manpowerCount,
        manHours: editingSubEvent.manHours,
        notes: editingSubEvent.notes || '',
        departmentHandoffs: (editingSubEvent.departmentHandoffs || []).map((h) => ({
          department: h.department,
          sentAt: toDateTimeLocal(h.sentAt),
          returnedAt: toDateTimeLocal(h.returnedAt) || undefined,
          notes: h.notes || undefined,
        })),
      });
    } else {
      reset({
        category: 'aog',
        reasonCode: '',
        actionTaken: '',
        detectedAt: '',
        clearedAt: '',
        manpowerCount: 0,
        manHours: 0,
        notes: '',
        departmentHandoffs: [],
      });
    }
  }, [open, editingSubEvent, reset]);

  const onSubmit = async (data: SubEventFormData) => {
    try {
      if (isEditMode && editingSubEvent) {
        // Update sub-event fields
        await updateMutation.mutateAsync({
          parentId,
          subId: editingSubEvent._id,
          data: {
            category: data.category,
            reasonCode: data.reasonCode,
            actionTaken: data.actionTaken,
            detectedAt: new Date(data.detectedAt).toISOString(),
            clearedAt: data.clearedAt ? new Date(data.clearedAt).toISOString() : undefined,
            manpowerCount: data.manpowerCount,
            manHours: data.manHours,
            notes: data.notes || undefined,
          },
        });

        // Sync handoffs: compare form state with original
        const originalHandoffs = editingSubEvent.departmentHandoffs || [];
        const formHandoffs = data.departmentHandoffs || [];

        // Track which original handoffs are still present (by index mapping)
        // We use _id stored in a parallel array to match originals
        const originalIds = originalHandoffs.map((h) => h._id);

        // Handoffs that existed before and may have been edited (indices within original count)
        for (let i = 0; i < formHandoffs.length; i++) {
          const fh = formHandoffs[i];
          const handoffPayload = {
            department: fh.department,
            sentAt: new Date(fh.sentAt).toISOString(),
            returnedAt: fh.returnedAt ? new Date(fh.returnedAt).toISOString() : undefined,
            notes: fh.notes || undefined,
          };

          if (i < originalIds.length) {
            // Update existing handoff
            await updateHandoffMutation.mutateAsync({
              parentId,
              subId: editingSubEvent._id,
              handoffId: originalIds[i],
              data: handoffPayload,
            });
          } else {
            // New handoff added during edit
            await addHandoffMutation.mutateAsync({
              parentId,
              subId: editingSubEvent._id,
              data: handoffPayload,
            });
          }
        }

        // Remove handoffs that were deleted (original indices beyond form length)
        for (let i = formHandoffs.length; i < originalIds.length; i++) {
          await removeHandoffMutation.mutateAsync({
            parentId,
            subId: editingSubEvent._id,
            handoffId: originalIds[i],
          });
        }

        onSuccess?.('Sub-event updated');
      } else {
        // Create mode: include handoffs in payload
        const handoffs = (data.departmentHandoffs || []).map((h) => ({
          department: h.department,
          sentAt: new Date(h.sentAt).toISOString(),
          returnedAt: h.returnedAt ? new Date(h.returnedAt).toISOString() : undefined,
          notes: h.notes || undefined,
        }));
        await createMutation.mutateAsync({
          parentId,
          data: {
            category: data.category,
            reasonCode: data.reasonCode,
            actionTaken: data.actionTaken,
            detectedAt: new Date(data.detectedAt).toISOString(),
            clearedAt: data.clearedAt ? new Date(data.clearedAt).toISOString() : undefined,
            manpowerCount: data.manpowerCount,
            manHours: data.manHours,
            departmentHandoffs: handoffs.length > 0 ? handoffs : undefined,
            notes: data.notes || undefined,
          },
        });
        onSuccess?.('Sub-event created');
      }
      onClose();
    } catch {
      onError?.(isEditMode ? 'Failed to update sub-event' : 'Failed to create sub-event');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || addHandoffMutation.isPending || updateHandoffMutation.isPending || removeHandoffMutation.isPending || isSubmitting;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Sub-Event' : 'Add Sub-Event'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Core Fields ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Category" error={errors.category} required>
            <Select
              options={CATEGORY_OPTIONS}
              error={!!errors.category}
              {...register('category')}
            />
          </FormField>

          <FormField label="Reason Code" error={errors.reasonCode} required>
            <Input
              placeholder="e.g. Engine vibration"
              error={!!errors.reasonCode}
              {...register('reasonCode')}
            />
          </FormField>
        </div>

        <FormField label="Action Taken" error={errors.actionTaken} required>
          <Textarea
            placeholder="Describe the corrective action..."
            error={!!errors.actionTaken}
            {...register('actionTaken')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Detected At" error={errors.detectedAt} required>
            <Input
              type="datetime-local"
              error={!!errors.detectedAt}
              {...register('detectedAt')}
            />
          </FormField>

          <FormField label="Cleared At" error={errors.clearedAt}>
            <Input
              type="datetime-local"
              error={!!errors.clearedAt}
              {...register('clearedAt')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Manpower Count" error={errors.manpowerCount} required>
            <Input
              type="number"
              min={0}
              step={1}
              error={!!errors.manpowerCount}
              {...register('manpowerCount', { valueAsNumber: true })}
            />
          </FormField>

          <FormField label="Man Hours" error={errors.manHours} required>
            <Input
              type="number"
              min={0}
              step={0.5}
              error={!!errors.manHours}
              {...register('manHours', { valueAsNumber: true })}
            />
          </FormField>
        </div>

        <FormField label="Notes" error={errors.notes}>
          <Textarea
            placeholder="Optional notes..."
            error={!!errors.notes}
            {...register('notes')}
          />
        </FormField>

        {/* ── Department Handoffs Repeater ──────────────────────────────── */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Department Handoffs {fields.length > 0 && `(${fields.length})`}
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ department: 'QC' as const, sentAt: '', returnedAt: undefined, notes: undefined })}
            >
              <Plus className="w-3.5 h-3.5" /> Add Handoff
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No handoffs added. Click "Add Handoff" to track department interactions.
            </p>
          )}

          {fields.length > 0 && (
            <div className="space-y-3">
              {fields.map((field, index) => {
                const handoffErrors = errors.departmentHandoffs?.[index];
                return (
                  <div
                    key={field.id}
                    className="border border-border rounded-lg p-3 bg-muted/20 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Handoff #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 h-7 px-2"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Department" error={handoffErrors?.department} required>
                        <Select
                          options={DEPARTMENT_OPTIONS}
                          error={!!handoffErrors?.department}
                          {...register(`departmentHandoffs.${index}.department`)}
                        />
                      </FormField>

                      <FormField label="Sent At" error={handoffErrors?.sentAt} required>
                        <Input
                          type="datetime-local"
                          error={!!handoffErrors?.sentAt}
                          {...register(`departmentHandoffs.${index}.sentAt`)}
                        />
                      </FormField>
                    </div>

                    <FormField label="Returned At" error={handoffErrors?.returnedAt}>
                      <Input
                        type="datetime-local"
                        error={!!handoffErrors?.returnedAt}
                        {...register(`departmentHandoffs.${index}.returnedAt`)}
                      />
                    </FormField>

                    <FormField label="Reason / Notes" error={handoffErrors?.notes}>
                      <Textarea
                        placeholder="e.g. Aircraft handed over to Engineering to carry out temporary repair on hydraulic leak"
                        rows={2}
                        error={!!handoffErrors?.notes}
                        {...register(`departmentHandoffs.${index}.notes`)}
                      />
                    </FormField>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditMode ? 'Update Sub-Event' : 'Create Sub-Event'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
