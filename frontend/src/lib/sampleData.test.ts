import { describe, it, expect } from 'vitest';
import { sampleData } from './sampleData';

describe('sampleData', () => {
  describe('basic functionality', () => {
    it('should return original array when data length is less than maxPoints', () => {
      const data = [1, 2, 3, 4, 5];
      const result = sampleData(data, 100);
      
      expect(result).toEqual(data);
      expect(result.length).toBe(5);
    });

    it('should return original array when data length equals maxPoints', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const result = sampleData(data, 100);
      
      expect(result).toEqual(data);
      expect(result.length).toBe(100);
    });

    it('should reduce array size when data length exceeds maxPoints', () => {
      const data = Array.from({ length: 500 }, (_, i) => i);
      const result = sampleData(data, 100);
      
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('sampling algorithm', () => {
    it('should use step-based sampling', () => {
      const data = Array.from({ length: 200 }, (_, i) => i);
      const result = sampleData(data, 100);
      
      // With 200 items and max 100, step should be 2
      // Should get items at indices 0, 2, 4, 6, ...
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(2);
      expect(result[2]).toBe(4);
    });

    it('should maintain first element', () => {
      const data = Array.from({ length: 1000 }, (_, i) => i);
      const result = sampleData(data, 50);
      
      expect(result[0]).toBe(0);
    });

    it('should distribute samples evenly across dataset', () => {
      const data = Array.from({ length: 1000 }, (_, i) => i);
      const result = sampleData(data, 100);
      
      // Check that samples are evenly distributed
      const step = Math.ceil(1000 / 100);
      for (let i = 0; i < result.length - 1; i++) {
        const diff = result[i + 1] - result[i];
        expect(diff).toBe(step);
      }
    });
  });

  describe('default maxPoints parameter', () => {
    it('should use 100 as default maxPoints', () => {
      const data = Array.from({ length: 500 }, (_, i) => i);
      const result = sampleData(data);
      
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('type safety', () => {
    it('should work with number arrays', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = sampleData(data, 5);
      
      expect(result).toEqual([1, 3, 5, 7, 9]);
    });

    it('should work with string arrays', () => {
      const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const result = sampleData(data, 4);
      
      expect(result).toEqual(['a', 'c', 'e', 'g']);
    });

    it('should work with object arrays', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        value: i * 10,
      }));
      const result = sampleData(data, 5);
      
      expect(result.length).toBe(5);
      expect(result[0]).toEqual({ id: 0, value: 0 });
      expect(result[1]).toEqual({ id: 2, value: 20 });
    });

    it('should work with complex nested objects', () => {
      interface MonthlyData {
        month: string;
        eventCount: number;
        downtime: number;
        metadata: {
          aircraft: string[];
        };
      }

      const data: MonthlyData[] = Array.from({ length: 24 }, (_, i) => ({
        month: `2024-${String(i + 1).padStart(2, '0')}`,
        eventCount: Math.floor(Math.random() * 10),
        downtime: Math.random() * 100,
        metadata: {
          aircraft: ['HZ-A42', 'HZ-A43'],
        },
      }));

      const result = sampleData(data, 12);
      
      expect(result.length).toBe(12);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('metadata.aircraft');
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const data: number[] = [];
      const result = sampleData(data, 100);
      
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('should handle single element array', () => {
      const data = [42];
      const result = sampleData(data, 100);
      
      expect(result).toEqual([42]);
      expect(result.length).toBe(1);
    });

    it('should handle maxPoints of 1', () => {
      const data = Array.from({ length: 100 }, (_, i) => i);
      const result = sampleData(data, 1);
      
      expect(result.length).toBe(1);
      expect(result[0]).toBe(0);
    });

    it('should handle very large datasets', () => {
      const data = Array.from({ length: 10000 }, (_, i) => i);
      const result = sampleData(data, 100);
      
      expect(result.length).toBeLessThanOrEqual(100);
      expect(result[0]).toBe(0);
    });
  });

  describe('real-world use cases', () => {
    it('should sample monthly trend data for charts', () => {
      // Simulate 5 years of monthly data (60 months)
      const monthlyData = Array.from({ length: 60 }, (_, i) => ({
        month: `2020-${String((i % 12) + 1).padStart(2, '0')}`,
        eventCount: Math.floor(Math.random() * 20),
        totalDowntimeHours: Math.random() * 500,
      }));

      const sampledData = sampleData(monthlyData, 24);
      
      expect(sampledData.length).toBeLessThanOrEqual(24);
      expect(sampledData[0]).toHaveProperty('month');
      expect(sampledData[0]).toHaveProperty('eventCount');
      expect(sampledData[0]).toHaveProperty('totalDowntimeHours');
    });

    it('should sample aircraft heatmap data', () => {
      // Simulate heatmap data for 20 aircraft over 12 months
      const heatmapData = Array.from({ length: 240 }, (_, i) => ({
        aircraftId: `aircraft-${Math.floor(i / 12)}`,
        month: `2024-${String((i % 12) + 1).padStart(2, '0')}`,
        downtimeHours: Math.random() * 100,
      }));

      const sampledData = sampleData(heatmapData, 100);
      
      expect(sampledData.length).toBeLessThanOrEqual(100);
      expect(sampledData.length).toBeGreaterThan(0);
    });

    it('should maintain data distribution for cost analysis', () => {
      // Simulate cost data with varying values
      const costData = Array.from({ length: 365 }, (_, i) => ({
        date: `2024-${String(Math.floor(i / 31) + 1).padStart(2, '0')}-${String((i % 31) + 1).padStart(2, '0')}`,
        internalCost: Math.random() * 10000,
        externalCost: Math.random() * 5000,
      }));

      const sampledData = sampleData(costData, 50);
      
      expect(sampledData.length).toBeLessThanOrEqual(50);
      
      // Verify we still have data from beginning, middle, and end
      expect(sampledData[0].date).toContain('2024-01');
      expect(sampledData[sampledData.length - 1].date).toContain('2024-12');
    });
  });

  describe('performance characteristics', () => {
    it('should handle large datasets efficiently', () => {
      const data = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: Math.random(),
      }));

      const startTime = performance.now();
      const result = sampleData(data, 100);
      const endTime = performance.now();

      expect(result.length).toBeLessThanOrEqual(100);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
    });
  });

  describe('immutability', () => {
    it('should not modify original array', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const originalData = [...data];
      
      sampleData(data, 5);
      
      expect(data).toEqual(originalData);
    });
  });
});
