import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type CostEntryDepartment =
  | 'QC'
  | 'Engineering'
  | 'Project Management'
  | 'Procurement'
  | 'Technical'
  | 'Others';

export interface CostEntryResponse {
  _id: string;
  parentEventId: string;
  department: CostEntryDepartment;
  internalCost: number;
  externalCost: number;
  note: string | null;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateCostEntryDto {
  department: CostEntryDepartment;
  internalCost: number;
  externalCost: number;
  note?: string;
}

interface UpdateCostEntryDto {
  department?: CostEntryDepartment;
  internalCost?: number;
  externalCost?: number;
  note?: string;
}

export function useCostEntries(parentId: string | null) {
  return useQuery({
    queryKey: ['cost-entries', parentId],
    queryFn: async () => {
      const { data } = await api.get<CostEntryResponse[]>(
        `/aog-events/${parentId}/cost-entries`,
      );
      return data;
    },
    enabled: !!parentId,
  });
}

export function useCreateCostEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      data: dto,
    }: {
      parentId: string;
      data: CreateCostEntryDto;
    }) => {
      const { data } = await api.post<CostEntryResponse>(
        `/aog-events/${parentId}/cost-entries`,
        dto,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cost-entries', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['aog-analytics'] });
    },
  });
}

export function useUpdateCostEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      entryId,
      data: dto,
    }: {
      parentId: string;
      entryId: string;
      data: UpdateCostEntryDto;
    }) => {
      const { data } = await api.put<CostEntryResponse>(
        `/aog-events/${parentId}/cost-entries/${entryId}`,
        dto,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cost-entries', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['aog-analytics'] });
    },
  });
}

export function useDeleteCostEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      entryId,
    }: {
      parentId: string;
      entryId: string;
    }) => {
      await api.delete(`/aog-events/${parentId}/cost-entries/${entryId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cost-entries', variables.parentId] });
      queryClient.invalidateQueries({ queryKey: ['aog-analytics'] });
    },
  });
}
