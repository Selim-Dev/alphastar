import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/Dialog';
import { FormField, Input, Select, Button } from '@/components/ui/Form';
import { useAircraft } from '@/hooks/useAircraft';
import { useBudgetProjects } from '@/hooks/useBudgetProjects';
import type { CreateBudgetProjectDto } from '@/types/budget-projects';

// Validation schema
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
  templateType: z.string().min(1, 'Template type is required'),
  dateRangeStart: z.string().min(1, 'Start date is required'),
  dateRangeEnd: z.string().min(1, 'End date is required'),
  currency: z.string().min(1, 'Currency is required'),
  aircraftScopeType: z.enum(['individual', 'type', 'group']),
  aircraftIds: z.array(z.string()).optional(),
  aircraftTypes: z.array(z.string()).optional(),
  fleetGroups: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'closed']),
}).refine(
  (data) => new Date(data.dateRangeEnd) >= new Date(data.dateRangeStart),
  {
    message: 'End date must be after or equal to start date',
    path: ['dateRangeEnd'],
  }
);

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectDialog({ open, onClose }: CreateProjectDialogProps) {
  const navigate = useNavigate();
  const { useCreateProject } = useBudgetProjects();
  const createProject = useCreateProject();
  const { data: aircraftData } = useAircraft();
  const aircraft = aircraftData?.data || [];

  const [selectedAircraftIds, setSelectedAircraftIds] = useState<string[]>([]);
  const [selectedAircraftTypes, setSelectedAircraftTypes] = useState<string[]>([]);
  const [selectedFleetGroups, setSelectedFleetGroups] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      templateType: 'RSAF',
      dateRangeStart: format(new Date(), 'yyyy-MM-dd'),
      dateRangeEnd: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
      currency: 'USD',
      aircraftScopeType: 'type',
      status: 'draft',
    },
  });

  const aircraftScopeType = watch('aircraftScopeType');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setSelectedAircraftIds([]);
      setSelectedAircraftTypes([]);
      setSelectedFleetGroups([]);
    }
  }, [open, reset]);

  // Get unique aircraft types and fleet groups
  const aircraftTypes = Array.from(new Set(aircraft.map((a) => a.aircraftType).filter(Boolean)));
  const fleetGroups = Array.from(new Set(aircraft.map((a) => a.fleetGroup).filter(Boolean)));

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      const dto: CreateBudgetProjectDto = {
        name: data.name,
        templateType: data.templateType,
        dateRange: {
          start: data.dateRangeStart,
          end: data.dateRangeEnd,
        },
        currency: data.currency,
        aircraftScope: {
          type: data.aircraftScopeType,
          ...(data.aircraftScopeType === 'individual' && { aircraftIds: selectedAircraftIds }),
          ...(data.aircraftScopeType === 'type' && { aircraftTypes: selectedAircraftTypes }),
          ...(data.aircraftScopeType === 'group' && { fleetGroups: selectedFleetGroups }),
        },
        status: data.status,
      };

      const project = await createProject.mutateAsync(dto);
      
      // Show success toast (you can add a toast library)
      console.log('Project created successfully:', project);
      
      // Navigate to the project detail page
      navigate(`/budget-projects/${project._id}`);
      
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      // Error handling - you can add a toast notification here
    }
  };

  const handleAircraftSelection = (aircraftId: string, checked: boolean) => {
    setSelectedAircraftIds((prev) =>
      checked ? [...prev, aircraftId] : prev.filter((id) => id !== aircraftId)
    );
  };

  const handleAircraftTypeSelection = (type: string, checked: boolean) => {
    setSelectedAircraftTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type)
    );
  };

  const handleFleetGroupSelection = (group: string, checked: boolean) => {
    setSelectedFleetGroups((prev) =>
      checked ? [...prev, group] : prev.filter((g) => g !== group)
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title="Create Budget Project" maxWidth="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Project Name */}
        <FormField label="Project Name" error={errors.name} required>
          <Input
            {...register('name')}
            placeholder="e.g., RSAF FY2025 Budget"
            error={!!errors.name}
          />
        </FormField>

        {/* Template Type */}
        <FormField label="Template Type" error={errors.templateType} required>
          <Controller
            name="templateType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[{ value: 'RSAF', label: 'RSAF Template' }]}
                error={!!errors.templateType}
              />
            )}
          />
        </FormField>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Start Date" error={errors.dateRangeStart} required>
            <Input
              type="date"
              {...register('dateRangeStart')}
              error={!!errors.dateRangeStart}
            />
          </FormField>

          <FormField label="End Date" error={errors.dateRangeEnd} required>
            <Input
              type="date"
              {...register('dateRangeEnd')}
              error={!!errors.dateRangeEnd}
            />
          </FormField>
        </div>

        {/* Currency */}
        <FormField label="Currency" error={errors.currency} required>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'SAR', label: 'SAR - Saudi Riyal' },
                  { value: 'EUR', label: 'EUR - Euro' },
                ]}
                error={!!errors.currency}
              />
            )}
          />
        </FormField>

        {/* Aircraft Scope Type */}
        <FormField label="Aircraft Scope" error={errors.aircraftScopeType} required>
          <Controller
            name="aircraftScopeType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'individual', label: 'Individual Aircraft' },
                  { value: 'type', label: 'Aircraft Type' },
                  { value: 'group', label: 'Fleet Group' },
                ]}
                error={!!errors.aircraftScopeType}
              />
            )}
          />
        </FormField>

        {/* Aircraft Selection based on scope type */}
        {aircraftScopeType === 'individual' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Select Aircraft <span className="text-red-600 dark:text-red-500">*</span>
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
              {aircraft.map((a) => (
                <label key={a._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedAircraftIds.includes(a._id)}
                    onChange={(e) => handleAircraftSelection(a._id, e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {a.registration} ({a.aircraftType})
                  </span>
                </label>
              ))}
            </div>
            {selectedAircraftIds.length === 0 && (
              <p className="text-sm text-red-600 dark:text-red-500">At least one aircraft must be selected</p>
            )}
          </div>
        )}

        {aircraftScopeType === 'type' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Select Aircraft Types <span className="text-red-600 dark:text-red-500">*</span>
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
              {aircraftTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedAircraftTypes.includes(type)}
                    onChange={(e) => handleAircraftTypeSelection(type, e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{type}</span>
                </label>
              ))}
            </div>
            {selectedAircraftTypes.length === 0 && (
              <p className="text-sm text-red-600 dark:text-red-500">At least one aircraft type must be selected</p>
            )}
          </div>
        )}

        {aircraftScopeType === 'group' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
              Select Fleet Groups <span className="text-red-600 dark:text-red-500">*</span>
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
              {fleetGroups.map((group) => (
                <label key={group} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedFleetGroups.includes(group)}
                    onChange={(e) => handleFleetGroupSelection(group, e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">{group}</span>
                </label>
              ))}
            </div>
            {selectedFleetGroups.length === 0 && (
              <p className="text-sm text-red-600 dark:text-red-500">At least one fleet group must be selected</p>
            )}
          </div>
        )}

        {/* Status */}
        <FormField label="Status" error={errors.status}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Active' },
                  { value: 'closed', label: 'Closed' },
                ]}
                error={!!errors.status}
              />
            )}
          />
        </FormField>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
