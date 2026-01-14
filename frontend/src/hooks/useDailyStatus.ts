import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DailyStatus, DateRangeFilter, FleetAvailabilityItem } from '@/types';

interface StatusFilters extends DateRangeFilter {
  aircraftId?: string;
  page?: number;
  limit?: number;
}

interface AvailabilityQuery extends DateRangeFilter {
  aircraftId?: string;
  groupBy?: 'day' | 'month' | 'year';
}

/**
 * Invalidates all dashboard-related queries to ensure KPIs reflect daily status changes
 * Requirements: 2.5, 3.4, 8.1 - Dashboard refresh on record creation/update
 */
function invalidateDashboardQueries(queryClient: ReturnType<typeof useQueryClient>) {
  // Invalidate all dashboard queries to ensure fleet availability KPI reflects changes immediately
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  // Invalidate specific dashboard sub-queries for comprehensive refresh
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'kpis'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'trends'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'health-score'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'alerts'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'period-comparison'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'fleet-comparison'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'operational-efficiency'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'insights'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'yoy-comparison'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard', 'data-quality'] });
}

export function useDailyStatus(filters?: StatusFilters) {
  return useQuery({
    queryKey: ['daily-status', filters],
    queryFn: async () => {
      const { data } = await api.get<DailyStatus[]>('/daily-status', { params: filters });
      return data;
    },
  });
}

export function useAvailability(query: AvailabilityQuery) {
  return useQuery({
    queryKey: ['daily-status', 'availability', query],
    queryFn: async () => {
      const { data } = await api.get('/daily-status/availability', { params: query });
      return data;
    },
    enabled: !!query.startDate && !!query.endDate,
  });
}

export function useFleetAvailability(filters: DateRangeFilter) {
  return useQuery({
    queryKey: ['daily-status', 'fleet-availability', filters],
    queryFn: async () => {
      const { data } = await api.get<FleetAvailabilityItem[]>('/daily-status/availability/fleet', {
        params: filters,
      });
      return data;
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

export function useDailyStatusById(id: string) {
  return useQuery({
    queryKey: ['daily-status', id],
    queryFn: async () => {
      const { data } = await api.get<DailyStatus>(`/daily-status/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDailyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: Omit<DailyStatus, '_id' | 'createdAt'>) => {
      const { data } = await api.post<DailyStatus>('/daily-status', status);
      return data;
    },
    onSuccess: () => {
      // Invalidate daily status queries
      queryClient.invalidateQueries({ queryKey: ['daily-status'] });
      // Invalidate all dashboard queries to reflect updated fleet availability KPI
      // Requirements: 2.5 - Dashboard refresh on record creation
      invalidateDashboardQueries(queryClient);
    },
  });
}

export interface UpdateDailyStatusData {
  posHours?: number;
  fmcHours?: number;
  nmcmSHours?: number;
  nmcmUHours?: number;
  nmcsHours?: number;
  notes?: string;
}

export function useUpdateDailyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateDailyStatusData & { id: string }) => {
      const { data: result } = await api.put<DailyStatus>(`/daily-status/${id}`, data);
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate daily status queries
      queryClient.invalidateQueries({ queryKey: ['daily-status'] });
      queryClient.invalidateQueries({ queryKey: ['daily-status', variables.id] });
      // Invalidate all dashboard queries to reflect updated fleet availability metrics
      // Requirements: 3.4 - Metrics recalculation on update
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteDailyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/daily-status/${id}`);
    },
    onSuccess: () => {
      // Invalidate daily status queries
      queryClient.invalidateQueries({ queryKey: ['daily-status'] });
      // Invalidate all dashboard queries to reflect updated fleet availability metrics
      // Requirements: 8.1 - Dashboard refresh on data changes
      invalidateDashboardQueries(queryClient);
    },
  });
}
