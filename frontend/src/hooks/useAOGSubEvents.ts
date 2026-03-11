import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SubEventResponse {
  _id: string;
  parentEventId: string;
  category: 'aog' | 'scheduled' | 'unscheduled';
  reasonCode: string;
  actionTaken: string;
  detectedAt: string;
  clearedAt: string | null;
  manpowerCount: number;
  manHours: number;
  departmentHandoffs: DepartmentHandoffResponse[];
  technicalTimeHours: number;
  departmentTimeHours: number;
  departmentTimeTotals: Record<string, number>;
  totalDowntimeHours: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentHandoffResponse {
  _id: string;
  department: 'QC' | 'Engineering' | 'Project Management' | 'Procurement' | 'Others';
  sentAt: string;
  returnedAt: string | null;
  notes: string | null;
}

interface CreateSubEventDto {
  category: 'aog' | 'scheduled' | 'unscheduled';
  reasonCode: string;
  actionTaken: string;
  detectedAt: string;
  clearedAt?: string;
  manpowerCount: number;
  manHours: number;
  departmentHandoffs?: CreateHandoffDto[];
  notes?: string;
}

interface UpdateSubEventDto {
  category?: 'aog' | 'scheduled' | 'unscheduled';
  reasonCode?: string;
  actionTaken?: string;
  detectedAt?: string;
  clearedAt?: string;
  manpowerCount?: number;
  manHours?: number;
  notes?: string;
}

interface CreateHandoffDto {
  department: 'QC' | 'Engineering' | 'Project Management' | 'Procurement' | 'Others';
  sentAt: string;
  returnedAt?: string;
  notes?: string;
}

interface UpdateHandoffDto {
  department?: 'QC' | 'Engineering' | 'Project Management' | 'Procurement' | 'Others';
  sentAt?: string;
  returnedAt?: string;
  notes?: string;
}

export function useSubEvents(parentId: string | null) {
  return useQuery({
    queryKey: ['sub-events', parentId],
    queryFn: async () => {
      const { data } = await api.get<SubEventResponse[]>(`/aog-events/${parentId}/sub-events`);
      return data;
    },
    enabled: !!parentId,
  });
}

export function useCreateSubEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, data: dto }: { parentId: string; data: CreateSubEventDto }) => {
      const { data } = await api.post<SubEventResponse>(`/aog-events/${parentId}/sub-events`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['sub-events', variables.parentId] });
    },
  });
}

export function useUpdateSubEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, subId, data: dto }: { parentId: string; subId: string; data: UpdateSubEventDto }) => {
      const { data } = await api.put<SubEventResponse>(`/aog-events/${parentId}/sub-events/${subId}`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['sub-events', variables.parentId] });
    },
  });
}

export function useDeleteSubEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, subId }: { parentId: string; subId: string }) => {
      await api.delete(`/aog-events/${parentId}/sub-events/${subId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['sub-events', variables.parentId] });
    },
  });
}

export function useAddHandoff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, subId, data: dto }: { parentId: string; subId: string; data: CreateHandoffDto }) => {
      const { data } = await api.post<SubEventResponse>(`/aog-events/${parentId}/sub-events/${subId}/handoffs`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['sub-events', variables.parentId] });
    },
  });
}

export function useUpdateHandoff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, subId, handoffId, data: dto }: { parentId: string; subId: string; handoffId: string; data: UpdateHandoffDto }) => {
      const { data } = await api.put<SubEventResponse>(`/aog-events/${parentId}/sub-events/${subId}/handoffs/${handoffId}`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['sub-events', variables.parentId] });
    },
  });
}

export function useRemoveHandoff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, subId, handoffId }: { parentId: string; subId: string; handoffId: string }) => {
      const { data } = await api.delete<SubEventResponse>(`/aog-events/${parentId}/sub-events/${subId}/handoffs/${handoffId}`);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['sub-events', variables.parentId] });
    },
  });
}
