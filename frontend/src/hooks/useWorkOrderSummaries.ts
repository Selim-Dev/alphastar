import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  WorkOrderSummary,
  CreateWorkOrderSummaryDto,
  UpdateWorkOrderSummaryDto,
  WorkOrderSummaryFilter,
  WorkOrderSummaryTrendResponse,
} from '@/types';

/**
 * Hook for fetching work order summaries with optional filtering
 * Requirements: 11.1, 11.4
 */
export function useWorkOrderSummaries(filters?: WorkOrderSummaryFilter) {
  return useQuery({
    queryKey: ['work-order-summaries', filters],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderSummary[]>('/work-order-summaries', {
        params: filters,
      });
      return data;
    },
  });
}

/**
 * Hook for fetching a single work order summary by ID
 */
export function useWorkOrderSummaryById(id: string) {
  return useQuery({
    queryKey: ['work-order-summaries', id],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderSummary>(`/work-order-summaries/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook for fetching work order summary trends
 * Requirements: 14.2
 */
export function useWorkOrderSummaryTrends(filters?: WorkOrderSummaryFilter) {
  return useQuery({
    queryKey: ['work-order-summaries', 'trends', filters],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderSummaryTrendResponse>(
        '/work-order-summaries/trends',
        { params: filters }
      );
      return data;
    },
  });
}

/**
 * Hook for fetching total work order count for a period
 */
export function useWorkOrderSummaryTotal(filters?: WorkOrderSummaryFilter) {
  return useQuery({
    queryKey: ['work-order-summaries', 'total', filters],
    queryFn: async () => {
      const { data } = await api.get<{ total: number }>(
        '/work-order-summaries/total',
        { params: filters }
      );
      return data.total;
    },
  });
}

/**
 * Hook for creating/upserting a work order summary
 * Requirements: 11.2, 11.3
 */
export function useCreateWorkOrderSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateWorkOrderSummaryDto) => {
      const { data } = await api.post<WorkOrderSummary>('/work-order-summaries', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook for updating a work order summary
 */
export function useUpdateWorkOrderSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateWorkOrderSummaryDto & { id: string }) => {
      const { data } = await api.put<WorkOrderSummary>(`/work-order-summaries/${id}`, dto);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-order-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['work-order-summaries', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook for deleting a work order summary
 */
export function useDeleteWorkOrderSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/work-order-summaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
