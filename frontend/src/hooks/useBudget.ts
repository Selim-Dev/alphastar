import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BudgetPlan, ActualSpend } from '@/types';

interface BudgetFilters {
  fiscalYear?: number;
  clauseId?: number;
  aircraftGroup?: string;
}

interface BudgetAnalyticsQuery {
  fiscalYear?: number;
  clauseId?: number;
  aircraftGroup?: string;
}

export interface BudgetVarianceResult {
  clauseId: number;
  clauseDescription: string;
  aircraftGroup: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  remainingBudget: number;
  utilizationPercentage: number;
}

export interface BurnRateResult {
  fiscalYear: number;
  aircraftGroup?: string;
  totalPlanned: number;
  totalSpent: number;
  monthsWithData: number;
  averageMonthlySpend: number;
  remainingBudget: number;
  projectedMonthsRemaining: number;
}

export interface SpendByPeriod {
  period: string;
  totalAmount: number;
}

export interface SpendByGroup {
  aircraftGroup: string;
  totalAmount: number;
}

export interface CloneBudgetPlanRequest {
  sourceYear: number;
  targetYear: number;
  adjustmentPercentage?: number;
}

export interface CloneBudgetPlanResponse {
  clonedCount: number;
  skippedCount: number;
  sourceYear: number;
  targetYear: number;
  adjustmentPercentage: number;
}

export function useBudgetPlans(filters?: BudgetFilters) {
  return useQuery({
    queryKey: ['budget-plans', filters],
    queryFn: async () => {
      const { data } = await api.get<BudgetPlan[]>('/budget/plans', { params: filters });
      return data;
    },
  });
}

export function useActualSpend(filters?: BudgetFilters & { period?: string; startPeriod?: string; endPeriod?: string }) {
  return useQuery({
    queryKey: ['actual-spend', filters],
    queryFn: async () => {
      const { data } = await api.get<ActualSpend[]>('/budget/actual-spend', { params: filters });
      return data;
    },
  });
}

export function useBudgetVariance(query: BudgetAnalyticsQuery) {
  return useQuery({
    queryKey: ['budget', 'variance', query],
    queryFn: async () => {
      const { data } = await api.get<BudgetVarianceResult[]>('/budget/analytics/variance', { params: query });
      return data;
    },
  });
}

export function useBurnRate(query: { fiscalYear?: number; aircraftGroup?: string }) {
  return useQuery({
    queryKey: ['budget', 'burn-rate', query],
    queryFn: async () => {
      const { data } = await api.get<BurnRateResult>('/budget/analytics/burn-rate', { params: query });
      return data;
    },
  });
}

export function useSpendByPeriod(query: { startPeriod?: string; endPeriod?: string; aircraftGroup?: string }) {
  return useQuery({
    queryKey: ['budget', 'spend-by-period', query],
    queryFn: async () => {
      const { data } = await api.get<SpendByPeriod[]>('/budget/analytics/spend-by-period', { params: query });
      return data;
    },
  });
}

export function useSpendByAircraftGroup(query: { fiscalYear?: number }) {
  return useQuery({
    queryKey: ['budget', 'spend-by-group', query],
    queryFn: async () => {
      const { data } = await api.get<SpendByGroup[]>('/budget/analytics/spend-by-group', { params: query });
      return data;
    },
  });
}

export function useDistinctClauses(fiscalYear?: number) {
  return useQuery({
    queryKey: ['budget', 'clauses', fiscalYear],
    queryFn: async () => {
      const { data } = await api.get<{ clauses: { clauseId: number; clauseDescription: string }[] }>('/budget/plans/clauses', { params: { fiscalYear } });
      return data.clauses;
    },
  });
}

export function useDistinctAircraftGroups(fiscalYear?: number) {
  return useQuery({
    queryKey: ['budget', 'aircraft-groups', fiscalYear],
    queryFn: async () => {
      const { data } = await api.get<{ aircraftGroups: string[] }>('/budget/plans/aircraft-groups', { params: { fiscalYear } });
      return data.aircraftGroups;
    },
  });
}

export function useCreateBudgetPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<BudgetPlan, '_id' | 'createdAt'>) => {
      const { data } = await api.post<BudgetPlan>('/budget/plans', plan);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-plans'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useCreateActualSpend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (spend: Omit<ActualSpend, '_id' | 'createdAt'>) => {
      const { data } = await api.post<ActualSpend>('/budget/actual-spend', spend);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actual-spend'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}

export function useAvailableBudgetYears() {
  return useQuery({
    queryKey: ['budget', 'available-years'],
    queryFn: async () => {
      const { data } = await api.get<{ years: number[] }>('/budget/plans/available-years');
      return data.years;
    },
  });
}

export function useCloneBudgetPlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CloneBudgetPlanRequest) => {
      const { data } = await api.post<CloneBudgetPlanResponse>('/budget/plans/clone', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-plans'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
    },
  });
}
