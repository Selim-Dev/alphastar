import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  VacationPlan,
  CreateVacationPlanDto,
  UpdateVacationPlanDto,
  VacationPlanFilter,
} from '@/types';

/**
 * Hook for fetching vacation plans with optional filtering
 * Requirements: 18.1
 */
export function useVacationPlans(filters?: VacationPlanFilter) {
  return useQuery({
    queryKey: ['vacation-plans', filters],
    queryFn: async () => {
      const { data } = await api.get<VacationPlan[]>('/vacation-plans', {
        params: filters,
      });
      return data;
    },
  });
}

/**
 * Hook for fetching a single vacation plan by ID
 */
export function useVacationPlanById(id: string) {
  return useQuery({
    queryKey: ['vacation-plans', id],
    queryFn: async () => {
      const { data } = await api.get<VacationPlan>(`/vacation-plans/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching a vacation plan by year and team
 * This is useful for the UI which typically shows one plan at a time
 */
export function useVacationPlanByYearAndTeam(year: number, team: string) {
  return useQuery({
    queryKey: ['vacation-plans', 'by-year-team', year, team],
    queryFn: async () => {
      const { data } = await api.get<VacationPlan[]>('/vacation-plans', {
        params: { year, team },
      });
      // Return the first (and should be only) plan for this year/team combo
      return data.length > 0 ? data[0] : null;
    },
    enabled: !!year && !!team,
  });
}

/**
 * Hook for creating a vacation plan
 * Requirements: 18.1
 */
export function useCreateVacationPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateVacationPlanDto) => {
      const { data } = await api.post<VacationPlan>('/vacation-plans', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-plans'] });
    },
  });
}

/**
 * Hook for updating a vacation plan (bulk update)
 * Requirements: 18.2
 */
export function useUpdateVacationPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateVacationPlanDto & { id: string }) => {
      const { data } = await api.put<VacationPlan>(`/vacation-plans/${id}`, dto);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacation-plans'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-plans', variables.id] });
    },
  });
}

/**
 * Hook for updating a single cell in a vacation plan
 * Requirements: 18.3
 */
export function useUpdateVacationPlanCell() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employeeName, weekIndex, value }: { id: string; employeeName: string; weekIndex: number; value: number }) => {
      const { data } = await api.patch<VacationPlan>(`/vacation-plans/${id}/cell`, {
        employeeName,
        weekIndex,
        value,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacation-plans'] });
      queryClient.invalidateQueries({ queryKey: ['vacation-plans', variables.id] });
    },
  });
}

/**
 * Hook for deleting a vacation plan
 */
export function useDeleteVacationPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/vacation-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-plans'] });
    },
  });
}

/**
 * Hook for exporting a vacation plan to Excel
 * Requirements: 18.4
 */
export function useExportVacationPlan() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.get(`/vacation-plans/${id}/export`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'vacation-plan.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}

/**
 * Hook for importing vacation plans from Excel
 * Requirements: 18.5
 */
export function useImportVacationPlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, year }: { file: File; year: number }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year.toString());
      
      const { data } = await api.post<{ success: boolean; message: string; successCount: number; errors: { row: number; message: string }[] }>(
        '/vacation-plans/import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacation-plans'] });
    },
  });
}

/**
 * Hook for adding an employee to a vacation plan
 */
export function useAddEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!id) {
        throw new Error('Plan ID is required to add an employee');
      }
      
      // Use the dedicated endpoint for adding employees
      const { data } = await api.post<VacationPlan>(`/vacation-plans/${id}/employees`, { name });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacation-plans'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['vacation-plans', variables.id] });
      }
    },
  });
}

/**
 * Hook for removing an employee from a vacation plan
 */
export function useRemoveEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, employeeIndex, employeeName }: { id: string; employeeIndex: number; employeeName?: string }) => {
      if (!id) {
        throw new Error('Plan ID is required to remove an employee');
      }
      
      // If employeeName is provided, use it directly; otherwise get it from the plan
      let nameToRemove = employeeName;
      if (!nameToRemove) {
        const { data: plan } = await api.get<VacationPlan>(`/vacation-plans/${id}`);
        nameToRemove = plan.employees[employeeIndex]?.name;
        if (!nameToRemove) {
          throw new Error('Employee not found at the specified index');
        }
      }
      
      // Use the dedicated endpoint for removing employees
      const { data } = await api.delete<VacationPlan>(`/vacation-plans/${id}/employees/${encodeURIComponent(nameToRemove)}`);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacation-plans'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: ['vacation-plans', variables.id] });
      }
    },
  });
}
