/**
 * Cost Analysis Utilities
 * 
 * Provides utility functions for calculating cost metrics and trends
 * for AOG events analytics.
 */

import { AOGEvent } from '../types';

/**
 * Calculate cost per hour of downtime
 * 
 * @param totalCost - Total cost (internal + external)
 * @param totalDowntimeHours - Total downtime hours
 * @returns Cost per hour, or 0 if no downtime
 */
export function calculateCostPerHour(
  totalCost: number,
  totalDowntimeHours: number
): number {
  if (totalDowntimeHours === 0 || totalDowntimeHours === null || totalDowntimeHours === undefined) {
    return 0;
  }
  
  return Math.round((totalCost / totalDowntimeHours) * 100) / 100;
}

/**
 * Calculate cost per event
 * 
 * @param totalCost - Total cost (internal + external)
 * @param eventCount - Number of events
 * @returns Cost per event, or 0 if no events
 */
export function calculateCostPerEvent(
  totalCost: number,
  eventCount: number
): number {
  if (eventCount === 0 || eventCount === null || eventCount === undefined) {
    return 0;
  }
  
  return Math.round((totalCost / eventCount) * 100) / 100;
}

/**
 * Calculate cost trend from monthly data
 * 
 * @param monthlyData - Array of monthly cost data
 * @returns Array of trend data with month and total cost
 */
export function calculateCostTrend(
  monthlyData: Array<{
    month: string;
    internalCost: number;
    externalCost: number;
  }>
): Array<{
  month: string;
  internalCost: number;
  externalCost: number;
  totalCost: number;
}> {
  return monthlyData.map(item => ({
    month: item.month,
    internalCost: item.internalCost || 0,
    externalCost: item.externalCost || 0,
    totalCost: (item.internalCost || 0) + (item.externalCost || 0),
  }));
}

/**
 * Aggregate costs by month from AOG events
 * 
 * @param events - Array of AOG events
 * @returns Array of monthly cost aggregations
 */
export function aggregateCostsByMonth(
  events: AOGEvent[]
): Array<{
  month: string;
  internalCost: number;
  externalCost: number;
  totalCost: number;
  eventCount: number;
}> {
  const monthlyMap = new Map<string, {
    internalCost: number;
    externalCost: number;
    eventCount: number;
  }>();
  
  events.forEach(event => {
    // Extract month from detectedAt (YYYY-MM format)
    const date = new Date(event.detectedAt);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = monthlyMap.get(month) || {
      internalCost: 0,
      externalCost: 0,
      eventCount: 0,
    };
    
    monthlyMap.set(month, {
      internalCost: existing.internalCost + (event.internalCost || 0),
      externalCost: existing.externalCost + (event.externalCost || 0),
      eventCount: existing.eventCount + 1,
    });
  });
  
  // Convert map to sorted array
  return Array.from(monthlyMap.entries())
    .map(([month, data]) => ({
      month,
      internalCost: Math.round(data.internalCost * 100) / 100,
      externalCost: Math.round(data.externalCost * 100) / 100,
      totalCost: Math.round((data.internalCost + data.externalCost) * 100) / 100,
      eventCount: data.eventCount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate total costs from events
 * 
 * @param events - Array of AOG events
 * @returns Object with total internal, external, and combined costs
 */
export function calculateTotalCosts(
  events: AOGEvent[]
): {
  totalInternalCost: number;
  totalExternalCost: number;
  totalCost: number;
} {
  const totals = events.reduce(
    (acc, event) => ({
      totalInternalCost: acc.totalInternalCost + (event.internalCost || 0),
      totalExternalCost: acc.totalExternalCost + (event.externalCost || 0),
    }),
    { totalInternalCost: 0, totalExternalCost: 0 }
  );
  
  return {
    totalInternalCost: Math.round(totals.totalInternalCost * 100) / 100,
    totalExternalCost: Math.round(totals.totalExternalCost * 100) / 100,
    totalCost: Math.round((totals.totalInternalCost + totals.totalExternalCost) * 100) / 100,
  };
}

/**
 * Calculate cost efficiency delta (comparison between two periods)
 * 
 * @param currentValue - Current period value
 * @param previousValue - Previous period value
 * @returns Percentage change (positive = increase, negative = decrease)
 */
export function calculateCostDelta(
  currentValue: number,
  previousValue: number
): number | null {
  if (previousValue === 0 || previousValue === null || previousValue === undefined) {
    return null;
  }
  
  const delta = ((currentValue - previousValue) / previousValue) * 100;
  return Math.round(delta * 10) / 10;
}

/**
 * Format currency value as USD
 * 
 * @param value - Numeric value
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Get last N months of cost data
 * 
 * @param monthlyData - Array of monthly cost data
 * @param months - Number of months to retrieve (default: 12)
 * @returns Last N months of data
 */
export function getLastNMonths<T extends { month: string }>(
  monthlyData: T[],
  months: number = 12
): T[] {
  return monthlyData.slice(-months);
}
