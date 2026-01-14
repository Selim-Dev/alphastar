import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Aircraft, PaginatedResponse } from '@/types';

interface AircraftFilters {
  fleetGroup?: string;
  aircraftType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function useAircraft(filters?: AircraftFilters) {
  return useQuery({
    queryKey: ['aircraft', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Aircraft>>('/aircraft', { params: filters });
      return data;
    },
  });
}

export function useAircraftById(id: string) {
  return useQuery({
    queryKey: ['aircraft', id],
    queryFn: async () => {
      const { data } = await api.get<Aircraft>(`/aircraft/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAircraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (aircraft: Omit<Aircraft, '_id' | 'createdAt' | 'updatedAt'>) => {
      const { data } = await api.post<Aircraft>('/aircraft', aircraft);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
}

export function useUpdateAircraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...aircraft }: Partial<Aircraft> & { id: string }) => {
      const { data } = await api.put<Aircraft>(`/aircraft/${id}`, aircraft);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
      queryClient.invalidateQueries({ queryKey: ['aircraft', variables.id] });
    },
  });
}

export function useDeleteAircraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/aircraft/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft'] });
    },
  });
}
