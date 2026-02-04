/**
 * DTOs for AOG Analytics Responses
 */

export interface MonthlyTrendDataPoint {
  month: string; // YYYY-MM format
  eventCount: number;
  totalDowntimeHours: number;
  averageDowntimeHours: number;
}

export interface MovingAverageDataPoint {
  month: string;
  value: number;
}

export interface MonthlyTrendResponseDto {
  trends: MonthlyTrendDataPoint[];
  movingAverage: MovingAverageDataPoint[];
}

export interface AutomatedInsight {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  metric?: number;
  recommendation?: string;
}

export interface DataQualityMetrics {
  completenessPercentage: number;
  legacyEventCount: number;
  totalEvents: number;
}

export interface InsightsResponseDto {
  insights: AutomatedInsight[];
  dataQuality: DataQualityMetrics;
}

export interface ForecastDataPoint {
  month: string;
  predicted: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface HistoricalDataPoint {
  month: string;
  actual: number;
}

export interface ForecastResponseDto {
  historical: HistoricalDataPoint[];
  forecast: ForecastDataPoint[];
}

export interface AnalyticsFilterDto {
  aircraftId?: string;
  fleetGroup?: string;
  startDate?: string;
  endDate?: string;
}
