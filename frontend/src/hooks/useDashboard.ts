import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DashboardKPIs, DashboardTrends, DateRangeFilter } from '@/types';

// Auto-refresh interval for dashboard data (30 seconds)
const DASHBOARD_REFETCH_INTERVAL = 30 * 1000;

export interface DashboardQueryParams extends DateRangeFilter {
  period?: 'day' | 'month' | 'year';
}

export interface AOGSummaryEvent {
  id: string;
  aircraftId: string;
  registration: string;
  reasonCode: string;
  location: string | null;
  durationHours: number;
  detectedAt: string;
}

export interface AOGSummaryTrendPoint {
  month: string;
  count: number;
}

export interface AOGSummary {
  activeCount: number;
  totalThisMonth: number;
  avgDurationHours: number;
  totalDowntimeHours: number;
  activeEvents: AOGSummaryEvent[];
  unavailableAircraft: {
    registration: string;
    reason: string;
    durationDays: number;
  }[];
  trendData: AOGSummaryTrendPoint[];
}

export function useDashboardKPIs(query?: DateRangeFilter) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', query],
    queryFn: async () => {
      const { data } = await api.get<DashboardKPIs>('/dashboard/kpis', { params: query });
      return data;
    },
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

export function useDashboardTrends(query: DashboardQueryParams) {
  return useQuery({
    queryKey: ['dashboard', 'trends', query],
    queryFn: async () => {
      const { data } = await api.get<DashboardTrends>('/dashboard/trends', { params: query });
      return data;
    },
    enabled: !!query.startDate && !!query.endDate,
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}

export function useAOGSummary() {
  return useQuery({
    queryKey: ['dashboard', 'aog-summary'],
    queryFn: async () => {
      const { data } = await api.get<AOGSummary>('/dashboard/aog-summary');
      return data;
    },
    refetchInterval: DASHBOARD_REFETCH_INTERVAL,
    refetchOnWindowFocus: true,
  });
}
