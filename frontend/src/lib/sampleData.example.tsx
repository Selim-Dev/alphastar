/**
 * Usage Examples for sampleData Utility
 * 
 * This file demonstrates how to use the sampleData utility function
 * in various chart components to optimize performance with large datasets.
 */

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { sampleData } from './sampleData';

// ============================================================================
// Example 1: Monthly Trend Chart with Large Dataset
// ============================================================================

interface MonthlyTrendData {
  month: string;
  eventCount: number;
  totalDowntimeHours: number;
}

function MonthlyTrendChart({ data }: { data: MonthlyTrendData[] }) {
  // Sample data to max 50 points for optimal chart performance
  const sampledData = sampleData(data, 50);

  return (
    <LineChart width={800} height={400} data={sampledData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="eventCount" stroke="#3b82f6" />
      <Line type="monotone" dataKey="totalDowntimeHours" stroke="#ef4444" />
    </LineChart>
  );
}

// ============================================================================
// Example 2: Aircraft Heatmap with Many Data Points
// ============================================================================

interface HeatmapData {
  aircraftId: string;
  month: string;
  downtimeHours: number;
}

function AircraftHeatmap({ data }: { data: HeatmapData[] }) {
  // Sample to 100 points to keep heatmap responsive
  const sampledData = sampleData(data, 100);

  return (
    <div className="grid grid-cols-12 gap-1">
      {sampledData.map((cell, index) => (
        <div
          key={index}
          className="h-8 w-8 rounded"
          style={{
            backgroundColor: getHeatmapColor(cell.downtimeHours),
          }}
          title={`${cell.aircraftId} - ${cell.month}: ${cell.downtimeHours}h`}
        />
      ))}
    </div>
  );
}

function getHeatmapColor(hours: number): string {
  if (hours === 0) return '#dcfce7'; // Light green
  if (hours <= 24) return '#fef3c7'; // Yellow
  if (hours <= 100) return '#fed7aa'; // Orange
  return '#fecaca'; // Red
}

// ============================================================================
// Example 3: Cost Analysis with Daily Data
// ============================================================================

interface CostData {
  date: string;
  internalCost: number;
  externalCost: number;
}

function CostBreakdownChart({ data }: { data: CostData[] }) {
  // For daily data over a year (365 points), sample to 100 for better performance
  const sampledData = sampleData(data, 100);

  return (
    <LineChart width={800} height={400} data={sampledData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="internalCost" stroke="#3b82f6" name="Internal Cost" />
      <Line type="monotone" dataKey="externalCost" stroke="#f59e0b" name="External Cost" />
    </LineChart>
  );
}

// ============================================================================
// Example 4: Conditional Sampling Based on Dataset Size
// ============================================================================

interface TimeSeriesData {
  timestamp: string;
  value: number;
}

function AdaptiveChart({ data }: { data: TimeSeriesData[] }) {
  // Only sample if dataset is large
  const displayData = data.length > 200 ? sampleData(data, 100) : data;

  return (
    <div>
      <p className="text-sm text-gray-600 mb-2">
        Showing {displayData.length} of {data.length} data points
        {displayData.length < data.length && ' (sampled for performance)'}
      </p>
      <LineChart width={800} height={400} data={displayData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis dataKey="value" />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" />
      </LineChart>
    </div>
  );
}

// ============================================================================
// Example 5: Using with useMemo for Performance
// ============================================================================

import { useMemo } from 'react';

function OptimizedChart({ data }: { data: MonthlyTrendData[] }) {
  // Memoize the sampling operation to avoid recalculation on every render
  const sampledData = useMemo(() => sampleData(data, 50), [data]);

  return (
    <LineChart width={800} height={400} data={sampledData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="eventCount" stroke="#3b82f6" />
    </LineChart>
  );
}

// ============================================================================
// Example 6: Multiple Charts with Different Sampling Rates
// ============================================================================

function DashboardWithMultipleCharts({ data }: { data: MonthlyTrendData[] }) {
  // Overview chart: More aggressive sampling
  const overviewData = sampleData(data, 24);
  
  // Detail chart: Less aggressive sampling
  const detailData = sampleData(data, 100);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Overview (Last 2 Years)</h3>
        <LineChart width={800} height={200} data={overviewData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Line type="monotone" dataKey="eventCount" stroke="#3b82f6" />
        </LineChart>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Detailed View</h3>
        <LineChart width={800} height={400} data={detailData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="eventCount" stroke="#3b82f6" />
          <Line type="monotone" dataKey="totalDowntimeHours" stroke="#ef4444" />
        </LineChart>
      </div>
    </div>
  );
}

// ============================================================================
// Best Practices
// ============================================================================

/**
 * BEST PRACTICES FOR USING sampleData:
 * 
 * 1. **Choose Appropriate maxPoints**:
 *    - Line charts: 50-100 points
 *    - Bar charts: 30-50 points
 *    - Heatmaps: 100-200 points
 *    - Sparklines: 20-30 points
 * 
 * 2. **Use with useMemo**:
 *    - Memoize the sampling operation to avoid recalculation
 *    - Only recalculate when the source data changes
 * 
 * 3. **Inform Users**:
 *    - Show a message when data is sampled
 *    - Display "Showing X of Y points"
 * 
 * 4. **Conditional Sampling**:
 *    - Only sample when dataset exceeds a threshold
 *    - Keep small datasets unchanged
 * 
 * 5. **Test Performance**:
 *    - Measure render time with and without sampling
 *    - Adjust maxPoints based on actual performance
 * 
 * 6. **Maintain Data Integrity**:
 *    - Sampling preserves first element
 *    - Maintains overall data distribution
 *    - Does not modify original array
 */

export {
  MonthlyTrendChart,
  AircraftHeatmap,
  CostBreakdownChart,
  AdaptiveChart,
  OptimizedChart,
  DashboardWithMultipleCharts,
};
