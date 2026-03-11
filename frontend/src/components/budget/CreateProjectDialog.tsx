import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/Dialog';
import { FormField, Input, Select, Button } from '@/components/ui/Form';
import { useBudgetProjects } from '@/hooks/useBudgetProjects';
import type { CreateBudgetProjectDto } from '@/types/budget-projects';

// Validation schema
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name is too long'),
  templateType: z.string().min(1, 'Template type is required'),
  dateRangeStart: z.string().min(1, 'Start date is required'),
  dateRangeEnd: z.string().min(1, 'End date is required'),
  currency: z.string().min(1, 'Currency is required'),
  columnNames: z.array(z.string().min(1)).min(1, 'At least one column name is required'),
  status: z.enum(['draft', 'active', 'closed']),
}).refine(
  (data) => new Date(data.dateRangeEnd) >= new Date(data.dateRangeStart),
  { message: 'End date must be after or equal to start date', path: ['dateRangeEnd'] }
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
  const [columnInput, setColumnInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      templateType: 'RSAF',
      dateRangeStart: format(new Date(), 'yyyy-MM-dd'),
      dateRangeEnd: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
      currency: 'USD',
      columnNames: [],
      status: 'draft',
    },
  });


  const columnNames = watch('columnNames');

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setColumnInput('');
    }
  }, [open, reset]);

  const addColumnName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !columnNames.includes(trimmed)) {
      setValue('columnNames', [...columnNames, trimmed], { shouldValidate: true });
    }
    setColumnInput('');
  };

  const removeColumnName = (name: string) => {
    setValue('columnNames', columnNames.filter((c) => c !== name), { shouldValidate: true });
  };

  const handleColumnInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addColumnName(columnInput);
    }
  };

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
        columnNames: data.columnNames,
        status: data.status,
      };

      const project = await createProject.mutateAsync(dto);
      console.log('Project created successfully:', project);
      navigate(`/budget-projects/${project._id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
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

        {/* Column Names Tag Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Column Names <span className="text-red-600 dark:text-red-500">*</span>
          </label>
          <Controller
            name="columnNames"
            control={control}
            render={() => (
              <div>
                <input
                  type="text"
                  value={columnInput}
                  onChange={(e) => setColumnInput(e.target.value)}
                  onKeyDown={handleColumnInputKeyDown}
                  onBlur={() => { if (columnInput.trim()) addColumnName(columnInput); }}
                  placeholder="Type column name and press Enter"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {columnNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {columnNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-900/40 px-3 py-1 text-sm font-medium text-teal-800 dark:text-teal-200"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeColumnName(name)}
                          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-teal-600 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-800 hover:text-teal-800 dark:hover:text-teal-100 transition-colors"
                          aria-label={`Remove ${name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {errors.columnNames && (
            <p className="text-sm text-red-600 dark:text-red-500">{errors.columnNames.message}</p>
          )}
        </div>

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
