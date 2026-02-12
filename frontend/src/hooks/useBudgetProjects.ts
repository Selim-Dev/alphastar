import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  BudgetProject,
  BudgetTableData,
  CreateBudgetProjectDto,
  UpdateBudgetProjectDto,
  UpdatePlanRowDto,
  UpdateActualDto,
  BudgetProjectFilters,
} from '@/types/budget-projects';

/**
 * Custom hook for budget projects CRUD operations
 * Provides queries and mutations for managing budget projects
 */
export function useBudgetProjects() {
  const queryClient = useQueryClient();

  /**
   * Query to fetch all budget projects with optional filters
   * @param filters - Optional filters for year, status, templateType
   */
  const useProjects = (filters?: BudgetProjectFilters) => {
    return useQuery({
      queryKey: ['budget-projects', filters],
      queryFn: async () => {
        const { data } = await api.get<BudgetProject[]>('/budget-projects', {
          params: filters,
        });
        return data;
      },
    });
  };

  /**
   * Query to fetch a single budget project by ID
   * @param id - Project ID
   */
  const useProject = (id: string) => {
    return useQuery({
      queryKey: ['budget-projects', id],
      queryFn: async () => {
        const { data } = await api.get<BudgetProject>(`/budget-projects/${id}`);
        return data;
      },
      enabled: !!id,
    });
  };

  /**
   * Mutation to create a new budget project
   */
  const useCreateProject = () => {
    return useMutation({
      mutationFn: async (dto: CreateBudgetProjectDto) => {
        const { data } = await api.post<BudgetProject>('/budget-projects', dto);
        return data;
      },
      onSuccess: () => {
        // Invalidate projects list to refetch
        queryClient.invalidateQueries({ queryKey: ['budget-projects'] });
      },
    });
  };

  /**
   * Mutation to update an existing budget project
   */
  const useUpdateProject = () => {
    return useMutation({
      mutationFn: async ({ id, dto }: { id: string; dto: UpdateBudgetProjectDto }) => {
        const { data } = await api.put<BudgetProject>(`/budget-projects/${id}`, dto);
        return data;
      },
      onSuccess: (data) => {
        // Invalidate both the list and the specific project
        queryClient.invalidateQueries({ queryKey: ['budget-projects'] });
        queryClient.invalidateQueries({ queryKey: ['budget-projects', data._id] });
      },
    });
  };

  /**
   * Mutation to delete a budget project (Admin only)
   */
  const useDeleteProject = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`/budget-projects/${id}`);
      },
      onSuccess: () => {
        // Invalidate projects list
        queryClient.invalidateQueries({ queryKey: ['budget-projects'] });
      },
    });
  };

  /**
   * Query to fetch table data for a budget project
   * @param projectId - Project ID
   */
  const useTableData = (projectId: string) => {
    return useQuery({
      queryKey: ['budget-projects', projectId, 'table-data'],
      queryFn: async () => {
        const { data } = await api.get<BudgetTableData>(
          `/budget-projects/${projectId}/table-data`
        );
        return data;
      },
      enabled: !!projectId,
    });
  };

  /**
   * Mutation to update a plan row's planned amount
   */
  const useUpdatePlanRow = () => {
    return useMutation({
      mutationFn: async ({
        projectId,
        rowId,
        dto,
      }: {
        projectId: string;
        rowId: string;
        dto: UpdatePlanRowDto;
      }) => {
        await api.patch(`/budget-projects/${projectId}/plan-row/${rowId}`, dto);
      },
      onSuccess: (_, variables) => {
        // Invalidate table data to refetch with updated totals
        queryClient.invalidateQueries({
          queryKey: ['budget-projects', variables.projectId, 'table-data'],
        });
        // Also invalidate analytics as budgeted amounts changed
        queryClient.invalidateQueries({
          queryKey: ['budget-analytics', variables.projectId],
        });
      },
    });
  };

  /**
   * Mutation to update an actual spend amount for a period
   */
  const useUpdateActual = () => {
    return useMutation({
      mutationFn: async ({
        projectId,
        period,
        dto,
      }: {
        projectId: string;
        period: string;
        dto: UpdateActualDto;
      }) => {
        await api.patch(`/budget-projects/${projectId}/actual/${period}`, dto);
      },
      onSuccess: (_, variables) => {
        // Invalidate table data to refetch with updated totals
        queryClient.invalidateQueries({
          queryKey: ['budget-projects', variables.projectId, 'table-data'],
        });
        // Also invalidate analytics as actual amounts changed
        queryClient.invalidateQueries({
          queryKey: ['budget-analytics', variables.projectId],
        });
        // Invalidate audit log as well
        queryClient.invalidateQueries({
          queryKey: ['budget-audit', variables.projectId],
        });
      },
    });
  };

  return {
    useProjects,
    useProject,
    useCreateProject,
    useUpdateProject,
    useDeleteProject,
    useTableData,
    useUpdatePlanRow,
    useUpdateActual,
  };
}
