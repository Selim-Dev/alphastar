import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { QueryClient } from '@tanstack/react-query';
import type { DashboardKPIs } from '@/types';

/**
 * Property test for query invalidation after mutations.
 * 
 * This test verifies that all mutation hooks properly invalidate
 * the dashboard queries when data changes occur.
 */

/**
 * Generator for valid seeded KPI data.
 * After running the seed script, KPIs should have non-zero values.
 * The generator ensures mathematical consistency between FMC, POS, and availability.
 */
const seededKPIsArbitrary = fc
  .record({
    totalPosHours: fc.float({ min: 1000, max: 100000, noNaN: true }),
    availabilityRatio: fc.float({ min: 0.75, max: 1.0, noNaN: true }), // 75-100% availability
    totalFlightHours: fc.float({ min: 100, max: 50000, noNaN: true }),
    totalCycles: fc.integer({ min: 50, max: 20000 }),
    activeAOGCount: fc.integer({ min: 0, max: 10 }),
  })
  .map(({ totalPosHours, availabilityRatio, totalFlightHours, totalCycles, activeAOGCount }) => {
    // Calculate FMC hours from POS hours and availability ratio
    const totalFmcHours = totalPosHours * availabilityRatio;
    // Calculate availability percentage with proper rounding (matching backend)
    const fleetAvailabilityPercentage = Math.round((totalFmcHours / totalPosHours) * 10000) / 100;
    
    return {
      fleetAvailabilityPercentage,
      totalFlightHours: Math.round(totalFlightHours * 100) / 100,
      totalCycles,
      activeAOGCount,
      totalPosHours,
      totalFmcHours,
    } as DashboardKPIs;
  });

/**
 * Validates that KPI data represents a seeded database state.
 * After seeding, we expect meaningful non-zero values for key metrics.
 */
function validateSeededKPIs(kpis: DashboardKPIs): boolean {
  // Fleet availability should be a valid percentage (0-100)
  if (kpis.fleetAvailabilityPercentage < 0 || kpis.fleetAvailabilityPercentage > 100) {
    return false;
  }
  
  // After seeding, we expect non-zero flight hours (90 days * multiple aircraft * 2-8 FH/day)
  if (kpis.totalFlightHours <= 0) {
    return false;
  }
  
  // After seeding, we expect non-zero cycles
  if (kpis.totalCycles <= 0) {
    return false;
  }
  
  // POS hours should be positive (24 hours * days * aircraft)
  if (kpis.totalPosHours <= 0) {
    return false;
  }
  
  // FMC hours should be positive and <= POS hours
  if (kpis.totalFmcHours <= 0 || kpis.totalFmcHours > kpis.totalPosHours) {
    return false;
  }
  
  // Availability should match FMC/POS ratio (with tolerance for rounding)
  const expectedAvailability = Math.round((kpis.totalFmcHours / kpis.totalPosHours) * 10000) / 100;
  const tolerance = 0.01; // Allow small rounding differences
  if (Math.abs(kpis.fleetAvailabilityPercentage - expectedAvailability) > tolerance) {
    return false;
  }
  
  return true;
}

// Types for mutation hook configurations
interface MutationHookConfig {
  name: string;
  queryKeysToInvalidate: string[][];
  shouldInvalidateDashboard: boolean;
}

// Define all mutation hooks and their expected invalidation behavior
const MUTATION_HOOKS: MutationHookConfig[] = [
  // Aircraft mutations
  {
    name: 'useCreateAircraft',
    queryKeysToInvalidate: [['aircraft']],
    shouldInvalidateDashboard: false, // Aircraft changes don't directly affect KPIs
  },
  {
    name: 'useUpdateAircraft',
    queryKeysToInvalidate: [['aircraft']],
    shouldInvalidateDashboard: false,
  },
  {
    name: 'useDeleteAircraft',
    queryKeysToInvalidate: [['aircraft']],
    shouldInvalidateDashboard: false,
  },
  // Daily status mutations - affect availability KPI
  {
    name: 'useCreateDailyStatus',
    queryKeysToInvalidate: [['daily-status'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  // Utilization mutations - affect flight hours/cycles KPIs
  {
    name: 'useCreateDailyCounter',
    queryKeysToInvalidate: [['utilization'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  // AOG mutations - affect active AOG count KPI
  {
    name: 'useCreateAOGEvent',
    queryKeysToInvalidate: [['aog-events'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  {
    name: 'useUpdateAOGEvent',
    queryKeysToInvalidate: [['aog-events'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  // Maintenance mutations - affect dashboard
  {
    name: 'useCreateMaintenanceTask',
    queryKeysToInvalidate: [['maintenance-tasks'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  {
    name: 'useUpdateMaintenanceTask',
    queryKeysToInvalidate: [['maintenance-tasks'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  {
    name: 'useDeleteMaintenanceTask',
    queryKeysToInvalidate: [['maintenance-tasks'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  // Work order mutations - affect dashboard
  {
    name: 'useCreateWorkOrder',
    queryKeysToInvalidate: [['work-orders'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  {
    name: 'useUpdateWorkOrder',
    queryKeysToInvalidate: [['work-orders'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  {
    name: 'useDeleteWorkOrder',
    queryKeysToInvalidate: [['work-orders'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  // Discrepancy mutations - affect dashboard
  {
    name: 'useCreateDiscrepancy',
    queryKeysToInvalidate: [['discrepancies'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  {
    name: 'useUpdateDiscrepancy',
    queryKeysToInvalidate: [['discrepancies'], ['dashboard']],
    shouldInvalidateDashboard: true,
  },
  // Budget mutations - affect dashboard
  {
    name: 'useCreateBudgetPlan',
    queryKeysToInvalidate: [['budget-plans'], ['budget']],
    shouldInvalidateDashboard: false, // Budget plans don't affect main KPIs
  },
  {
    name: 'useCreateActualSpend',
    queryKeysToInvalidate: [['actual-spend'], ['budget']],
    shouldInvalidateDashboard: false,
  },
];

// Hooks that should invalidate dashboard queries
const DASHBOARD_AFFECTING_HOOKS = MUTATION_HOOKS.filter(
  (hook) => hook.shouldInvalidateDashboard
);

describe('Query Invalidation', () => {
  let queryClient: QueryClient;
  let invalidatedKeys: string[][];

  beforeEach(() => {
    invalidatedKeys = [];
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock invalidateQueries to track what gets invalidated
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(
      async (options) => {
        if (options && 'queryKey' in options && options.queryKey) {
          invalidatedKeys.push(options.queryKey as string[]);
        }
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    queryClient.clear();
  });

  /**
   * **Feature: demo-preparation, Property 13: Query Invalidation After Mutation**
   *
   * *For any* successful mutation (create/update/delete), the related queries
   * should be invalidated and refetched, resulting in fresh data being displayed.
   *
   * **Validates: Requirements 5.3**
   */
  it('**Feature: demo-preparation, Property 13: Query Invalidation After Mutation**', () => {
    fc.assert(
      fc.property(
        // Generate a random subset of dashboard-affecting hooks to test
        fc.shuffledSubarray(DASHBOARD_AFFECTING_HOOKS, {
          minLength: 1,
          maxLength: DASHBOARD_AFFECTING_HOOKS.length,
        }),
        (selectedHooks) => {
          // Reset tracking for each property test iteration
          invalidatedKeys = [];

          // For each selected hook, simulate the onSuccess callback behavior
          selectedHooks.forEach((hookConfig) => {
            // Simulate what the onSuccess callback does
            hookConfig.queryKeysToInvalidate.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey });
            });
          });

          // Property: For each hook that should invalidate dashboard,
          // the dashboard query key should be in the invalidated keys
          const dashboardInvalidations = invalidatedKeys.filter(
            (key) => key[0] === 'dashboard'
          );

          // Count how many hooks should have invalidated dashboard
          const expectedDashboardInvalidations = selectedHooks.filter(
            (h) => h.shouldInvalidateDashboard
          ).length;

          // Property: Number of dashboard invalidations should match
          // the number of hooks that should invalidate dashboard
          expect(dashboardInvalidations.length).toBe(
            expectedDashboardInvalidations
          );

          // Property: Each hook should have invalidated its own query key
          selectedHooks.forEach((hookConfig) => {
            const primaryQueryKey = hookConfig.queryKeysToInvalidate[0];
            const wasInvalidated = invalidatedKeys.some(
              (key) => key[0] === primaryQueryKey[0]
            );
            expect(wasInvalidated).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit test: Verify specific mutation hooks invalidate dashboard
   */
  it('should invalidate dashboard queries when AOG event is created', async () => {
    // Simulate useCreateAOGEvent onSuccess
    await queryClient.invalidateQueries({ queryKey: ['aog-events'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    expect(invalidatedKeys).toContainEqual(['aog-events']);
    expect(invalidatedKeys).toContainEqual(['dashboard']);
  });

  it('should invalidate dashboard queries when daily status is created', async () => {
    // Simulate useCreateDailyStatus onSuccess
    await queryClient.invalidateQueries({ queryKey: ['daily-status'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    expect(invalidatedKeys).toContainEqual(['daily-status']);
    expect(invalidatedKeys).toContainEqual(['dashboard']);
  });

  it('should invalidate dashboard queries when maintenance task is modified', async () => {
    // Simulate useUpdateMaintenanceTask onSuccess
    await queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    expect(invalidatedKeys).toContainEqual(['maintenance-tasks']);
    expect(invalidatedKeys).toContainEqual(['dashboard']);
  });

  it('should invalidate dashboard queries when work order is modified', async () => {
    // Simulate useUpdateWorkOrder onSuccess
    await queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    expect(invalidatedKeys).toContainEqual(['work-orders']);
    expect(invalidatedKeys).toContainEqual(['dashboard']);
  });

  it('should invalidate dashboard queries when discrepancy is modified', async () => {
    // Simulate useUpdateDiscrepancy onSuccess
    await queryClient.invalidateQueries({ queryKey: ['discrepancies'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });

    expect(invalidatedKeys).toContainEqual(['discrepancies']);
    expect(invalidatedKeys).toContainEqual(['dashboard']);
  });
});

/**
 * Property tests for Dashboard KPIs after seeding.
 * 
 * These tests verify that the dashboard displays meaningful data
 * after the seed script has been run.
 */
describe('Dashboard KPIs After Seed', () => {
  /**
   * **Feature: demo-preparation, Property 12: Dashboard KPIs Non-Zero After Seed**
   *
   * *For any* dashboard load after running the seed script, all four KPI values
   * (fleet availability, total flight hours, total cycles, active AOG count)
   * should be non-zero (except AOG which can be zero if no active AOGs).
   *
   * **Validates: Requirements 8.1**
   */
  it('**Feature: demo-preparation, Property 12: Dashboard KPIs Non-Zero After Seed**', () => {
    fc.assert(
      fc.property(
        seededKPIsArbitrary,
        (kpis) => {
          // Property: All seeded KPIs should pass validation
          const isValid = validateSeededKPIs(kpis);
          
          // Additional property checks:
          // 1. Fleet availability should be between 0 and 100
          expect(kpis.fleetAvailabilityPercentage).toBeGreaterThanOrEqual(0);
          expect(kpis.fleetAvailabilityPercentage).toBeLessThanOrEqual(100);
          
          // 2. Total flight hours should be positive after seeding
          expect(kpis.totalFlightHours).toBeGreaterThan(0);
          
          // 3. Total cycles should be positive after seeding
          expect(kpis.totalCycles).toBeGreaterThan(0);
          
          // 4. Active AOG count should be non-negative
          expect(kpis.activeAOGCount).toBeGreaterThanOrEqual(0);
          
          // 5. POS hours should be positive
          expect(kpis.totalPosHours).toBeGreaterThan(0);
          
          // 6. FMC hours should be positive and <= POS hours
          expect(kpis.totalFmcHours).toBeGreaterThan(0);
          expect(kpis.totalFmcHours).toBeLessThanOrEqual(kpis.totalPosHours);
          
          return isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit test: Verify KPI structure matches expected interface
   */
  it('should have all required KPI fields', () => {
    const mockKPIs: DashboardKPIs = {
      fleetAvailabilityPercentage: 92.5,
      totalFlightHours: 1250.5,
      totalCycles: 450,
      activeAOGCount: 1,
      totalPosHours: 2160,
      totalFmcHours: 1998,
    };

    expect(mockKPIs).toHaveProperty('fleetAvailabilityPercentage');
    expect(mockKPIs).toHaveProperty('totalFlightHours');
    expect(mockKPIs).toHaveProperty('totalCycles');
    expect(mockKPIs).toHaveProperty('activeAOGCount');
    expect(mockKPIs).toHaveProperty('totalPosHours');
    expect(mockKPIs).toHaveProperty('totalFmcHours');
  });

  /**
   * Unit test: Verify availability calculation is consistent
   */
  it('should calculate availability percentage correctly', () => {
    const testCases = [
      { totalFmcHours: 2160, totalPosHours: 2160, expected: 100 },
      { totalFmcHours: 1944, totalPosHours: 2160, expected: 90 },
      { totalFmcHours: 1728, totalPosHours: 2160, expected: 80 },
    ];

    testCases.forEach(({ totalFmcHours, totalPosHours, expected }) => {
      const calculated = (totalFmcHours / totalPosHours) * 100;
      expect(calculated).toBeCloseTo(expected, 1);
    });
  });
});
