import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  DemoSeedResponse,
  DemoResetResponse,
  DemoStatusResponse,
} from '@/types';

/**
 * Hook to get demo data status
 * Returns counts of demo records per collection
 */
export function useDemoStatus() {
  return useQuery({
    queryKey: ['demo', 'status'],
    queryFn: async () => {
      const { data } = await api.get<DemoStatusResponse>('/demo/status');
      return data;
    },
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to seed demo data
 * Creates demo records with isDemo: true across all collections
 */
export function useDemoSeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<DemoSeedResponse>('/demo/seed');
      return data;
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data after seeding
      queryClient.invalidateQueries();
    },
  });
}

/**
 * Hook to reset (delete) demo data
 * Deletes only records with isDemo: true
 */
export function useDemoReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<DemoResetResponse>('/demo/reset');
      return data;
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data after reset
      queryClient.invalidateQueries();
    },
  });
}
