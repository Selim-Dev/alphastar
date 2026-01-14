import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MaintenanceTask, DateRangeFilter } from '@/types';

interface MaintenanceFilters extends DateRangeFilter {
  aircraftId?: string;
  shift?: string;
  taskType?: string;
  page?: number;
  limit?: number;
}

export interface MaintenanceSummaryItem {
  _id: Record<string, string>;
  totalTasks: number;
  totalManHours: number;
  totalCost: number;
  avgManHours: number;
}

export interface CostDriverItem {
  aircraftId: string;
  totalCost: number;
  totalTasks: number;
  totalManHours: number;
  avgCostPerTask: number;
}

export function useMaintenanceTasks(filters?: MaintenanceFilters) {
  return useQuery({
    queryKey: ['maintenance-tasks', filters],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceTask[]>('/maintenance-tasks', { params: filters });
      return data;
    },
  });
}

export function useMaintenanceSummary(query: DateRangeFilter & { groupBy?: string; aircraftId?: string }) {
  return useQuery({
    queryKey: ['maintenance-tasks', 'summary', query],
    queryFn: async () => {
      const { data } = await api.get<MaintenanceSummaryItem[]>('/maintenance-tasks/summary', { params: query });
      return data;
    },
  });
}

export function useTopCostDrivers(query: DateRangeFilter & { limit?: number }) {
  return useQuery({
    queryKey: ['maintenance-tasks', 'top-cost-drivers', query],
    queryFn: async () => {
      const { data } = await api.get<CostDriverItem[]>('/maintenance-tasks/top-cost-drivers', { params: query });
      return data;
    },
  });
}

export function useTaskTypes() {
  return useQuery({
    queryKey: ['maintenance-tasks', 'task-types'],
    queryFn: async () => {
      const { data } = await api.get<{ taskTypes: string[] }>('/maintenance-tasks/task-types');
      return data.taskTypes;
    },
  });
}

export function useCreateMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<MaintenanceTask, '_id' | 'createdAt'>) => {
      const { data } = await api.post<MaintenanceTask>('/maintenance-tasks', task);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...task }: Partial<MaintenanceTask> & { id: string }) => {
      const { data } = await api.put<MaintenanceTask>(`/maintenance-tasks/${id}`, task);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteMaintenanceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/maintenance-tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
