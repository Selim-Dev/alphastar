import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { HealthCheckResponse, SeedTriggerResponse } from '@/types';

export function useHealthCheck() {
  return useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: async () => {
      const { data } = await api.get<HealthCheckResponse>('/dashboard/health');
      return data;
    },
    refetchOnWindowFocus: true,
  });
}

export function useTriggerSeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<SeedTriggerResponse>('/dashboard/seed');
      return data;
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data after seeding
      queryClient.invalidateQueries();
    },
  });
}
