import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FormField, Input, Select, Textarea, Button } from '@/components/ui/Form';
import {
  useDiscrepancies,
  useCreateDiscrepancy,
  useUpdateDiscrepancy,
} from '@/hooks/useDiscrepancies';
import { useAircraft } from '@/hooks/useAircraft';
import type { Discrepancy } from '@/types';

// Set document title for this page
const PAGE_TITLE_NEW = 'New Discrepancy | Alpha Star Aviation';
const PAGE_TITLE_EDIT = 'Edit Discrepancy | Alpha Star Aviation';

// Validation schema for discrepancy form
const discrepancySchema = z.object({
  aircraftId: z.string().min(1, 'Aircraft is required'),
  dateDetected: z.string().min(1, 'Detection date is required'),
  ataChapter: z.string().min(1, 'ATA chapter is required'),
  discrepancyText: z.string().min(1, 'Discrepancy description is required'),
  dateCorrected: z.string().optional(),
  correctiveAction: z.string().optional(),
  responsibility: z.enum(['Internal', 'OEM', 'Customs', 'Finance', 'Other']).optional(),
  downtimeHours: z.coerce.number().min(0, 'Must be 0 or greater').optional(),
});

type DiscrepancyFormData = z.infer<typeof discrepancySchema>;

const RESPONSIBILITY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'Internal', label: 'Internal' },
  { value: 'OEM', label: 'OEM' },
  { value: 'Customs', label: 'Customs' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Other', label: 'Other' },
];

// Common ATA chapters for aviation maintenance
const COMMON_ATA_CHAPTERS = [
  { value: '', label: 'Select ATA Chapter...' },
  { value: '21', label: '21 - Air Conditioning' },
  { value: '22', label: '22 - Auto Flight' },
  { value: '23', label: '23 - Communications' },
  { value: '24', label: '24 - Electrical Power' },
  { value: '25', label: '25 - Equipment/Furnishings' },
  { value: '26', label: '26 - Fire Protection' },
  { value: '27', label: '27 - Flight Controls' },
  { value: '28', label: '28 - Fuel' },
  { value: '29', label: '29 - Hydraulic Power' },
  { value: '30', label: '30 - Ice and Rain Protection' },
  { value: '31', label: '31 - Instruments' },
  { value: '32', label: '32 - Landing Gear' },
  { value: '33', label: '33 - Lights' },
  { value: '34', label: '34 - Navigation' },
  { value: '35', label: '35 - Oxygen' },
  { value: '36', label: '36 - Pneumatic' },
  { value: '38', label: '38 - Water/Waste' },
  { value: '49', label: '49 - Airborne Auxiliary Power' },
  { value: '52', label: '52 - Doors' },
  { value: '53', label: '53 - Fuselage' },
  { value: '55', label: '55 - Stabilizers' },
  { value: '56', label: '56 - Windows' },
  { value: '57', label: '57 - Wings' },
  { value: '71', label: '71 - Power Plant' },
  { value: '72', label: '72 - Engine' },
  { value: '73', label: '73 - Engine Fuel and Control' },
  { value: '74', label: '74 - Ignition' },
  { value: '75', label: '75 - Air' },
  { value: '76', label: '76 - Engine Controls' },
  { value: '77', label: '77 - Engine Indicating' },
  { value: '78', label: '78 - Exhaust' },
  { value: '79', label: '79 - Oil' },
  { value: '80', label: '80 - Starting' },
];

export function DiscrepanciesNewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Set document title based on mode
  useEffect(() => {
    document.title = isEditMode ? PAGE_TITLE_EDIT : PAGE_TITLE_NEW;
  }, [isEditMode]);

  // Fetch discrepancy data if in edit mode
  const { data: discrepanciesData, isLoading: discrepancyLoading } = useDiscrepancies({});
  const { data: aircraftData } = useAircraft();
  const createDiscrepancy = useCreateDiscrepancy();
  const updateDiscrepancy = useUpdateDiscrepancy();

  const aircraft = aircraftData?.data || [];
  
  // Find the discrepancy being edited
  const editingDiscrepancy = isEditMode && discrepanciesData
    ? discrepanciesData.find((d) => d._id === id)
    : null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscrepancyFormData>({
    resolver: zodResolver(discrepancySchema) as never,
    defaultValues: {
      dateDetected: format(new Date(), 'yyyy-MM-dd'),
      downtimeHours: 0,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && editingDiscrepancy) {
      reset({
        aircraftId: editingDiscrepancy.aircraftId,
        dateDetected: editingDiscrepancy.dateDetected
          ? format(new Date(editingDiscrepancy.dateDetected), 'yyyy-MM-dd')
          : '',
        ataChapter: editingDiscrepancy.ataChapter,
        discrepancyText: editingDiscrepancy.discrepancyText,
        dateCorrected: editingDiscrepancy.dateCorrected
          ? format(new Date(editingDiscrepancy.dateCorrected), 'yyyy-MM-dd')
          : '',
        correctiveAction: editingDiscrepancy.correctiveAction || '',
        responsibility: editingDiscrepancy.responsibility,
        downtimeHours: editingDiscrepancy.downtimeHours || 0,
      });
    }
  }, [isEditMode, editingDiscrepancy, reset]);

  const onSubmit = async (data: DiscrepancyFormData) => {
    try {
      const payload = {
        ...data,
        responsibility: data.responsibility || undefined,
      };
      
      if (isEditMode && id) {
        await updateDiscrepancy.mutateAsync({
          id,
          ...payload,
        });
      } else {
        await createDiscrepancy.mutateAsync(payload as Omit<Discrepancy, '_id' | 'createdAt'>);
      }
      // Navigate back to list on success
      navigate('/discrepancies');
    } catch (error) {
      console.error('Failed to save discrepancy:', error);
    }
  };

  const aircraftOptions = aircraft.map((a) => ({
    value: a._id,
    label: `${a.registration} - ${a.fleetGroup}`,
  }));

  const isLoading = createDiscrepancy.isPending || updateDiscrepancy.isPending;

  if (isEditMode && discrepancyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading discrepancy...</p>
      </div>
    );
  }

  if (isEditMode && !editingDiscrepancy && !discrepancyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Discrepancy not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          {isEditMode ? 'Edit Discrepancy' : 'New Discrepancy'}
        </motion.h1>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Aircraft Selection */}
            <FormField label="Aircraft" error={errors.aircraftId} required>
              <Select
                {...register('aircraftId')}
                options={aircraftOptions}
                error={!!errors.aircraftId}
              />
            </FormField>

            {/* Date Detected */}
            <FormField label="Date Detected" error={errors.dateDetected} required>
              <Input type="date" {...register('dateDetected')} error={!!errors.dateDetected} />
            </FormField>

            {/* ATA Chapter */}
            <FormField label="ATA Chapter" error={errors.ataChapter} required>
              <Select
                {...register('ataChapter')}
                options={COMMON_ATA_CHAPTERS}
                error={!!errors.ataChapter}
              />
            </FormField>

            {/* Date Corrected */}
            <FormField label="Date Corrected" error={errors.dateCorrected}>
              <Input type="date" {...register('dateCorrected')} error={!!errors.dateCorrected} />
            </FormField>

            {/* Responsibility */}
            <FormField label="Responsibility" error={errors.responsibility}>
              <Select
                {...register('responsibility')}
                options={RESPONSIBILITY_OPTIONS}
                error={!!errors.responsibility}
              />
            </FormField>

            {/* Downtime Hours */}
            <FormField label="Downtime Hours" error={errors.downtimeHours}>
              <Input
                type="number"
                min="0"
                step="0.5"
                {...register('downtimeHours')}
                error={!!errors.downtimeHours}
              />
            </FormField>
          </div>

          {/* Discrepancy Text */}
          <FormField label="Discrepancy Description" error={errors.discrepancyText} required>
            <Textarea
              {...register('discrepancyText')}
              placeholder="Describe the discrepancy..."
              error={!!errors.discrepancyText}
            />
          </FormField>

          {/* Corrective Action */}
          <FormField label="Corrective Action" error={errors.correctiveAction}>
            <Textarea
              {...register('correctiveAction')}
              placeholder="Describe the corrective action taken..."
              error={!!errors.correctiveAction}
            />
          </FormField>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/discrepancies')}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
            >
              Clear
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEditMode ? 'Update' : 'Log'} Discrepancy
            </Button>
          </div>

          {/* Success/Error Messages */}
          {(createDiscrepancy.isSuccess || updateDiscrepancy.isSuccess) && (
            <p className="text-sm text-green-600">Discrepancy saved successfully!</p>
          )}
          {(createDiscrepancy.isError || updateDiscrepancy.isError) && (
            <p className="text-sm text-destructive">
              Failed to save discrepancy. Please check your inputs and try again.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
