import { useState, useEffect, useMemo, ReactNode } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Wrench,
  Package,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { Input, Textarea, Button } from '@/components/ui/Form';
import { AircraftSelect } from '@/components/ui/AircraftSelect';
import { GlossaryTerm } from '@/components/ui/GlossaryTooltip';
import { 
  calculateFmcHours, 
  calculateAvailability, 
  calculateTotalDowntime 
} from '@/lib/availability';
import type { DailyStatus } from '@/types';

// ============================================
// Custom FormField that accepts ReactNode labels
// ============================================

interface FormFieldProps {
  label: ReactNode;
  error?: { message?: string };
  children: ReactNode;
  required?: boolean;
}

function FormFieldWithNode({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

// ============================================
// Validation Schema
// ============================================

const dailyStatusSchema = z.object({
  aircraftId: z.string().min(1, 'Aircraft is required'),
  date: z.string().min(1, 'Date is required'),
  posHours: z.coerce
    .number()
    .min(0, 'POS hours cannot be negative')
    .max(24, 'POS hours cannot exceed 24'),
  nmcmSHours: z.coerce
    .number()
    .min(0, 'NMCM-S hours cannot be negative')
    .max(24, 'NMCM-S hours cannot exceed 24'),
  nmcmUHours: z.coerce
    .number()
    .min(0, 'NMCM-U hours cannot be negative')
    .max(24, 'NMCM-U hours cannot exceed 24'),
  nmcsHours: z.coerce
    .number()
    .min(0, 'NMCS hours cannot be negative')
    .max(24, 'NMCS hours cannot exceed 24')
    .optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const totalDowntime = data.nmcmSHours + data.nmcmUHours + (data.nmcsHours || 0);
    return totalDowntime <= data.posHours;
  },
  {
    message: 'Total downtime hours cannot exceed POS hours',
    path: ['nmcmSHours'],
  }
);

export type DailyStatusFormData = z.infer<typeof dailyStatusSchema>;

// ============================================
// Props Interface
// ============================================

export interface DailyStatusFormProps {
  initialData?: DailyStatus;
  onSubmit: (data: DailyStatusFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

// ============================================
// Step Indicator Component (Requirements: 9.2)
// ============================================

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {stepLabels.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  isCompleted || isActive 
                    ? 'bg-primary text-primary-foreground scale-110' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label}
              </span>
            </div>
            {index < totalSteps - 1 && (
              <div className="flex-1 mx-3">
                <div className={`h-0.5 ${isCompleted ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Guided Tip Component (Requirements: 9.2, 9.10)
// ============================================

interface GuidedTipProps {
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
  dismissible?: boolean;
  onDismiss?: () => void;
}

function GuidedTip({ title, children, type = 'info', dismissible = false, onDismiss }: GuidedTipProps) {
  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  };

  const iconMap = {
    info: <Lightbulb className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
    success: <CheckCircle2 className="w-4 h-4" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border p-3 ${typeStyles[type]}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">{iconMap[type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <div className="text-xs mt-1 opacity-90">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <span className="sr-only">Dismiss</span>
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// Tooltip Component
// ============================================

function FieldTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="group relative inline-flex ml-1">
      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-64 z-50">
        {children}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
      </div>
    </div>
  );
}

// ============================================
// FMC Calculation Display Component
// ============================================

interface FMCDisplayProps {
  posHours: number;
  nmcmSHours: number;
  nmcmUHours: number;
  nmcsHours: number;
}

function FMCCalculationDisplay({ posHours, nmcmSHours, nmcmUHours, nmcsHours }: FMCDisplayProps) {
  // Ensure all values are numbers (form values might be strings)
  const pos = Number(posHours) || 0;
  const nmcmS = Number(nmcmSHours) || 0;
  const nmcmU = Number(nmcmUHours) || 0;
  const nmcs = Number(nmcsHours) || 0;
  
  // Use centralized calculation functions for consistency with backend (Requirements: 8.3, 8.7)
  const totalDowntime = calculateTotalDowntime(nmcmS, nmcmU, nmcs);
  const fmcHours = calculateFmcHours(pos, nmcmS, nmcmU, nmcs);
  const availabilityPercentage = calculateAvailability(pos, fmcHours);
  
  const isWarning = totalDowntime > pos * 0.5;
  const isError = totalDowntime > pos;
  const isExceeding = totalDowntime >= pos * 0.9 && totalDowntime <= pos;

  const getStatusColor = () => {
    if (isError) return 'text-red-600 dark:text-red-400';
    if (isWarning) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusBg = () => {
    if (isError) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (isWarning) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  const getAvailabilityColor = () => {
    if (availabilityPercentage >= 90) return 'text-green-600 dark:text-green-400';
    if (availabilityPercentage >= 85) return 'text-green-500 dark:text-green-500';
    if (availabilityPercentage >= 70) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border-2 p-4 ${getStatusBg()}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calculator className={`w-5 h-5 ${getStatusColor()}`} />
        <h4 className="font-semibold text-foreground">Automatic Calculation</h4>
      </div>
      
      <div className="space-y-3">
        {/* Calculation Formula */}
        <div className="flex items-center gap-2 text-sm font-mono bg-white/50 dark:bg-slate-800/50 rounded-md p-2">
          <span className="text-muted-foreground">FMC =</span>
          <span className="text-foreground">{pos.toFixed(1)}</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-amber-600 dark:text-amber-400">{nmcmS.toFixed(1)}</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-red-600 dark:text-red-400">{nmcmU.toFixed(1)}</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-blue-600 dark:text-blue-400">{nmcs.toFixed(1)}</span>
          <span className="text-muted-foreground">=</span>
          <span className={`font-bold ${getStatusColor()}`}>{fmcHours.toFixed(1)} hrs</span>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-1">
              <GlossaryTerm term="FMC" display="FMC Hours" />
            </p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              {fmcHours.toFixed(1)}
            </p>
          </div>
          <div className="bg-background/50 rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-1">Availability</p>
            <p className={`text-2xl font-bold ${getAvailabilityColor()}`}>
              {availabilityPercentage.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Downtime Breakdown */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Total Downtime:</span>
          <span className={`font-medium ${totalDowntime > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
            {totalDowntime.toFixed(1)} hrs
          </span>
          <span className="text-muted-foreground">
            ({pos > 0 ? ((totalDowntime / pos) * 100).toFixed(1) : 0}% of POS)
          </span>
        </div>

        {/* Warning Messages */}
        {isError && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Total downtime exceeds POS hours. Please adjust values.</span>
          </div>
        )}
        {isExceeding && !isError && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Downtime is approaching POS hours limit.</span>
          </div>
        )}
        {!isWarning && !isError && fmcHours > 0 && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Values look good. Aircraft has {fmcHours.toFixed(1)} hours of availability.</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}


// ============================================
// Main Form Component
// ============================================

export function DailyStatusForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
}: DailyStatusFormProps) {
  const isEditMode = !!initialData;
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showGuidedTip, setShowGuidedTip] = useState(!isEditMode); // Show tips for new records

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<DailyStatusFormData>({
    resolver: zodResolver(dailyStatusSchema) as any,
    defaultValues: {
      aircraftId: initialData?.aircraftId || '',
      date: initialData?.date 
        ? format(new Date(initialData.date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      posHours: initialData?.posHours ?? 24,
      nmcmSHours: initialData?.nmcmSHours ?? 0,
      nmcmUHours: initialData?.nmcmUHours ?? 0,
      nmcsHours: initialData?.nmcsHours ?? 0,
      notes: initialData?.notes || '',
    },
  });

  // Watch values for real-time FMC calculation
  const posHours = watch('posHours') || 0;
  const nmcmSHours = watch('nmcmSHours') || 0;
  const nmcmUHours = watch('nmcmUHours') || 0;
  const nmcsHours = watch('nmcsHours') || 0;
  const aircraftId = watch('aircraftId');
  const date = watch('date');

  // Calculate current step based on form completion (Requirements: 9.2)
  const currentStep = useMemo(() => {
    if (!aircraftId || !date) return 1;
    if (nmcmSHours === 0 && nmcmUHours === 0 && (nmcsHours || 0) === 0) return 2;
    return 3;
  }, [aircraftId, date, nmcmSHours, nmcmUHours, nmcsHours]);

  // Determine which guided tip to show based on current step
  const guidedTipContent = useMemo(() => {
    if (!showGuidedTip) return null;
    
    if (currentStep === 1) {
      return {
        title: 'Step 1: Select Aircraft & Date',
        content: 'Start by selecting the aircraft and the date for this status record. Each aircraft can only have one status record per day.',
        type: 'info' as const,
      };
    }
    if (currentStep === 2) {
      return {
        title: 'Step 2: Enter Downtime Hours',
        content: 'Enter any maintenance downtime hours. Leave at 0 if the aircraft was fully available. The FMC hours will be calculated automatically.',
        type: 'info' as const,
      };
    }
    return {
      title: 'Almost Done!',
      content: 'Review the calculated availability below. Add any notes if needed, then submit the record.',
      type: 'success' as const,
    };
  }, [currentStep, showGuidedTip]);



  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        aircraftId: initialData.aircraftId,
        date: format(new Date(initialData.date), 'yyyy-MM-dd'),
        posHours: initialData.posHours,
        nmcmSHours: initialData.nmcmSHours,
        nmcmUHours: initialData.nmcmUHours,
        nmcsHours: initialData.nmcsHours ?? 0,
        notes: initialData.notes || '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: DailyStatusFormData) => {
    setSubmitError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving';
      setSubmitError(errorMessage);
    }
  };

  const displayError = error || submitError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-xl"
    >
      {/* Form Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {isEditMode ? 'Edit Daily Status' : 'Add Daily Status Record'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditMode 
            ? 'Update the aircraft availability status for this date.'
            : 'Record aircraft availability and downtime hours for a specific date.'}
        </p>
      </div>

      {/* Step Indicator for new records (Requirements: 9.2) */}
      {!isEditMode && (
        <StepIndicator
          currentStep={currentStep}
          totalSteps={3}
          stepLabels={['Basic Info', 'Downtime', 'Review']}
        />
      )}

      {/* Guided Tip (Requirements: 9.2, 9.10) */}
      <AnimatePresence>
        {guidedTipContent && (
          <div className="mb-4">
            <GuidedTip
              title={guidedTipContent.title}
              type={guidedTipContent.type}
              dismissible
              onDismiss={() => setShowGuidedTip(false)}
            >
              {guidedTipContent.content}
            </GuidedTip>
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Aircraft Selection */}
            <FormFieldWithNode label="Aircraft" error={errors.aircraftId} required>
              <div className="flex items-center gap-1">
                <Controller
                  name="aircraftId"
                  control={control}
                  render={({ field }) => (
                    <AircraftSelect
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isEditMode}
                      className={errors.aircraftId ? 'border-destructive' : ''}
                    />
                  )}
                />
                <FieldTooltip>
                  Select the aircraft for which you are recording the daily status.
                  {isEditMode && ' Aircraft cannot be changed when editing.'}
                </FieldTooltip>
              </div>
            </FormFieldWithNode>

            {/* Date */}
            <FormFieldWithNode label="Date" error={errors.date} required>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  {...register('date')}
                  error={!!errors.date}
                  disabled={isEditMode}
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
                <FieldTooltip>
                  The date for this status record. Future dates are not allowed.
                  {isEditMode && ' Date cannot be changed when editing.'}
                </FieldTooltip>
              </div>
            </FormFieldWithNode>

            {/* POS Hours */}
            <FormFieldWithNode 
              label={<GlossaryTerm term="POS Hours" display="POS Hours" />} 
              error={errors.posHours} 
              required
            >
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  {...register('posHours')}
                  error={!!errors.posHours}
                />
                <FieldTooltip>
                  <strong>Possessed Hours</strong> - Total hours the aircraft was under operational control.
                  Typically 24 hours for a full day. Adjust if aircraft was transferred or acquired mid-day.
                </FieldTooltip>
              </div>
            </FormFieldWithNode>
          </div>
        </div>

        {/* Downtime Hours Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Downtime Hours
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* NMCM-S Hours */}
            <FormFieldWithNode 
              label={<GlossaryTerm term="NMCM-S" display="NMCM-S Hours" />} 
              error={errors.nmcmSHours}
            >
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  {...register('nmcmSHours')}
                  error={!!errors.nmcmSHours}
                  className="border-amber-300 dark:border-amber-700 focus:border-amber-500"
                />
                <FieldTooltip>
                  <strong>Not Mission Capable - Scheduled Maintenance</strong>
                  <br />
                  Hours the aircraft was unavailable due to planned/scheduled maintenance activities.
                </FieldTooltip>
              </div>
            </FormFieldWithNode>

            {/* NMCM-U Hours */}
            <FormFieldWithNode 
              label={<GlossaryTerm term="NMCM-U" display="NMCM-U Hours" />} 
              error={errors.nmcmUHours}
            >
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  {...register('nmcmUHours')}
                  error={!!errors.nmcmUHours}
                  className="border-red-300 dark:border-red-700 focus:border-red-500"
                />
                <FieldTooltip>
                  <strong>Not Mission Capable - Unscheduled Maintenance</strong>
                  <br />
                  Hours the aircraft was unavailable due to unexpected/unplanned maintenance issues.
                </FieldTooltip>
              </div>
            </FormFieldWithNode>

            {/* NMCS Hours */}
            <FormFieldWithNode 
              label={<GlossaryTerm term="NMCS" display="NMCS Hours (Optional)" />} 
              error={errors.nmcsHours}
            >
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  {...register('nmcsHours')}
                  error={!!errors.nmcsHours}
                  className="border-blue-300 dark:border-blue-700 focus:border-blue-500"
                />
                <FieldTooltip>
                  <strong>Not Mission Capable - Supply</strong>
                  <br />
                  Hours the aircraft was unavailable due to parts or supply issues.
                  This field is optional.
                </FieldTooltip>
              </div>
            </FormFieldWithNode>
          </div>
        </div>

        {/* FMC Calculation Display */}
        <FMCCalculationDisplay
          posHours={posHours}
          nmcmSHours={nmcmSHours}
          nmcmUHours={nmcmUHours}
          nmcsHours={nmcsHours}
        />

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4" />
            Additional Information
          </h3>
          
          <FormFieldWithNode label="Notes" error={errors.notes}>
            <Textarea
              {...register('notes')}
              placeholder="Add any additional notes about this status record (e.g., reason for downtime, maintenance details)..."
              error={!!errors.notes}
              rows={3}
            />
          </FormFieldWithNode>
        </div>

        {/* Error Display with helpful suggestions (Requirements: 9.10) */}
        {displayError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Unable to Save Record</p>
                <p className="text-sm text-destructive/80 mt-1">{displayError}</p>
                {/* Contextual suggestions based on error type */}
                <div className="mt-3 text-xs text-destructive/70">
                  <p className="font-medium mb-1">Suggestions:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {displayError.includes('already exists') || displayError.includes('duplicate') ? (
                      <>
                        <li>Check if a record already exists for this aircraft and date</li>
                        <li>Try selecting a different date or aircraft</li>
                      </>
                    ) : displayError.includes('exceed') || displayError.includes('downtime') ? (
                      <>
                        <li>Ensure total downtime hours don't exceed POS hours</li>
                        <li>Review each downtime category value</li>
                      </>
                    ) : (
                      <>
                        <li>Check your network connection</li>
                        <li>Try refreshing the page and submitting again</li>
                        <li>Contact support if the issue persists</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!isDirty && isEditMode}
          >
            {isEditMode ? 'Update Status' : 'Create Status'}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

export default DailyStatusForm;
