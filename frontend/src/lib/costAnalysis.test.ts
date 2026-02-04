import { describe, it, expect } from 'vitest';
import {
  calculateCostPerHour,
  calculateCostPerEvent,
  calculateCostTrend,
  aggregateCostsByMonth,
  calculateTotalCosts,
  calculateCostDelta,
  formatCurrency,
  getLastNMonths,
} from './costAnalysis';
import { AOGEvent } from '../types';

describe('costAnalysis utilities', () => {
  describe('calculateCostPerHour', () => {
    it('should calculate cost per hour correctly', () => {
      expect(calculateCostPerHour(10000, 100)).toBe(100);
      expect(calculateCostPerHour(5000, 50)).toBe(100);
      expect(calculateCostPerHour(1234.56, 10)).toBe(123.46);
    });

    it('should handle division by zero', () => {
      expect(calculateCostPerHour(10000, 0)).toBe(0);
    });

    it('should handle null/undefined downtime', () => {
      expect(calculateCostPerHour(10000, null as any)).toBe(0);
      expect(calculateCostPerHour(10000, undefined as any)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateCostPerHour(100, 3)).toBe(33.33);
    });
  });

  describe('calculateCostPerEvent', () => {
    it('should calculate cost per event correctly', () => {
      expect(calculateCostPerEvent(10000, 10)).toBe(1000);
      expect(calculateCostPerEvent(5000, 5)).toBe(1000);
      expect(calculateCostPerEvent(1234.56, 10)).toBe(123.46);
    });

    it('should handle division by zero', () => {
      expect(calculateCostPerEvent(10000, 0)).toBe(0);
    });

    it('should handle null/undefined event count', () => {
      expect(calculateCostPerEvent(10000, null as any)).toBe(0);
      expect(calculateCostPerEvent(10000, undefined as any)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateCostPerEvent(100, 3)).toBe(33.33);
    });
  });

  describe('calculateCostTrend', () => {
    it('should calculate total cost for each month', () => {
      const monthlyData = [
        { month: '2025-01', internalCost: 5000, externalCost: 3000 },
        { month: '2025-02', internalCost: 6000, externalCost: 4000 },
      ];

      const result = calculateCostTrend(monthlyData);

      expect(result).toEqual([
        { month: '2025-01', internalCost: 5000, externalCost: 3000, totalCost: 8000 },
        { month: '2025-02', internalCost: 6000, externalCost: 4000, totalCost: 10000 },
      ]);
    });

    it('should handle missing cost values', () => {
      const monthlyData = [
        { month: '2025-01', internalCost: 5000, externalCost: 0 },
        { month: '2025-02', internalCost: 0, externalCost: 4000 },
      ];

      const result = calculateCostTrend(monthlyData);

      expect(result[0].totalCost).toBe(5000);
      expect(result[1].totalCost).toBe(4000);
    });
  });

  describe('aggregateCostsByMonth', () => {
    it('should aggregate costs by month', () => {
      const events: Partial<AOGEvent>[] = [
        {
          detectedAt: '2025-01-15T10:00:00Z',
          internalCost: 5000,
          externalCost: 3000,
        },
        {
          detectedAt: '2025-01-20T10:00:00Z',
          internalCost: 2000,
          externalCost: 1000,
        },
        {
          detectedAt: '2025-02-10T10:00:00Z',
          internalCost: 6000,
          externalCost: 4000,
        },
      ];

      const result = aggregateCostsByMonth(events as AOGEvent[]);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        month: '2025-01',
        internalCost: 7000,
        externalCost: 4000,
        totalCost: 11000,
        eventCount: 2,
      });
      expect(result[1]).toEqual({
        month: '2025-02',
        internalCost: 6000,
        externalCost: 4000,
        totalCost: 10000,
        eventCount: 1,
      });
    });

    it('should handle events with missing costs', () => {
      const events: Partial<AOGEvent>[] = [
        {
          detectedAt: '2025-01-15T10:00:00Z',
          internalCost: 5000,
        },
        {
          detectedAt: '2025-01-20T10:00:00Z',
          externalCost: 3000,
        },
      ];

      const result = aggregateCostsByMonth(events as AOGEvent[]);

      expect(result[0]).toEqual({
        month: '2025-01',
        internalCost: 5000,
        externalCost: 3000,
        totalCost: 8000,
        eventCount: 2,
      });
    });

    it('should sort results by month', () => {
      const events: Partial<AOGEvent>[] = [
        { detectedAt: '2025-03-15T10:00:00Z', internalCost: 1000, externalCost: 0 },
        { detectedAt: '2025-01-15T10:00:00Z', internalCost: 2000, externalCost: 0 },
        { detectedAt: '2025-02-15T10:00:00Z', internalCost: 3000, externalCost: 0 },
      ];

      const result = aggregateCostsByMonth(events as AOGEvent[]);

      expect(result[0].month).toBe('2025-01');
      expect(result[1].month).toBe('2025-02');
      expect(result[2].month).toBe('2025-03');
    });
  });

  describe('calculateTotalCosts', () => {
    it('should calculate total costs from events', () => {
      const events: Partial<AOGEvent>[] = [
        { internalCost: 5000, externalCost: 3000 },
        { internalCost: 2000, externalCost: 1000 },
        { internalCost: 6000, externalCost: 4000 },
      ];

      const result = calculateTotalCosts(events as AOGEvent[]);

      expect(result).toEqual({
        totalInternalCost: 13000,
        totalExternalCost: 8000,
        totalCost: 21000,
      });
    });

    it('should handle events with missing costs', () => {
      const events: Partial<AOGEvent>[] = [
        { internalCost: 5000 },
        { externalCost: 3000 },
        {},
      ];

      const result = calculateTotalCosts(events as AOGEvent[]);

      expect(result).toEqual({
        totalInternalCost: 5000,
        totalExternalCost: 3000,
        totalCost: 8000,
      });
    });

    it('should handle empty array', () => {
      const result = calculateTotalCosts([]);

      expect(result).toEqual({
        totalInternalCost: 0,
        totalExternalCost: 0,
        totalCost: 0,
      });
    });
  });

  describe('calculateCostDelta', () => {
    it('should calculate percentage increase', () => {
      expect(calculateCostDelta(150, 100)).toBe(50);
    });

    it('should calculate percentage decrease', () => {
      expect(calculateCostDelta(75, 100)).toBe(-25);
    });

    it('should handle zero change', () => {
      expect(calculateCostDelta(100, 100)).toBe(0);
    });

    it('should handle division by zero', () => {
      expect(calculateCostDelta(100, 0)).toBeNull();
    });

    it('should handle null/undefined previous value', () => {
      expect(calculateCostDelta(100, null as any)).toBeNull();
      expect(calculateCostDelta(100, undefined as any)).toBeNull();
    });

    it('should round to 1 decimal place', () => {
      expect(calculateCostDelta(105.55, 100)).toBe(5.5);
      expect(calculateCostDelta(105.56, 100)).toBe(5.6);
    });
  });

  describe('formatCurrency', () => {
    it('should format as USD currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(1234567)).toBe('$1,234,567');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000');
    });

    it('should not show decimal places', () => {
      expect(formatCurrency(1234.56)).toBe('$1,235');
    });
  });

  describe('getLastNMonths', () => {
    it('should return last N months', () => {
      const data = [
        { month: '2024-01' },
        { month: '2024-02' },
        { month: '2024-03' },
        { month: '2024-04' },
        { month: '2024-05' },
      ];

      const result = getLastNMonths(data, 3);

      expect(result).toHaveLength(3);
      expect(result[0].month).toBe('2024-03');
      expect(result[2].month).toBe('2024-05');
    });

    it('should return all data if N is greater than length', () => {
      const data = [
        { month: '2024-01' },
        { month: '2024-02' },
      ];

      const result = getLastNMonths(data, 5);

      expect(result).toHaveLength(2);
    });

    it('should default to 12 months', () => {
      const data = Array.from({ length: 24 }, (_, i) => ({
        month: `2024-${String(i + 1).padStart(2, '0')}`,
      }));

      const result = getLastNMonths(data);

      expect(result).toHaveLength(12);
    });
  });
});
