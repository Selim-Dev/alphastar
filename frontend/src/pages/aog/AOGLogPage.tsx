import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FormField, Input, Select, Textarea, Button } from '@/components/ui/Form';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { useCreateAOGEvent } from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import type { AOGEvent } from '@/types';

// Validation schema for AOG event form
const aogEventSchema = z.object({
  aircraftId: z.string().min(1, 'Aircraft is required'),
  detectedAt: z.string().min(1, 'Detection date/time is required'),
  clearedAt: z.string().optional(),
  category: z.enum(['scheduled', 'unscheduled', 'aog']),
  reasonCode: z.string().min(1, 'Reason code is required'),
  responsibleParty: z.enum(['Internal', 'OEM', 'Customs', 'Finance', 'Other']),
  actionTaken: z.string().min(1, 'Action taken is required'),
  manpowerCount: z.coerce.number().min(0, 'Must be 0 or greater'),
  manHours: z.coerce.number().min(0, 'Must be 0 or greater'),
  costLabor: z.coerce.number().min(0, 'Must be 0 or greater').optional(),
  costParts: z.coerce.number().min(0, 'Must be 0 or greater').optional(),
  costExternal: z.coerce.number().min(0, 'Must be 0 or greater').optional(),
}).refine(
  (data) => {
    if (data.clearedAt && data.detectedAt) {
      return new Date(data.clearedAt) >= new Date(data.detectedAt);
    }
    return true;
  },
  {
    message: 'Cleared date/time must be after detected date/time',
    path: ['clearedAt'],
  }
);

type AOGEventFormData = z.infer<typeof aogEventSchema>;

const CATEGORY_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'unscheduled', label: 'Unscheduled' },
  { value: 'aog', label: 'AOG' },
];

const RESPONSIBLE_PARTY_OPTIONS = [
  { value: 'Internal', label: 'Internal' },
  { value: 'OEM', label: 'OEM' },
  { value: 'Customs', label: 'Customs' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Other', label: 'Other' },
];

export function AOGLogPage() {
  const navigate = useNavigate();
  const { data: aircraftData } = useAircraft();
  const createEvent = useCreateAOGEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const aircraft = aircraftData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AOGEventFormData>({
    resolver: zodResolver(aogEventSchema) as never,
    defaultValues: {
      detectedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      category: 'aog',
      responsibleParty: 'Internal',
      manpowerCount: 1,
      manHours: 0,
      costLabor: 0,
      costParts: 0,
      costExternal: 0,
    },
  });

  const onSubmit = async (data: AOGEventFormData) => {
    try {
      // Clean up the data - remove empty strings for optional fields
      const cleanedData: Record<string, unknown> = {
        aircraftId: data.aircraftId,
        detectedAt: data.detectedAt,
        category: data.category,
        reasonCode: data.reasonCode,
        responsibleParty: data.responsibleParty,
        actionTaken: data.actionTaken,
        manpowerCount: data.manpowerCount,
        manHours: data.manHours,
        attachments,
      };

      // Only include clearedAt if it has a value
      if (data.clearedAt && data.clearedAt.trim() !== '') {
        cleanedData.clearedAt = data.clearedAt;
      }

      // Only include cost fields if they have non-zero values
      if (data.costLabor && data.costLabor > 0) {
        cleanedData.costLabor = data.costLabor;
      }
      if (data.costParts && data.costParts > 0) {
        cleanedData.costParts = data.costParts;
      }
      if (data.costExternal && data.costExternal > 0) {
        cleanedData.costExternal = data.costExternal;
      }

      await createEvent.mutateAsync(cleanedData as Omit<AOGEvent, '_id' | 'createdAt'>);
      reset();
      setAttachments([]);
      // Navigate to AOG list page after successful creation
      navigate('/aog/list');
    } catch (error) {
      console.error('Failed to create AOG event:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const newAttachments = Array.from(files).map((file) => `uploads/${Date.now()}-${file.name}`);
    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploadingFiles(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const aircraftOptions = aircraft.map((a) => ({
    value: a.id || a._id,
    label: `${a.registration} - ${a.fleetGroup}`,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        Log <GlossaryTerm term="AOG" /> Event
      </motion.h1>

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

            {/* Detected At */}
            <FormField label="Detected At" error={errors.detectedAt} required>
              <Input
                type="datetime-local"
                {...register('detectedAt')}
                error={!!errors.detectedAt}
              />
            </FormField>

            {/* Cleared At */}
            <FormField label="Cleared At" error={errors.clearedAt}>
              <Input
                type="datetime-local"
                {...register('clearedAt')}
                error={!!errors.clearedAt}
              />
            </FormField>

            {/* Category */}
            <FormField label="Category" error={errors.category} required>
              <Select
                {...register('category')}
                options={CATEGORY_OPTIONS}
                error={!!errors.category}
              />
            </FormField>

            {/* Responsible Party */}
            <FormField label="Responsible Party" error={errors.responsibleParty} required>
              <Select
                {...register('responsibleParty')}
                options={RESPONSIBLE_PARTY_OPTIONS}
                error={!!errors.responsibleParty}
              />
            </FormField>

            {/* Reason Code */}
            <FormField label="Reason Code" error={errors.reasonCode} required>
              <Input
                {...register('reasonCode')}
                placeholder="e.g., ENG-001"
                error={!!errors.reasonCode}
              />
            </FormField>

            {/* Manpower Count */}
            <FormField label="Manpower Count" error={errors.manpowerCount} required>
              <Input
                type="number"
                min="0"
                {...register('manpowerCount')}
                error={!!errors.manpowerCount}
              />
            </FormField>

            {/* Man Hours */}
            <FormField label="Man Hours" error={errors.manHours} required>
              <Input
                type="number"
                min="0"
                step="0.5"
                {...register('manHours')}
                error={!!errors.manHours}
              />
            </FormField>

            {/* Cost Labor */}
            <FormField label="Labor Cost (USD)" error={errors.costLabor}>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('costLabor')}
                error={!!errors.costLabor}
              />
            </FormField>

            {/* Cost Parts */}
            <FormField label="Parts Cost (USD)" error={errors.costParts}>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('costParts')}
                error={!!errors.costParts}
              />
            </FormField>

            {/* Cost External */}
            <FormField label="External Cost (USD)" error={errors.costExternal}>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('costExternal')}
                error={!!errors.costExternal}
              />
            </FormField>
          </div>

          {/* Action Taken */}
          <FormField label="Action Taken" error={errors.actionTaken} required>
            <Textarea
              {...register('actionTaken')}
              placeholder="Describe the action taken to resolve the AOG..."
              error={!!errors.actionTaken}
            />
          </FormField>

          {/* File Attachments */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Attachments
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles}
              >
                {uploadingFiles ? 'Uploading...' : 'Add Files'}
              </Button>
              <span className="text-sm text-muted-foreground">
                PDF, DOC, XLS, JPG, PNG
              </span>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm"
                  >
                    <span className="truncate max-w-[200px]">
                      {attachment.split('/').pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => {
              reset();
              setAttachments([]);
            }}>
              Clear
            </Button>
            <Button type="submit" isLoading={createEvent.isPending}>
              Log Event
            </Button>
          </div>

          {/* Success/Error Messages */}
          {createEvent.isSuccess && (
            <p className="text-sm text-green-600">AOG event logged successfully!</p>
          )}
          {createEvent.isError && (
            <p className="text-sm text-destructive">
              Failed to log event. Please check your inputs and try again.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
