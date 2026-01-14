import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { FormField, Input, Select, Textarea, Button } from '@/components/ui/Form';
import {
  useWorkOrderById,
  useCreateWorkOrder,
  useUpdateWorkOrder,
} from '@/hooks/useWorkOrders';
import { useAircraft } from '@/hooks/useAircraft';
import type { WorkOrder } from '@/types';

// Set document title for this page
const PAGE_TITLE_NEW = 'New Work Order | Alpha Star Aviation';
const PAGE_TITLE_EDIT = 'Edit Work Order | Alpha Star Aviation';

// Validation schema for work order form
const workOrderSchema = z.object({
  woNumber: z.string().min(1, 'Work order number is required'),
  aircraftId: z.string().min(1, 'Aircraft is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['Open', 'InProgress', 'Closed', 'Deferred']),
  dateIn: z.string().min(1, 'Date in is required'),
  dateOut: z.string().optional(),
  dueDate: z.string().optional(),
  crsNumber: z.string().optional(),
  mrNumber: z.string().optional(),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Closed', label: 'Closed' },
  { value: 'Deferred', label: 'Deferred' },
];

export function WorkOrdersNewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // Set document title based on mode
  useEffect(() => {
    document.title = isEditMode ? PAGE_TITLE_EDIT : PAGE_TITLE_NEW;
  }, [isEditMode]);

  // Fetch work order data if in edit mode
  const { data: workOrderData, isLoading: workOrderLoading } = useWorkOrderById(id || '');
  const { data: aircraftData } = useAircraft();
  const createWorkOrder = useCreateWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();

  const aircraft = aircraftData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema) as never,
    defaultValues: {
      status: 'Open',
      dateIn: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && workOrderData) {
      reset({
        woNumber: workOrderData.woNumber,
        aircraftId: workOrderData.aircraftId,
        description: workOrderData.description,
        status: workOrderData.status,
        dateIn: workOrderData.dateIn
          ? format(new Date(workOrderData.dateIn), 'yyyy-MM-dd')
          : '',
        dateOut: workOrderData.dateOut
          ? format(new Date(workOrderData.dateOut), 'yyyy-MM-dd')
          : '',
        dueDate: workOrderData.dueDate
          ? format(new Date(workOrderData.dueDate), 'yyyy-MM-dd')
          : '',
        crsNumber: workOrderData.crsNumber || '',
        mrNumber: workOrderData.mrNumber || '',
      });
    }
  }, [isEditMode, workOrderData, reset]);

  const onSubmit = async (data: WorkOrderFormData) => {
    try {
      if (isEditMode && id) {
        await updateWorkOrder.mutateAsync({
          id,
          ...data,
        });
      } else {
        await createWorkOrder.mutateAsync(data as Omit<WorkOrder, '_id' | 'createdAt' | 'isOverdue'>);
      }
      // Navigate back to list on success
      navigate('/work-orders');
    } catch (error) {
      console.error('Failed to save work order:', error);
    }
  };

  const aircraftOptions = aircraft.map((a) => ({
    value: a._id,
    label: `${a.registration} - ${a.fleetGroup}`,
  }));

  const isLoading = createWorkOrder.isPending || updateWorkOrder.isPending;

  if (isEditMode && workOrderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading work order...</p>
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
          {isEditMode ? 'Edit Work Order' : 'New Work Order'}
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
            {/* Work Order Number */}
            <FormField label="WO Number" error={errors.woNumber} required>
              <Input
                {...register('woNumber')}
                placeholder="e.g., WO-2024-001"
                error={!!errors.woNumber}
                disabled={isEditMode}
              />
            </FormField>

            {/* Aircraft Selection */}
            <FormField label="Aircraft" error={errors.aircraftId} required>
              <Select
                {...register('aircraftId')}
                options={aircraftOptions}
                error={!!errors.aircraftId}
              />
            </FormField>

            {/* Status */}
            <FormField label="Status" error={errors.status} required>
              <Select
                {...register('status')}
                options={STATUS_OPTIONS}
                error={!!errors.status}
              />
            </FormField>

            {/* Date In */}
            <FormField label="Date In" error={errors.dateIn} required>
              <Input type="date" {...register('dateIn')} error={!!errors.dateIn} />
            </FormField>

            {/* Date Out */}
            <FormField label="Date Out" error={errors.dateOut}>
              <Input type="date" {...register('dateOut')} error={!!errors.dateOut} />
            </FormField>

            {/* Due Date */}
            <FormField label="Due Date" error={errors.dueDate}>
              <Input type="date" {...register('dueDate')} error={!!errors.dueDate} />
            </FormField>

            {/* CRS Number */}
            <FormField label="CRS Number" error={errors.crsNumber}>
              <Input
                {...register('crsNumber')}
                placeholder="Certificate of Release to Service"
                error={!!errors.crsNumber}
              />
            </FormField>

            {/* MR Number */}
            <FormField label="MR Number" error={errors.mrNumber}>
              <Input
                {...register('mrNumber')}
                placeholder="Maintenance Release"
                error={!!errors.mrNumber}
              />
            </FormField>
          </div>

          {/* Description */}
          <FormField label="Description" error={errors.description} required>
            <Textarea
              {...register('description')}
              placeholder="Describe the work order..."
              error={!!errors.description}
            />
          </FormField>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/work-orders')}
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
              {isEditMode ? 'Update' : 'Create'} Work Order
            </Button>
          </div>

          {/* Success/Error Messages */}
          {(createWorkOrder.isSuccess || updateWorkOrder.isSuccess) && (
            <p className="text-sm text-green-600">Work order saved successfully!</p>
          )}
          {(createWorkOrder.isError || updateWorkOrder.isError) && (
            <p className="text-sm text-destructive">
              Failed to save work order. Please check your inputs and try again.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
