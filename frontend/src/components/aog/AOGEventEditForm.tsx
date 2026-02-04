import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Form';
import { useUpdateAOGEvent } from '@/hooks/useAOGEvents';
import type { AOGEvent } from '@/types';

const editSchema = z.object({
  category: z.enum(['aog', 'scheduled', 'unscheduled', 'mro', 'cleaning']),
  location: z.string().optional(),
  reasonCode: z.string().min(1, 'Defect description is required'),
  actionTaken: z.string().optional(),
  responsibleParty: z.enum(['Internal', 'OEM', 'Customs', 'Finance', 'Other']).optional(),
  clearedAt: z.string().optional(),
  // Milestone fields
  reportedAt: z.string().optional(),
  procurementRequestedAt: z.string().optional(),
  availableAtStoreAt: z.string().optional(),
  issuedBackAt: z.string().optional(),
  installationCompleteAt: z.string().optional(),
  testStartAt: z.string().optional(),
  upAndRunningAt: z.string().optional(),
}).refine((data) => {
  // Validate clearedAt >= detectedAt if provided
  if (data.clearedAt) {
    return true; // Will be validated on backend
  }
  return true;
}, {
  message: 'Cleared date must be after detected date',
  path: ['clearedAt'],
});

type EditFormData = z.infer<typeof editSchema>;

interface AOGEventEditFormProps {
  event: AOGEvent;
  onUpdate: () => void;
  onCancel: () => void;
}

/**
 * Edit form for AOG event basic fields
 * Requirements: 3.5, 3.7
 */
export function AOGEventEditForm({ event, onUpdate, onCancel }: AOGEventEditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const updateMutation = useUpdateAOGEvent();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      category: event.category,
      location: event.location || '',
      reasonCode: event.reasonCode,
      actionTaken: event.actionTaken || '',
      responsibleParty: event.responsibleParty,
      clearedAt: event.clearedAt ? format(new Date(event.clearedAt), "yyyy-MM-dd'T'HH:mm") : '',
      // Milestone defaults
      reportedAt: event.reportedAt ? format(new Date(event.reportedAt), "yyyy-MM-dd'T'HH:mm") : '',
      procurementRequestedAt: event.procurementRequestedAt ? format(new Date(event.procurementRequestedAt), "yyyy-MM-dd'T'HH:mm") : '',
      availableAtStoreAt: event.availableAtStoreAt ? format(new Date(event.availableAtStoreAt), "yyyy-MM-dd'T'HH:mm") : '',
      issuedBackAt: event.issuedBackAt ? format(new Date(event.issuedBackAt), "yyyy-MM-dd'T'HH:mm") : '',
      installationCompleteAt: event.installationCompleteAt ? format(new Date(event.installationCompleteAt), "yyyy-MM-dd'T'HH:mm") : '',
      testStartAt: event.testStartAt ? format(new Date(event.testStartAt), "yyyy-MM-dd'T'HH:mm") : '',
      upAndRunningAt: event.upAndRunningAt ? format(new Date(event.upAndRunningAt), "yyyy-MM-dd'T'HH:mm") : '',
    },
  });

  const onSubmit = async (data: EditFormData) => {
    try {
      setError(null);
      
      // Prepare update payload
      const payload: Partial<AOGEvent> & { id: string } = {
        id: event._id,
        category: data.category,
        location: data.location || undefined,
        reasonCode: data.reasonCode,
        actionTaken: data.actionTaken || undefined,
        responsibleParty: data.responsibleParty || undefined,
      };

      // Add clearedAt if provided
      if (data.clearedAt) {
        payload.clearedAt = new Date(data.clearedAt) as any;
      }

      // Add milestone timestamps if provided
      if (data.reportedAt) {
        payload.reportedAt = new Date(data.reportedAt) as any;
      }
      if (data.procurementRequestedAt) {
        payload.procurementRequestedAt = new Date(data.procurementRequestedAt) as any;
      }
      if (data.availableAtStoreAt) {
        payload.availableAtStoreAt = new Date(data.availableAtStoreAt) as any;
      }
      if (data.issuedBackAt) {
        payload.issuedBackAt = new Date(data.issuedBackAt) as any;
      }
      if (data.installationCompleteAt) {
        payload.installationCompleteAt = new Date(data.installationCompleteAt) as any;
      }
      if (data.testStartAt) {
        payload.testStartAt = new Date(data.testStartAt) as any;
      }
      if (data.upAndRunningAt) {
        payload.upAndRunningAt = new Date(data.upAndRunningAt) as any;
      }

      await updateMutation.mutateAsync(payload);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Category <span className="text-destructive">*</span>
        </label>
        <select
          {...register('category')}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="aog">AOG</option>
          <option value="scheduled">S-MX (Scheduled)</option>
          <option value="unscheduled">U-MX (Unscheduled)</option>
          <option value="mro">MRO</option>
          <option value="cleaning">Cleaning</option>
        </select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Location (ICAO Code)
        </label>
        <input
          type="text"
          {...register('location')}
          placeholder="e.g., OERK, LFSB"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Optional ICAO airport code
        </p>
        {errors.location && (
          <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
        )}
      </div>

      {/* Defect Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Defect Description <span className="text-destructive">*</span>
        </label>
        <textarea
          {...register('reasonCode')}
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Describe the issue..."
        />
        {errors.reasonCode && (
          <p className="text-sm text-red-500 mt-1">{errors.reasonCode.message}</p>
        )}
      </div>

      {/* Action Taken */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Action Taken
        </label>
        <textarea
          {...register('actionTaken')}
          rows={3}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Describe what action was taken to resolve this issue..."
        />
        <p className="text-xs text-muted-foreground mt-1">
          Document the corrective action taken (e.g., "Replaced hydraulic pump", "Completed scheduled inspection")
        </p>
        {errors.actionTaken && (
          <p className="text-sm text-red-500 mt-1">{errors.actionTaken.message}</p>
        )}
      </div>

      {/* Responsible Party */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Responsible Party
        </label>
        <select
          {...register('responsibleParty')}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="Internal">Internal</option>
          <option value="OEM">OEM</option>
          <option value="Customs">Customs</option>
          <option value="Finance">Finance</option>
          <option value="Other">Other</option>
        </select>
        {errors.responsibleParty && (
          <p className="text-sm text-red-500 mt-1">{errors.responsibleParty.message}</p>
        )}
      </div>

      {/* Cleared At (Mark as Resolved) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Cleared Date & Time
        </label>
        <input
          type="datetime-local"
          {...register('clearedAt')}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Set this to mark the event as resolved. Must be after detected date ({format(new Date(event.detectedAt), 'MMM dd, yyyy HH:mm')})
        </p>
        {errors.clearedAt && (
          <p className="text-sm text-red-500 mt-1">{errors.clearedAt.message}</p>
        )}
      </div>

      {/* Milestone Timestamps Section */}
      <div className="pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-4">Milestone Timestamps (Optional)</h4>
        <p className="text-xs text-muted-foreground mb-4">
          Set milestone timestamps for detailed downtime tracking. These are optional but provide better analytics.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Reported At */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reported At
            </label>
            <input
              type="datetime-local"
              {...register('reportedAt')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">When AOG was first reported</p>
          </div>

          {/* Procurement Requested At */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Procurement Requested At
            </label>
            <input
              type="datetime-local"
              {...register('procurementRequestedAt')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">When parts were requested (optional)</p>
          </div>

          {/* Available At Store At */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Available At Store At
            </label>
            <input
              type="datetime-local"
              {...register('availableAtStoreAt')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">When parts arrived (optional)</p>
          </div>

          {/* Issued Back At */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Issued Back At
            </label>
            <input
              type="datetime-local"
              {...register('issuedBackAt')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">When parts issued to maintenance (optional)</p>
          </div>

          {/* Installation Complete At */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Installation Complete At
            </label>
            <input
              type="datetime-local"
              {...register('installationCompleteAt')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">When repair work finished</p>
          </div>

          {/* Test Start At */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Test Start At
            </label>
            <input
              type="datetime-local"
              {...register('testStartAt')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">When ops testing started (optional)</p>
          </div>

          {/* Up And Running At */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Up & Running At
            </label>
            <input
              type="datetime-local"
              {...register('upAndRunningAt')}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">When aircraft returned to service (should match Cleared Date)</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}
