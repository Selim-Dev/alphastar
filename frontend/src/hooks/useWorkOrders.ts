import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { WorkOrder, DateRangeFilter } from '@/types';

interface WorkOrderFilters extends DateRangeFilter {
  aircraftId?: string;
  status?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface TurnaroundStats {
  averageTurnaroundDays: number;
  minTurnaroundDays: number;
  maxTurnaroundDays: number;
  totalClosed: number;
}

export function useWorkOrders(filters?: WorkOrderFilters) {
  return useQuery({
    queryKey: ['work-orders', filters],
    queryFn: async () => {
      const { data } = await api.get<WorkOrder[]>('/work-orders', { params: filters });
      return data;
    },
  });
}

export function useWorkOrderById(id: string) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: async () => {
      const { data } = await api.get<WorkOrder>(`/work-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useOverdueWorkOrders(aircraftId?: string) {
  return useQuery({
    queryKey: ['work-orders', 'overdue', aircraftId],
    queryFn: async () => {
      const { data } = await api.get<WorkOrder[]>('/work-orders/overdue', {
        params: aircraftId ? { aircraftId } : undefined,
      });
      return data;
    },
  });
}

export function useOverdueCount(aircraftId?: string) {
  return useQuery({
    queryKey: ['work-orders', 'overdue-count', aircraftId],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/work-orders/overdue/count', {
        params: aircraftId ? { aircraftId } : undefined,
      });
      return data.count;
    },
  });
}

export function useStatusDistribution(filters?: DateRangeFilter & { aircraftId?: string }) {
  return useQuery({
    queryKey: ['work-orders', 'status-distribution', filters],
    queryFn: async () => {
      const { data } = await api.get<StatusDistribution[]>(
        '/work-orders/analytics/status-distribution',
        { params: filters }
      );
      return data;
    },
  });
}

export function useTurnaroundStats(filters?: DateRangeFilter & { aircraftId?: string }) {
  return useQuery({
    queryKey: ['work-orders', 'turnaround-stats', filters],
    queryFn: async () => {
      const { data } = await api.get<TurnaroundStats>(
        '/work-orders/analytics/turnaround',
        { params: filters }
      );
      return data;
    },
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (workOrder: Omit<WorkOrder, '_id' | 'createdAt' | 'isOverdue'>) => {
      const { data } = await api.post<WorkOrder>('/work-orders', workOrder);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...workOrder }: Partial<WorkOrder> & { id: string }) => {
      const { data } = await api.put<WorkOrder>(`/work-orders/${id}`, workOrder);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/work-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
