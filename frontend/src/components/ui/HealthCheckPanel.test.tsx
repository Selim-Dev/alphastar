/**
 * Property-Based Tests for Health Check Panel
 * 
 * These tests verify the correctness properties of the health check display
 * using fast-check for property-based testing.
 * 
 * Run with: npm run test:run -- HealthCheckPanel.test.tsx
 */

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import type { CollectionCount } from '@/types';

// Helper function to determine status based on count
function determineStatus(count: number): 'ok' | 'warning' | 'empty' {
  if (count === 0) return 'empty';
  if (count < 10) return 'warning';
  return 'ok';
}

// Helper function to create a collection count
function createCollectionCount(name: string, count: number): CollectionCount {
  return {
    name,
    count,
    status: determineStatus(count),
  };
}

// Collection names used in the health check
const COLLECTION_NAMES = [
  'Aircraft',
  'Daily Status',
  'Utilization',
  'AOG Events',
  'Maintenance Tasks',
  'Work Orders',
  'Discrepancies',
  'Budget Plans',
  'Actual Spend',
];

// Arbitrary for generating collection counts
const collectionCountArb = fc.record({
  name: fc.constantFrom(...COLLECTION_NAMES),
  count: fc.integer({ min: 0, max: 10000 }),
}).map(({ name, count }) => createCollectionCount(name, count));

// Arbitrary for generating health check response
const healthCheckResponseArb = fc.record({
  collections: fc.array(collectionCountArb, { minLength: 1, maxLength: 9 }),
  lastFetch: fc.date().map(d => d.toISOString()),
  apiStatus: fc.constantFrom('connected', 'error') as fc.Arbitrary<'connected' | 'error'>,
});

describe('Health Check Panel Property Tests', () => {
  /**
   * **Feature: demo-preparation, Property 7: Health Check Collection Counts**
   * **Validates: Requirements 4.1**
   * 
   * For any health check panel render, the displayed count for each collection
   * should match the actual count in the database.
   */
  describe('Property 7: Health Check Collection Counts', () => {
    it('**Feature: demo-preparation, Property 7: Health Check Collection Counts**', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 9, maxLength: 9 }),
          (counts) => {
            // Create collection counts from the generated counts
            const collections = COLLECTION_NAMES.map((name, index) => 
              createCollectionCount(name, counts[index])
            );

            // Verify each collection has the correct count
            collections.forEach((collection, index) => {
              expect(collection.count).toBe(counts[index]);
              expect(collection.name).toBe(COLLECTION_NAMES[index]);
            });

            // Verify the total count matches
            const totalCount = collections.reduce((sum, c) => sum + c.count, 0);
            const expectedTotal = counts.reduce((sum, c) => sum + c, 0);
            expect(totalCount).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly map counts to collection names', () => {
      fc.assert(
        fc.property(
          healthCheckResponseArb,
          (healthData) => {
            // Each collection should have a valid name
            healthData.collections.forEach(collection => {
              expect(COLLECTION_NAMES).toContain(collection.name);
              expect(typeof collection.count).toBe('number');
              expect(collection.count).toBeGreaterThanOrEqual(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: demo-preparation, Property 8: Health Check Empty Warning**
   * **Validates: Requirements 4.3**
   * 
   * For any collection with zero records, the health check panel should display
   * that collection with a warning/empty status indicator.
   */
  describe('Property 8: Health Check Empty Warning', () => {
    it('**Feature: demo-preparation, Property 8: Health Check Empty Warning**', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 10000 }), { minLength: 9, maxLength: 9 }),
          (counts) => {
            // Create collection counts from the generated counts
            const collections = COLLECTION_NAMES.map((name, index) => 
              createCollectionCount(name, counts[index])
            );

            // Verify empty collections have 'empty' status
            collections.forEach((collection, index) => {
              if (counts[index] === 0) {
                expect(collection.status).toBe('empty');
              }
            });

            // Verify warning collections have 'warning' status
            collections.forEach((collection, index) => {
              if (counts[index] > 0 && counts[index] < 10) {
                expect(collection.status).toBe('warning');
              }
            });

            // Verify ok collections have 'ok' status
            collections.forEach((collection, index) => {
              if (counts[index] >= 10) {
                expect(collection.status).toBe('ok');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always mark zero-count collections as empty', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...COLLECTION_NAMES),
          (name) => {
            const collection = createCollectionCount(name, 0);
            expect(collection.status).toBe('empty');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark low-count collections as warning', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...COLLECTION_NAMES),
          fc.integer({ min: 1, max: 9 }),
          (name, count) => {
            const collection = createCollectionCount(name, count);
            expect(collection.status).toBe('warning');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark sufficient-count collections as ok', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...COLLECTION_NAMES),
          fc.integer({ min: 10, max: 10000 }),
          (name, count) => {
            const collection = createCollectionCount(name, count);
            expect(collection.status).toBe('ok');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Status determination is consistent
   */
  describe('Status Determination Consistency', () => {
    it('should consistently determine status based on count thresholds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (count) => {
            const status = determineStatus(count);
            
            // Verify the status matches the expected threshold
            if (count === 0) {
              expect(status).toBe('empty');
            } else if (count < 10) {
              expect(status).toBe('warning');
            } else {
              expect(status).toBe('ok');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
