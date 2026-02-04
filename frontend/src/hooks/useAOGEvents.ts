import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AOGEvent,
  DateRangeFilter,
  CreateTransitionDto,
  CreatePartRequestDto,
  UpdatePartRequestDto,
  AOGStagesAnalyticsResponse,
  AOGBottlenecksAnalyticsResponse,
  AOGWorkflowStatus,
  BlockingReason,
  ThreeBucketAnalytics,
  ThreeBucketAnalyticsFilter,
  MonthlyTrendResponseDto,
  ForecastData,
  InsightsResponseDto,
  DataQualityMetrics,
  AnalyticsFilters,
} from '@/types';

interface AOGFilters extends DateRangeFilter {
  aircraftId?: string;
  fleetGroup?: string;
  responsibleParty?: string;
  category?: string;
  currentStatus?: AOGWorkflowStatus;
  blockingReason?: BlockingReason;
  page?: number;
  limit?: number;
}

export function useAOGEvents(filters?: AOGFilters) {
  return useQuery({
    queryKey: ['aog-events', filters],
    queryFn: async () => {
      const { data } = await api.get<AOGEvent[]>('/aog-events', { params: filters });
      return data;
    },
  });
}

export function useAOGEventById(id: string | null) {
  return useQuery({
    queryKey: ['aog-events', 'single', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<AOGEvent>(`/aog-events/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAOGAnalytics(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/downtime-by-responsibility', { params: query });
      return data;
    },
  });
}

/**
 * Hook for fetching three-bucket downtime analytics
 * 
 * Fetches aggregated downtime metrics broken down into:
 * - Technical Time: Troubleshooting + Installation
 * - Procurement Time: Waiting for parts
 * - Ops Time: Operational testing
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function useThreeBucketAnalytics(filter: ThreeBucketAnalyticsFilter) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'buckets', filter],
    queryFn: async () => {
      const { data } = await api.get<ThreeBucketAnalytics>(
        '/aog-events/analytics/buckets',
        { params: filter }
      );
      return data;
    },
  });
}

/**
 * Hook for fetching category breakdown analytics
 * Requirements: 8.1, 16.4
 */
export function useCategoryBreakdown(query: AnalyticsFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'category-breakdown', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/category-breakdown', { params: query });
      return data;
    },
    ...options,
  });
}

/**
 * Hook for fetching location heatmap analytics
 * Requirements: 8.2, 16.3
 */
export function useLocationHeatmap(query: AnalyticsFilters & { limit?: number }) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'location-heatmap', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/location-heatmap', { params: query });
      return data;
    },
  });
}

/**
 * Hook for fetching duration distribution analytics
 * Requirements: 8.3, 6.5
 */
export function useDurationDistribution(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'duration-distribution', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/duration-distribution', { params: query });
      return data;
    },
  });
}

/**
 * Hook for fetching aircraft reliability ranking
 * Requirements: 8.4, 16.1
 */
export function useAircraftReliability(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'aircraft-reliability', query],
    queryFn: async () => {
      const { data } = await api.get('/aog-events/analytics/aircraft-reliability', { params: query });
      return data;
    },
  });
}

/**
 * Hook for fetching monthly trend analytics
 * Requirements: 8.5, 16.5, FR-2.2
 */
export function useMonthlyTrend(query: AnalyticsFilters, options?: { enabled?: boolean }) {
  return useQuery<MonthlyTrendResponseDto>({
    queryKey: ['aog-events', 'analytics', 'monthly-trend', query],
    queryFn: async () => {
      const { data } = await api.get<MonthlyTrendResponseDto>('/aog-events/analytics/monthly-trend', { params: query });
      return data;
    },
    ...options,
  });
}

/**
 * Hook for fetching forecast data with linear regression
 * 
 * Fetches predictive analytics showing:
 * - Historical downtime data (last 12 months)
 * - 3-month forecast with confidence intervals
 * - Linear regression trend line
 * 
 * Requirements: FR-2.6
 */
export function useForecast(query: AnalyticsFilters, options?: { enabled?: boolean }) {
  return useQuery<ForecastData>({
    queryKey: ['aog-events', 'analytics', 'forecast', query],
    queryFn: async () => {
      const { data } = await api.get<ForecastData>('/aog-events/analytics/forecast', { params: query });
      return data;
    },
    ...options,
  });
}

/**
 * Hook for fetching auto-generated insights
 * 
 * Fetches automated insights including:
 * - Procurement bottleneck detection
 * - Recurring issue identification
 * - Cost spike alerts
 * - Improving trend recognition
 * - Data quality assessment
 * - High-risk aircraft identification
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, FR-2.6
 */
export function useInsights(query: AnalyticsFilters, options?: { enabled?: boolean }) {
  return useQuery<InsightsResponseDto>({
    queryKey: ['aog-events', 'analytics', 'insights', query],
    queryFn: async () => {
      const { data } = await api.get<InsightsResponseDto>('/aog-events/analytics/insights', { params: query });
      return data;
    },
    ...options,
  });
}

/**
 * Hook for fetching data quality metrics
 * 
 * Extracts data quality information from insights response:
 * - Total events count
 * - Events with milestone timestamps
 * - Completeness percentage
 * - Legacy event count
 * 
 * Requirements: FR-1.3
 */
export function useDataQuality(query: AnalyticsFilters) {
  return useQuery<DataQualityMetrics>({
    queryKey: ['aog-events', 'analytics', 'data-quality', query],
    queryFn: async () => {
      const { data } = await api.get<InsightsResponseDto>('/aog-events/analytics/insights', { params: query });
      return data.dataQuality;
    },
  });
}

/**
 * Hook for fetching AOG stage breakdown analytics
 * Requirements: 3.4, 7.5
 */
export function useAOGStagesAnalytics(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'stages', query],
    queryFn: async () => {
      const { data } = await api.get<AOGStagesAnalyticsResponse>(
        '/aog-events/analytics/stages',
        { params: query }
      );
      return data;
    },
  });
}

/**
 * Hook for fetching AOG bottleneck analytics
 * Requirements: 3.5, 7.6
 */
export function useAOGBottlenecksAnalytics(query: AnalyticsFilters) {
  return useQuery({
    queryKey: ['aog-events', 'analytics', 'bottlenecks', query],
    queryFn: async () => {
      const { data } = await api.get<AOGBottlenecksAnalyticsResponse>(
        '/aog-events/analytics/bottlenecks',
        { params: query }
      );
      return data;
    },
  });
}

/**
 * Hook for fetching status history of an AOG event
 * DEPRECATED: Status history is now included in the AOG event data via useAOGEventById
 * Milestone history is stored in the milestoneHistory field
 * This hook is kept for backward compatibility but should not be used
 */
export function useAOGStatusHistory(id: string | null) {
  return useQuery({
    queryKey: ['aog-events', 'history', id],
    queryFn: async () => {
      if (!id) return [];
      // Return empty array - milestone history is now in the event data
      return [];
    },
    enabled: false, // Disabled - data is in the event
  });
}

export function useCreateAOGEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<AOGEvent, '_id' | 'createdAt'>) => {
      const { data} = await api.post<AOGEvent>('/aog-events', event);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateAOGEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...event }: Partial<AOGEvent> & { id: string }) => {
      const { data } = await api.put<AOGEvent>(`/aog-events/${id}`, event);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook for transitioning AOG event status
 * Requirements: 7.1
 */
export function useTransitionAOGStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      transition,
    }: {
      id: string;
      transition: CreateTransitionDto;
    }) => {
      const { data } = await api.post<AOGEvent>(
        `/aog-events/${id}/transitions`,
        transition
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['aog-events', 'single', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['aog-events', 'history', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['aog-events', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook for adding a part request to an AOG event
 * Requirements: 7.3
 */
export function useAddPartRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      partRequest,
    }: {
      id: string;
      partRequest: CreatePartRequestDto;
    }) => {
      const { data } = await api.post<AOGEvent>(
        `/aog-events/${id}/parts`,
        partRequest
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['aog-events', 'single', variables.id] });
    },
  });
}

/**
 * Hook for updating a part request within an AOG event
 * Requirements: 7.4
 */
export function useUpdatePartRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      partId,
      updates,
    }: {
      id: string;
      partId: string;
      updates: UpdatePartRequestDto;
    }) => {
      const { data } = await api.put<AOGEvent>(
        `/aog-events/${id}/parts/${partId}`,
        updates
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['aog-events', 'single', variables.id] });
    },
  });
}

/**
 * Hook for generating ActualSpend from AOG costs
 * Requirements: 5.4, 20.2
 */
export function useGenerateAOGSpend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      budgetClauseId,
      budgetPeriod,
      notes,
    }: {
      id: string;
      budgetClauseId: number;
      budgetPeriod: string;
      notes?: string;
    }) => {
      const { data } = await api.post<AOGEvent>(
        `/aog-events/${id}/costs/generate-spend`,
        { budgetClauseId, budgetPeriod, notes }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['aog-events', 'single', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      queryClient.invalidateQueries({ queryKey: ['actual-spend'] });
    },
  });
}

/**
 * Hook for updating budget integration fields on an AOG event
 * Requirements: 20.1
 */
export function useUpdateAOGBudgetIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      budgetClauseId,
      budgetPeriod,
      isBudgetAffecting,
    }: {
      id: string;
      budgetClauseId?: number;
      budgetPeriod?: string;
      isBudgetAffecting?: boolean;
    }) => {
      const { data } = await api.put<AOGEvent>(
        `/aog-events/${id}/budget`,
        { budgetClauseId, budgetPeriod, isBudgetAffecting }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['aog-events', 'single', variables.id] });
    },
  });
}
