import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  FleetHealthScore,
  AlertsResponse,
  PeriodComparison,
  FleetComparisonResponse,
  MaintenanceForecastResponse,
  RecentActivityResponse,
  YoYComparisonResponse,
  DefectPatternsResponse,
  DataQualityResponse,
  WorkOrderCountTrendResponse,
} from '@/types';

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Fleet Health Score
export function useFleetHealthScore(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'health-score', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      const response = await api.get<FleetHealthScore>(`/dashboard/health-score${query ? `?${query}` : ''}`);
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Executive Alerts
export function useExecutiveAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const response = await api.get<AlertsResponse>('/dashboard/alerts');
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds - alerts should refresh more frequently
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
}

// Period Comparison
export function usePeriodComparison(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'period-comparison', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      const response = await api.get<PeriodComparison>(`/dashboard/period-comparison${query ? `?${query}` : ''}`);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// Fleet Comparison
export function useFleetComparison(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'fleet-comparison', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      const response = await api.get<FleetComparisonResponse>(`/dashboard/fleet-comparison${query ? `?${query}` : ''}`);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}


// Maintenance Forecast
export function useMaintenanceForecast() {
  return useQuery({
    queryKey: ['dashboard', 'maintenance-forecast'],
    queryFn: async () => {
      const response = await api.get<MaintenanceForecastResponse>('/dashboard/maintenance-forecast');
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// Recent Activity
export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const response = await api.get<RecentActivityResponse>('/dashboard/recent-activity');
      return response.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

// Year-over-Year Comparison
export function useYoYComparison(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'yoy-comparison', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      const response = await api.get<YoYComparisonResponse>(`/dashboard/yoy-comparison${query ? `?${query}` : ''}`);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// Defect Patterns
export function useDefectPatterns(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'defect-patterns', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      const response = await api.get<DefectPatternsResponse>(`/dashboard/defect-patterns${query ? `?${query}` : ''}`);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}

// Data Quality
export function useDataQuality() {
  return useQuery({
    queryKey: ['dashboard', 'data-quality'],
    queryFn: async () => {
      const response = await api.get<DataQualityResponse>('/dashboard/data-quality');
      return response.data;
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

// Work Order Count Trend (Requirements 14.2)
export function useWorkOrderCountTrend(params?: DateRangeParams) {
  return useQuery({
    queryKey: ['dashboard', 'work-order-trend', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      const query = searchParams.toString();
      const response = await api.get<WorkOrderCountTrendResponse>(`/dashboard/work-order-trend${query ? `?${query}` : ''}`);
      return response.data;
    },
    staleTime: 60 * 1000,
  });
}
