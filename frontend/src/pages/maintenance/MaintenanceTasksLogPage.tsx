import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Set document title for this page
const PAGE_TITLE = 'Log Maintenance Task | Alpha Star Aviation';
import { FormField, Input, Select, Textarea, Button } from '@/components/ui/Form';
import {
  useTaskTypes,
  useCreateMaintenanceTask,
} from '@/hooks/useMaintenance';
import { useAircraft } from '@/hooks/useAircraft';
import { useWorkOrders } from '@/hooks/useWorkOrders';

// Validation schema for maintenance task form
const maintenanceTaskSchema = z.object({
  aircraftId: z.string().min(1, 'Aircraft is required'),
  date: z.string().min(1, 'Date is required'),
  shift: z.enum(['Morning', 'Evening', 'Night', 'Other']),
  taskType: z.string().min(1, 'Task type is required'),
  taskDescription: z.string().min(1, 'Task description is required'),
  manpowerCount: z.coerce.number().min(0, 'Must be 0 or greater'),
  manHours: z.coerce.number().min(0, 'Must be 0 or greater'),
  cost: z.coerce.number().min(0, 'Must be 0 or greater').optional(),
  workOrderRef: z.string().optional(),
});

type MaintenanceTaskFormData = z.infer<typeof maintenanceTaskSchema>;

const SHIFT_OPTIONS = [
  { value: 'Morning', label: 'Morning' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Night', label: 'Night' },
  { value: 'Other', label: 'Other' },
];

const DEFAULT_TASK_TYPES = [
  'Inspection',
  'Repair',
  'Scheduled Maintenance',
  'Unscheduled Maintenance',
  'Component Replacement',
  'Troubleshooting',
  'Cleaning',
  'Documentation',
  'Other',
];

export function MaintenanceTasksLogPage() {
  const navigate = useNavigate();
  const { data: aircraftData } = useAircraft();
  const { data: workOrdersData } = useWorkOrders();
  const { data: taskTypesData } = useTaskTypes();
  const createTask = useCreateMaintenanceTask();
  const [customTaskType, setCustomTaskType] = useState('');

  // Set document title
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  const aircraft = aircraftData?.data || [];
  const workOrders = workOrdersData || [];
  const taskTypes = taskTypesData || [];


  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MaintenanceTaskFormData>({
    resolver: zodResolver(maintenanceTaskSchema) as never,
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      shift: 'Morning',
      manpowerCount: 1,
      manHours: 0,
      cost: 0,
    },
  });

  const selectedTaskType = watch('taskType');
  const allTaskTypes = [...new Set([...DEFAULT_TASK_TYPES, ...taskTypes])];

  const onSubmit = async (data: MaintenanceTaskFormData) => {
    try {
      await createTask.mutateAsync({
        ...data,
        taskType: data.taskType === 'custom' ? customTaskType : data.taskType,
      });
      // Navigate back to list on success
      navigate('/maintenance/tasks');
    } catch (error) {
      console.error('Failed to create maintenance task:', error);
    }
  };

  const aircraftOptions = aircraft.map((a) => ({
    value: a._id,
    label: `${a.registration} - ${a.fleetGroup}`,
  }));

  const workOrderOptions = [
    { value: '', label: 'No Work Order' },
    ...workOrders
      .filter((wo) => wo.status !== 'Closed')
      .map((wo) => ({
        value: wo._id,
        label: `${wo.woNumber} - ${wo.description.substring(0, 30)}...`,
      })),
  ];

  const taskTypeOptions = [
    ...allTaskTypes.map((t) => ({ value: t, label: t })),
    { value: 'custom', label: '+ Custom Type' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        Log Maintenance Task
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

            {/* Date */}
            <FormField label="Date" error={errors.date} required>
              <Input type="date" {...register('date')} error={!!errors.date} />
            </FormField>

            {/* Shift */}
            <FormField label="Shift" error={errors.shift} required>
              <Select {...register('shift')} options={SHIFT_OPTIONS} error={!!errors.shift} />
            </FormField>

            {/* Task Type */}
            <FormField label="Task Type" error={errors.taskType} required>
              <Select
                {...register('taskType')}
                options={taskTypeOptions}
                error={!!errors.taskType}
              />
            </FormField>

            {/* Custom Task Type Input */}
            {selectedTaskType === 'custom' && (
              <FormField label="Custom Task Type" required>
                <Input
                  value={customTaskType}
                  onChange={(e) => setCustomTaskType(e.target.value)}
                  placeholder="Enter custom task type"
                />
              </FormField>
            )}

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

            {/* Cost */}
            <FormField label="Cost (USD)" error={errors.cost}>
              <Input type="number" min="0" step="0.01" {...register('cost')} error={!!errors.cost} />
            </FormField>

            {/* Work Order Reference */}
            <FormField label="Work Order Reference" error={errors.workOrderRef}>
              <Select
                {...register('workOrderRef')}
                options={workOrderOptions}
                error={!!errors.workOrderRef}
              />
            </FormField>
          </div>

          {/* Task Description */}
          <FormField label="Task Description" error={errors.taskDescription} required>
            <Textarea
              {...register('taskDescription')}
              placeholder="Describe the maintenance task performed..."
              error={!!errors.taskDescription}
            />
          </FormField>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/maintenance/tasks')}
            >
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              reset();
              setCustomTaskType('');
            }}>
              Clear
            </Button>
            <Button type="submit" isLoading={createTask.isPending}>
              Log Task
            </Button>
          </div>

          {/* Success/Error Messages */}
          {createTask.isSuccess && (
            <p className="text-sm text-green-600">Maintenance task logged successfully!</p>
          )}
          {createTask.isError && (
            <p className="text-sm text-destructive">
              Failed to log task. Please check your inputs and try again.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
