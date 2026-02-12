import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  BudgetKPIs,
  MonthlySpendData,
  CumulativeData,
  DistributionData,
  AircraftTypeData,
  OverspendTerm,
  HeatmapData,
  AnalyticsFilters,
} from '@/types/budget-projects';

/**
 * Custom hook for budget analytics queries
 * Provides queries for KPIs, charts, and visualizations
 * @param projectId - Budget project ID
 */
export function useBudgetAnalytics(projectId: string) {
  /**
   * Query to fetch KPI summary with optional filters
   * @param filters - Optional filters for date range, aircraft type, term search
   */
  const useKPIs = (filters?: AnalyticsFilters) => {
    return useQuery({
      queryKey: ['budget-analytics', projectId, 'kpis', filters],
      queryFn: async () => {
        const { data } = await api.get<BudgetKPIs>(
          `/budget-analytics/${projectId}/kpis`,
          {
            params: filters,
          }
        );
        return data;
      },
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000, // 5 minutes - analytics can be slightly stale
    });
  };

  /**
   * Query to fetch monthly spend by term (stacked bar chart data)
   * @param filters - Optional filters for date range, aircraft type, term search
   */
  const useMonthlySpend = (filters?: AnalyticsFilters) => {
    return useQuery({
      queryKey: ['budget-analytics', projectId, 'monthly-spend', filters],
      queryFn: async () => {
        const { data } = await api.get<MonthlySpendData[]>(
          `/budget-analytics/${projectId}/monthly-spend`,
          {
            params: filters,
          }
        );
        return data;
      },
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Query to fetch cumulative spend vs budget (line chart data)
   */
  const useCumulativeSpend = () => {
    return useQuery({
      queryKey: ['budget-analytics', projectId, 'cumulative-spend'],
      queryFn: async () => {
        const { data } = await api.get<CumulativeData[]>(
          `/budget-analytics/${projectId}/cumulative-spend`
        );
        return data;
      },
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Query to fetch spend distribution by category (donut/pie chart data)
   * @param filters - Optional filters for date range, aircraft type, term search
   */
  const useSpendDistribution = (filters?: AnalyticsFilters) => {
    return useQuery({
      queryKey: ['budget-analytics', projectId, 'spend-distribution', filters],
      queryFn: async () => {
        const { data } = await api.get<DistributionData[]>(
          `/budget-analytics/${projectId}/spend-distribution`,
          {
            params: filters,
          }
        );
        return data;
      },
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Query to fetch budgeted vs spent by aircraft type (grouped bar chart data)
   */
  const useBudgetedVsSpent = () => {
    return useQuery({
      queryKey: ['budget-analytics', projectId, 'budgeted-vs-spent'],
      queryFn: async () => {
        const { data } = await api.get<AircraftTypeData[]>(
          `/budget-analytics/${projectId}/budgeted-vs-spent`
        );
        return data;
      },
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Query to fetch top 5 overspend terms (ranked list data)
   */
  const useTop5Overspend = () => {
    return useQuery({
      queryKey: ['budget-analytics', projectId, 'top-overspend'],
      queryFn: async () => {
        const { data } = await api.get<OverspendTerm[]>(
          `/budget-analytics/${projectId}/top-overspend`
        );
        return data;
      },
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  /**
   * Query to fetch spending heatmap (optional grid heatmap data)
   */
  const useHeatmap = () => {
    return useQuery({
      queryKey: ['budget-analytics', projectId, 'heatmap'],
      queryFn: async () => {
        const { data } = await api.get<HeatmapData>(
          `/budget-analytics/${projectId}/heatmap`
        );
        return data;
      },
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    useKPIs,
    useMonthlySpend,
    useCumulativeSpend,
    useSpendDistribution,
    useBudgetedVsSpent,
    useTop5Overspend,
    useHeatmap,
  };
}
