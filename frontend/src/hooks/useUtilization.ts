import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DailyCounter, DateRangeFilter } from '@/types';

interface UtilizationFilters extends DateRangeFilter {
  aircraftId?: string;
  page?: number;
  limit?: number;
}

interface AggregationQuery extends DateRangeFilter {
  aircraftId?: string;
  groupBy?: 'day' | 'month' | 'year';
}

export function useUtilization(filters?: UtilizationFilters) {
  return useQuery({
    queryKey: ['utilization', filters],
    queryFn: async () => {
      const { data } = await api.get<DailyCounter[]>('/utilization', { params: filters });
      return data;
    },
  });
}

export function useUtilizationAggregations(query: AggregationQuery) {
  return useQuery({
    queryKey: ['utilization', 'aggregations', query],
    queryFn: async () => {
      const { data } = await api.get('/utilization/aggregations', { params: query });
      return data;
    },
    enabled: !!query.startDate && !!query.endDate,
  });
}

export function useCreateDailyCounter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (counter: Omit<DailyCounter, '_id' | 'createdAt'>) => {
      const { data } = await api.post<DailyCounter>('/utilization', counter);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilization'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
