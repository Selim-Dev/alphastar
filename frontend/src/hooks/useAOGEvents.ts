import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AOGEventFilter {
  aircraftId?: string;
  fleetGroup?: string;
  status?: 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  responsibleParty?: string;
}

interface ParentEventListItem {
  _id: string;
  aircraftId: string;
  aircraft?: { _id: string; registration: string; fleetGroup: string };
  detectedAt: string;
  clearedAt: string | null;
  location: string | null;
  notes: string | null;
  totalDowntimeHours: number;
  status: 'active' | 'completed';
  categories: string[];
  subEventCount: number;
  totalTechnicalTime: number;
  totalDepartmentTime: number;
  createdAt: string;
  updatedAt: string;
}

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
  department: 'QC' | 'Engineering' | 'Project Management' | 'Procurement' | 'Technical' | 'MCC' | 'Others';
  sentAt: string;
  returnedAt: string | null;
  notes: string | null;
}

interface ParentEventDetailResponse extends ParentEventListItem {
  subEvents: SubEventResponse[];
}

interface CreateAOGEventDto {
  aircraftId: string;
  detectedAt: string;
  clearedAt?: string;
  location?: string;
  notes?: string;
}

interface UpdateAOGEventDto {
  clearedAt?: string;
  location?: string;
  notes?: string;
}

export function useAOGEvents(filters?: AOGEventFilter) {
  return useQuery({
    queryKey: ['aog-events', filters],
    queryFn: async () => {
      const { data } = await api.get<ParentEventListItem[]>('/aog-events', { params: filters });
      return data;
    },
  });
}

export function useAOGEventById(id: string | null) {
  return useQuery({
    queryKey: ['aog-events', 'detail', id],
    queryFn: async () => {
      const { data } = await api.get<ParentEventDetailResponse>(`/aog-events/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAOGEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateAOGEventDto) => {
      const { data } = await api.post<ParentEventListItem>('/aog-events', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
    },
  });
}

export function useUpdateAOGEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateAOGEventDto & { id: string }) => {
      const { data } = await api.put<ParentEventListItem>(`/aog-events/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
    },
  });
}

export function useDeleteAOGEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/aog-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
    },
  });
}

export function useAOGAnalytics(filters?: AOGEventFilter) {
  return useQuery({
    queryKey: ['aog-analytics', 'responsibility', filters],
    queryFn: async () => {
      const { data } = await api.get<{ responsibleParty: string; totalDowntimeHours: number; eventCount: number }[]>(
        '/aog-events/analytics',
        { params: filters }
      );
      return data;
    },
  });
}
