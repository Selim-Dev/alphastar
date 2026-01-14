import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Discrepancy, DateRangeFilter } from '@/types';

interface DiscrepancyFilters extends DateRangeFilter {
  aircraftId?: string;
  ataChapter?: string;
  page?: number;
  limit?: number;
}

export function useDiscrepancies(filters?: DiscrepancyFilters) {
  return useQuery({
    queryKey: ['discrepancies', filters],
    queryFn: async () => {
      const { data } = await api.get<Discrepancy[]>('/discrepancies', { params: filters });
      return data;
    },
  });
}

export function useDiscrepancyAnalytics(query: DateRangeFilter & { aircraftId?: string }) {
  return useQuery({
    queryKey: ['discrepancies', 'analytics', 'ata-chapters', query],
    queryFn: async () => {
      const { data } = await api.get('/discrepancies/analytics/ata-chapters', { params: query });
      return data;
    },
  });
}

export function useTopATAChapters(query: DateRangeFilter & { aircraftId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['discrepancies', 'analytics', 'top-ata-chapters', query],
    queryFn: async () => {
      const { data } = await api.get('/discrepancies/analytics/top-ata-chapters', { params: query });
      return data;
    },
  });
}

export function useUncorrectedCount(aircraftId?: string) {
  return useQuery({
    queryKey: ['discrepancies', 'uncorrected', 'count', aircraftId],
    queryFn: async () => {
      const { data } = await api.get<{ count: number }>('/discrepancies/uncorrected/count', {
        params: aircraftId ? { aircraftId } : undefined,
      });
      return data.count;
    },
  });
}

export function useCreateDiscrepancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (discrepancy: Omit<Discrepancy, '_id' | 'createdAt'>) => {
      const { data } = await api.post<Discrepancy>('/discrepancies', discrepancy);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discrepancies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateDiscrepancy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...discrepancy }: Partial<Discrepancy> & { id: string }) => {
      const { data } = await api.put<Discrepancy>(`/discrepancies/${id}`, discrepancy);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discrepancies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
