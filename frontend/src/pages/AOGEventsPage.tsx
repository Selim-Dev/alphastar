import { useState, useMemo, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { FormField, Input, Select, Textarea, Button } from '@/components/ui/Form';
import { BarChartWrapper, PieChartWrapper } from '@/components/ui/Charts';
import { ExportButton } from '@/components/ui/ExportButton';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import {
  useAOGEvents,
  useAOGEventById,
  useAOGAnalytics,
  useCreateAOGEvent,
} from '@/hooks/useAOGEvents';
import { useAircraft } from '@/hooks/useAircraft';
import { usePermissions } from '@/hooks/usePermissions';
import type { AOGEvent, Aircraft } from '@/types';

type DatePreset = 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
type ViewMode = 'form' | 'analytics' | 'list';

interface DateRange {
  startDate: string;
  endDate: string;
}

function getDateRangeFromPreset(preset: DatePreset): DateRange {
  const today = new Date();
  switch (preset) {
    case 'last7days':
      return {
        startDate: format(subDays(today, 7), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'last30days':
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
    case 'thisMonth':
      return {
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    case 'lastMonth':
      const lastMonth = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    default:
      return {
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      };
  }
}


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

const RESPONSIBILITY_COLORS: Record<string, string> = {
  Internal: '#3b82f6',
  OEM: '#ef4444',
  Customs: '#f59e0b',
  Finance: '#10b981',
  Other: '#8b5cf6',
};

// AOG Event Entry Form Component
function AOGEventForm({
  aircraft,
  onSuccess,
}: {
  aircraft: Aircraft[];
  onSuccess: () => void;
}) {
  const createEvent = useCreateAOGEvent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
      await createEvent.mutateAsync({
        ...data,
        attachments,
      } as Omit<AOGEvent, '_id' | 'createdAt'>);
      reset();
      setAttachments([]);
      onSuccess();
    } catch (error) {
      console.error('Failed to create AOG event:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    // In a real implementation, this would upload to S3 and get back the keys
    // For now, we'll simulate by using file names as placeholders
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
    value: a._id,
    label: `${a.registration} - ${a.fleetGroup}`,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">Log AOG Event</h2>
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
        <div className="flex justify-end gap-2">
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
  );
}


// Summary Statistics Cards
function SummaryCards({
  totalEvents,
  activeEvents,
  totalDowntimeHours,
  totalCost,
}: {
  totalEvents: number;
  activeEvents: number;
  totalDowntimeHours: number;
  totalCost: number;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Events</p>
        <p className="text-2xl font-bold text-foreground">{totalEvents.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Active <GlossaryTerm term="AOG" /></p>
        <p className="text-2xl font-bold text-destructive">{activeEvents.toLocaleString()}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Downtime</p>
        <p className="text-2xl font-bold text-foreground">{totalDowntimeHours.toFixed(1)} hrs</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <p className="text-sm text-muted-foreground">Total Cost</p>
        <p className="text-2xl font-bold text-foreground">
          {totalCost.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
        </p>
      </motion.div>
    </div>
  );
}

// Downtime by Responsibility Chart
function DowntimeByResponsibilityChart({
  data,
}: {
  data: { responsibleParty: string; totalDowntimeHours: number; eventCount: number }[];
}) {
  const chartData = data.map((item) => ({
    name: item.responsibleParty,
    hours: Math.round(item.totalDowntimeHours * 10) / 10,
    events: item.eventCount,
  }));

  const pieData = data.map((item) => ({
    name: item.responsibleParty,
    value: Math.round(item.totalDowntimeHours * 10) / 10,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Downtime Hours by Responsibility
        </h3>
        {chartData.length > 0 ? (
          <div className="h-[300px]">
            <BarChartWrapper
              data={chartData}
              xAxisKey="name"
              bars={[
                { dataKey: 'hours', name: 'Downtime (hrs)', color: '#ef4444' },
                { dataKey: 'events', name: 'Events', color: '#3b82f6' },
              ]}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No data available</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Downtime Distribution
        </h3>
        {pieData.length > 0 && pieData.some((d) => d.value > 0) ? (
          <div className="h-[300px]">
            <PieChartWrapper data={pieData} innerRadius={50} outerRadius={90} />
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No data available</p>
        )}
      </motion.div>
    </div>
  );
}

// Event Timeline Component
function EventTimeline({
  events,
  aircraftMap,
}: {
  events: (AOGEvent & { downtimeHours?: number })[];
  aircraftMap: Map<string, Aircraft>;
}) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Event Timeline</h3>
      {sortedEvents.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {sortedEvents.slice(0, 20).map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-4 pb-4 border-b border-border last:border-0"
            >
              <div className="flex-shrink-0">
                <div
                  className="w-3 h-3 rounded-full mt-1.5"
                  style={{
                    backgroundColor: RESPONSIBILITY_COLORS[event.responsibleParty] || '#6b7280',
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {aircraftMap.get(String(event.aircraftId))?.registration || 'Unknown'}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      event.category === 'aog'
                        ? 'bg-destructive/10 text-destructive'
                        : event.category === 'unscheduled'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-blue-500/10 text-blue-600'
                    }`}
                  >
                    {event.category.toUpperCase()}
                  </span>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: `${RESPONSIBILITY_COLORS[event.responsibleParty]}20`,
                      color: RESPONSIBILITY_COLORS[event.responsibleParty],
                    }}
                  >
                    {event.responsibleParty}
                  </span>
                  {!event.clearedAt && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.reasonCode} - {event.actionTaken.substring(0, 100)}
                  {event.actionTaken.length > 100 ? '...' : ''}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    Detected: {format(new Date(event.detectedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                  {event.clearedAt && (
                    <span>
                      Cleared: {format(new Date(event.clearedAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  )}
                  {event.downtimeHours !== undefined && (
                    <span className="font-medium text-foreground">
                      {event.downtimeHours.toFixed(1)} hrs downtime
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">No events in selected period</p>
      )}
    </motion.div>
  );
}


// Event Detail Modal Component
function EventDetailModal({
  event,
  aircraft,
  onClose,
}: {
  event: AOGEvent & { downtimeHours?: number };
  aircraft?: Aircraft;
  onClose: () => void;
}) {
  const RESPONSIBILITY_COLORS: Record<string, string> = {
    Internal: '#3b82f6',
    OEM: '#ef4444',
    Customs: '#f59e0b',
    Finance: '#10b981',
    Other: '#8b5cf6',
  };

  const totalCost = (event.costLabor || 0) + (event.costParts || 0) + (event.costExternal || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="border border-border rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{ opacity: 1, backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">AOG Event Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">
                {aircraft?.registration || 'Unknown Aircraft'}
              </span>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  event.category === 'aog'
                    ? 'bg-destructive/10 text-destructive'
                    : event.category === 'unscheduled'
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : 'bg-blue-500/10 text-blue-600'
                }`}
              >
                {event.category.toUpperCase()}
              </span>
            </div>
            {!event.clearedAt ? (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-destructive text-destructive-foreground">
                ACTIVE
              </span>
            ) : (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-500/10 text-green-600">
                CLEARED
              </span>
            )}
          </div>

          {/* Responsibility badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Responsible Party:</span>
            <span
              className="px-3 py-1 text-sm font-medium rounded-full"
              style={{
                backgroundColor: `${RESPONSIBILITY_COLORS[event.responsibleParty]}20`,
                color: RESPONSIBILITY_COLORS[event.responsibleParty],
              }}
            >
              {event.responsibleParty}
            </span>
          </div>

          {/* Reason and Action */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Reason Code</label>
              <p className="text-foreground">{event.reasonCode}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Action Taken</label>
              <p className="text-foreground">{event.actionTaken}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <label className="text-xs font-medium text-muted-foreground">Detected At</label>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(event.detectedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <label className="text-xs font-medium text-muted-foreground">Cleared At</label>
              <p className="text-sm font-medium text-foreground">
                {event.clearedAt
                  ? format(new Date(event.clearedAt), 'MMM dd, yyyy HH:mm')
                  : 'Not yet cleared'}
              </p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <label className="text-xs font-medium text-muted-foreground">Downtime</label>
              <p className="text-lg font-bold text-foreground">
                {event.downtimeHours?.toFixed(1) || '-'} hrs
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <label className="text-xs font-medium text-muted-foreground">Man-Hours</label>
              <p className="text-lg font-bold text-foreground">{event.manHours}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <label className="text-xs font-medium text-muted-foreground">Manpower</label>
              <p className="text-lg font-bold text-foreground">{event.manpowerCount}</p>
            </div>
          </div>

          {/* Costs */}
          {totalCost > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Cost Breakdown</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <label className="text-xs text-muted-foreground">Labor</label>
                  <p className="text-sm font-medium text-foreground">
                    ${(event.costLabor || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <label className="text-xs text-muted-foreground">Parts</label>
                  <p className="text-sm font-medium text-foreground">
                    ${(event.costParts || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <label className="text-xs text-muted-foreground">External</label>
                  <p className="text-sm font-medium text-foreground">
                    ${(event.costExternal || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-center bg-primary/10 rounded-lg py-1">
                  <label className="text-xs text-primary">Total</label>
                  <p className="text-sm font-bold text-primary">
                    ${totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aircraft Info */}
          {aircraft && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Aircraft Information</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Fleet Group</label>
                  <p className="font-medium text-foreground">{aircraft.fleetGroup}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <p className="font-medium text-foreground">{aircraft.aircraftType}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Owner</label>
                  <p className="font-medium text-foreground">{aircraft.owner}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}


// Main AOG Events Page Component
export function AOGEventsPage() {
  const { canWrite } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get URL parameters for deep linking from alerts
  const urlView = searchParams.get('view') as ViewMode | null;
  const urlEventId = searchParams.get('eventId');
  
  const [viewMode, setViewMode] = useState<ViewMode>(
    urlView === 'list' ? 'list' : urlView === 'analytics' ? 'analytics' : canWrite ? 'form' : 'analytics'
  );
  const [selectedEventId, setSelectedEventId] = useState<string | null>(urlEventId);
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [aircraftFilter, setAircraftFilter] = useState<string>('');
  const [responsiblePartyFilter, setResponsiblePartyFilter] = useState<string>('');

  // Handle URL parameter changes - set view mode and event ID from URL
  useEffect(() => {
    if (urlView === 'list') {
      setViewMode('list');
    }
    if (urlEventId) {
      setSelectedEventId(urlEventId);
      setViewMode('list'); // Ensure we're on list view to see the modal
    }
    // Clear URL params after reading (but keep selectedEventId in state)
    if (urlView || urlEventId) {
      setSearchParams({}, { replace: true });
    }
  }, [urlView, urlEventId, setSearchParams]);

  const dateRange = useMemo(() => {
    if (datePreset === 'custom') {
      return customRange;
    }
    return getDateRangeFromPreset(datePreset);
  }, [datePreset, customRange]);

  // Data fetching
  const { data: aircraftData } = useAircraft();
  const { data: eventsData, isLoading: eventsLoading } = useAOGEvents({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
    responsibleParty: responsiblePartyFilter || undefined,
  });
  const { data: analyticsData } = useAOGAnalytics({
    ...dateRange,
    aircraftId: aircraftFilter || undefined,
  });
  
  // Fetch single event by ID for deep linking (when event not in current list)
  const { data: singleEventData } = useAOGEventById(selectedEventId);

  const aircraft = aircraftData?.data || [];
  const events = (eventsData || []) as (AOGEvent & { downtimeHours?: number })[];

  // Create aircraft map for lookups (handle both _id and id fields)
  const aircraftMap = useMemo(() => {
    const map = new Map<string, Aircraft>();
    aircraft.forEach((a) => {
      // Backend may return 'id' or '_id' depending on serialization
      const aircraftId = a._id || a.id;
      if (aircraftId) {
        map.set(aircraftId, a);
      }
    });
    return map;
  }, [aircraft]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter((e) => !e.clearedAt).length;
    const totalDowntimeHours = events.reduce(
      (sum, e) => sum + ((e as { downtimeHours?: number }).downtimeHours || 0),
      0
    );
    const totalCost = events.reduce(
      (sum, e) => sum + (e.costLabor || 0) + (e.costParts || 0) + (e.costExternal || 0),
      0
    );
    return { totalEvents, activeEvents, totalDowntimeHours, totalCost };
  }, [events]);

  // Transform analytics data for charts
  const downtimeByResponsibility = useMemo(() => {
    if (!analyticsData) return [];
    // Backend returns { responsibleParty, totalDowntimeHours, eventCount } after $project
    return (analyticsData as { responsibleParty: string; totalDowntimeHours: number; eventCount: number }[]).map(
      (item) => ({
        responsibleParty: item.responsibleParty || 'Unknown',
        totalDowntimeHours: item.totalDowntimeHours || 0,
        eventCount: item.eventCount || 0,
      })
    );
  }, [analyticsData]);

  // Table columns for event list
  const columns: ColumnDef<AOGEvent & { downtimeHours?: number }, unknown>[] = useMemo(
    () => [
      {
        accessorKey: 'detectedAt',
        header: 'Detected',
        cell: ({ row }) => format(new Date(row.original.detectedAt), 'MMM dd, yyyy HH:mm'),
      },
      {
        accessorKey: 'aircraftId',
        header: 'Aircraft',
        cell: ({ row }) =>
          aircraftMap.get(String(row.original.aircraftId))?.registration || 'Unknown',
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span
            className={`px-2 py-0.5 text-xs rounded-full ${
              row.original.category === 'aog'
                ? 'bg-destructive/10 text-destructive'
                : row.original.category === 'unscheduled'
                ? 'bg-yellow-500/10 text-yellow-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            {row.original.category.toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: 'responsibleParty',
        header: 'Responsibility',
        cell: ({ row }) => (
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{
              backgroundColor: `${RESPONSIBILITY_COLORS[row.original.responsibleParty]}20`,
              color: RESPONSIBILITY_COLORS[row.original.responsibleParty],
            }}
          >
            {row.original.responsibleParty}
          </span>
        ),
      },
      {
        accessorKey: 'reasonCode',
        header: 'Reason',
      },
      {
        accessorKey: 'downtimeHours',
        header: 'Downtime',
        cell: ({ row }) =>
          row.original.downtimeHours !== undefined
            ? `${row.original.downtimeHours.toFixed(1)} hrs`
            : '-',
      },
      {
        accessorKey: 'manHours',
        header: 'Man-Hours',
        cell: ({ row }) => row.original.manHours.toFixed(1),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.clearedAt ? (
            <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600">
              Cleared
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
              Active
            </span>
          ),
      },
    ],
    [aircraftMap]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          <GlossaryTerm term="AOG" /> & Events
        </motion.h1>

        <div className="flex items-center gap-3">
          {/* Export Button */}
          <ExportButton
            exportType="aog-events"
            filters={{ ...dateRange, aircraftId: aircraftFilter || undefined, responsibleParty: responsiblePartyFilter || undefined }}
            filename={`aog-events-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`}
            label="Export"
          />

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['form', 'analytics', 'list'] as ViewMode[]).filter(mode => mode !== 'form' || canWrite).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                }`}
              >
                {mode === 'form' && 'Log Event'}
                {mode === 'analytics' && 'Analytics'}
                {mode === 'list' && 'Event List'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Section (for analytics and list views) */}
      {viewMode !== 'form' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-lg p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Preset Buttons */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Date Range</label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(['last7days', 'last30days', 'thisMonth', 'lastMonth'] as DatePreset[]).map(
                  (preset) => (
                    <button
                      key={preset}
                      onClick={() => setDatePreset(preset)}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        datePreset === preset
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {preset === 'last7days' && '7 Days'}
                      {preset === 'last30days' && '30 Days'}
                      {preset === 'thisMonth' && 'This Month'}
                      {preset === 'lastMonth' && 'Last Month'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Custom Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={datePreset === 'custom' ? customRange.startDate : dateRange.startDate}
                  onChange={(e) => {
                    setDatePreset('custom');
                    setCustomRange((prev) => ({ ...prev, startDate: e.target.value }));
                  }}
                  className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={datePreset === 'custom' ? customRange.endDate : dateRange.endDate}
                  onChange={(e) => {
                    setDatePreset('custom');
                    setCustomRange((prev) => ({ ...prev, endDate: e.target.value }));
                  }}
                  className="px-2 py-1.5 text-sm border border-border rounded-md bg-background text-foreground"
                />
              </div>
            </div>

            {/* Aircraft Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Aircraft</label>
              <AircraftSelect
                value={aircraftFilter}
                onChange={setAircraftFilter}
                includeAll
                allLabel="All Aircraft"
              />
            </div>

            {/* Responsible Party Filter */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Responsibility</label>
              <select
                value={responsiblePartyFilter}
                onChange={(e) => setResponsiblePartyFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground min-w-[140px]"
              >
                <option value="">All</option>
                {RESPONSIBLE_PARTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      {/* Event Entry Form View */}
      {viewMode === 'form' && (
        <AOGEventForm aircraft={aircraft} onSuccess={() => {}} />
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <SummaryCards {...summaryStats} />

          {/* Downtime by Responsibility Charts */}
          <DowntimeByResponsibilityChart data={downtimeByResponsibility} />

          {/* Event Timeline */}
          <EventTimeline events={events} aircraftMap={aircraftMap} />
        </div>
      )}

      {/* Event List View */}
      {viewMode === 'list' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {eventsLoading ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
              Loading AOG events...
            </div>
          ) : (
            <DataTable
              data={events}
              columns={columns}
              searchPlaceholder="Search events..."
              searchColumn="reasonCode"
              pageSize={15}
              onRowClick={(row) => setSelectedEventId(row._id)}
            />
          )}
        </motion.div>
      )}

      {/* Event Detail Modal */}
      {selectedEventId && (() => {
        // Try to find event in current list first, fallback to single event fetch
        const selectedEvent = events.find((e) => e._id === selectedEventId) || 
          (singleEventData as (AOGEvent & { downtimeHours?: number }) | null);
        if (!selectedEvent) return null;
        const eventAircraft = aircraftMap.get(String(selectedEvent.aircraftId));
        return (
          <EventDetailModal
            event={selectedEvent}
            aircraft={eventAircraft}
            onClose={() => setSelectedEventId(null)}
          />
        );
      })()}
    </div>
  );
}
