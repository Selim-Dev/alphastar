import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AnalyticsFilter {
  aircraftId?: string;
  fleetGroup?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

interface AnalyticsSummary {
  totalParentEvents: number;
  activeParentEvents: number;
  completedParentEvents: number;
  totalSubEvents: number;
  totalDowntimeHours: number;
}

interface CategoryBreakdownItem {
  category: 'aog' | 'scheduled' | 'unscheduled';
  subEventCount: number;
  totalDowntimeHours: number;
  percentage: number;
}

interface TimeBreakdown {
  technicalTimeHours: number;
  technicalTimePercentage: number;
  departmentTotals: {
    department: string;
    totalHours: number;
    percentage: number;
  }[];
  grandTotalHours: number;
}

export function useAOGAnalyticsSummary(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: ['aog-analytics', 'summary', filter],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsSummary>('/aog-events/analytics/summary', { params: filter });
      return data;
    },
  });
}

export function useAOGCategoryBreakdown(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: ['aog-analytics', 'category-breakdown', filter],
    queryFn: async () => {
      const { data } = await api.get<CategoryBreakdownItem[]>('/aog-events/analytics/category-breakdown', { params: filter });
      return data;
    },
  });
}

export function useAOGTimeBreakdown(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: ['aog-analytics', 'time-breakdown', filter],
    queryFn: async () => {
      const { data } = await api.get<TimeBreakdown>('/aog-events/analytics/time-breakdown', { params: filter });
      return data;
    },
  });
}

export interface CostBreakdownDepartmentItem {
  department: string;
  internalCost: number;
  externalCost: number;
  totalCost: number;
  entryCount: number;
}

export interface CostBreakdownResponse {
  departments: CostBreakdownDepartmentItem[];
  totals: {
    internalCost: number;
    externalCost: number;
    totalCost: number;
  };
}

export function useAOGCostBreakdown(filter?: AnalyticsFilter) {
  return useQuery({
    queryKey: ['aog-analytics', 'cost-breakdown', filter],
    queryFn: async () => {
      const { data } = await api.get<CostBreakdownResponse>(
        '/aog-events/analytics/cost-breakdown',
        { params: filter },
      );
      return data;
    },
  });
}
