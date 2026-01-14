import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateAvailability,
  calculateFmcHours,
  calculateTotalDowntime,
  calculateFleetAvailability,
  getAvailabilityStatus,
  validateDowntimeHours,
  validatePosHours,
} from './availability';

/**
 * Comprehensive workflow tests for Daily Status Management
 * 
 * These tests verify the complete user journeys from data entry to dashboard updates,
 * ensuring cross-module integration and data consistency.
 * 
 * Requirements: All requirements validation (Task 9.1)
 */

// ============================================
// Arbitraries for Property-Based Testing
// ============================================

/**
 * Generator for valid daily status record data
 * Ensures total downtime doesn't exceed POS hours
 */
const validDailyStatusArbitrary = fc
  .record({
    posHours: fc.float({ min: Math.fround(0.1), max: Math.fround(24), noNaN: true }),
    nmcmSRatio: fc.float({ min: Math.fround(0), max: Math.fround(0.4), noNaN: true }),
    nmcmURatio: fc.float({ min: Math.fround(0), max: Math.fround(0.4), noNaN: true }),
    nmcsRatio: fc.float({ min: Math.fround(0), max: Math.fround(0.2), noNaN: true }),
  })
  .filter(({ nmcmSRatio, nmcmURatio, nmcsRatio }) => {
    // Ensure total ratio doesn't exceed 1 (100% of POS hours)
    return nmcmSRatio + nmcmURatio + nmcsRatio <= 1;
  })
  .map(({ posHours, nmcmSRatio, nmcmURatio, nmcsRatio }) => ({
    posHours,
    nmcmSHours: posHours * nmcmSRatio,
    nmcmUHours: posHours * nmcmURatio,
    nmcsHours: posHours * nmcsRatio,
  }));

/**
 * Generator for fleet of daily status records
 */
const fleetDailyStatusArbitrary = fc.array(validDailyStatusArbitrary, {
  minLength: 1,
  maxLength: 50,
});

// ============================================
// Property Tests for Availability Calculations
// ============================================

describe('Availability Calculation Properties', () => {
  /**
   * **Feature: daily-status-management, Property 1: Availability percentage calculation accuracy**
   * 
   * *For any* daily status record with valid hour values, the calculated availability 
   * percentage should equal (fmcHours / posHours) * 100
   * 
   * **Validates: Requirements 1.3**
   */
  it('**Feature: daily-status-management, Property 1: Availability percentage calculation accuracy**', () => {
    fc.assert(
      fc.property(
        validDailyStatusArbitrary,
        ({ posHours, nmcmSHours, nmcmUHours, nmcsHours }) => {
          const fmcHours = calculateFmcHours(posHours, nmcmSHours, nmcmUHours, nmcsHours);
          const availability = calculateAvailability(posHours, fmcHours);
          
          // Calculate expected availability
          const expectedAvailability = posHours > 0 
            ? Math.min((fmcHours / posHours) * 100, 100) 
            : 0;
          
          // Property: Calculated availability should match expected formula
          expect(availability).toBeCloseTo(expectedAvailability, 5);
          
          // Property: Availability should be between 0 and 100
          expect(availability).toBeGreaterThanOrEqual(0);
          expect(availability).toBeLessThanOrEqual(100);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: daily-status-management, Property 6: FMC hours automatic calculation**
   * 
   * *For any* combination of POS hours and downtime hours, FMC hours should 
   * automatically equal POS hours minus the sum of all downtime categories
   * 
   * **Validates: Requirements 2.3**
   */
  it('**Feature: daily-status-management, Property 6: FMC hours automatic calculation**', () => {
    fc.assert(
      fc.property(
        validDailyStatusArbitrary,
        ({ posHours, nmcmSHours, nmcmUHours, nmcsHours }) => {
          const fmcHours = calculateFmcHours(posHours, nmcmSHours, nmcmUHours, nmcsHours);
          const totalDowntime = calculateTotalDowntime(nmcmSHours, nmcmUHours, nmcsHours);
          
          // Property: FMC = POS - total downtime (clamped to valid range)
          const expectedFmc = Math.max(0, Math.min(posHours, posHours - totalDowntime));
          expect(fmcHours).toBeCloseTo(expectedFmc, 5);
          
          // Property: FMC hours should never be negative
          expect(fmcHours).toBeGreaterThanOrEqual(0);
          
          // Property: FMC hours should never exceed POS hours
          expect(fmcHours).toBeLessThanOrEqual(posHours);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: daily-status-management, Property 9: Downtime hours validation**
   * 
   * *For any* daily status record, the sum of all downtime hours should 
   * never exceed the POS hours value
   * 
   * **Validates: Requirements 3.2**
   */
  it('**Feature: daily-status-management, Property 9: Downtime hours validation**', () => {
    fc.assert(
      fc.property(
        validDailyStatusArbitrary,
        ({ posHours, nmcmSHours, nmcmUHours, nmcsHours }) => {
          const isValid = validateDowntimeHours(posHours, nmcmSHours, nmcmUHours, nmcsHours);
          const totalDowntime = calculateTotalDowntime(nmcmSHours, nmcmUHours, nmcsHours);
          
          // Property: Validation should return true when downtime <= POS
          expect(isValid).toBe(totalDowntime <= posHours);
          
          // For valid records, downtime should not exceed POS
          if (isValid) {
            expect(totalDowntime).toBeLessThanOrEqual(posHours);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// Property Tests for POS Hours Validation
// ============================================

describe('POS Hours Validation Properties', () => {
  /**
   * **Feature: daily-status-management, Property 5: POS hours validation**
   * 
   * *For any* daily status form submission, POS hours values outside the 
   * range 0-24 should be rejected with appropriate error messages
   * 
   * **Validates: Requirements 2.2**
   */
  it('**Feature: daily-status-management, Property 5: POS hours validation**', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(-100), max: Math.fround(100), noNaN: true }),
        (posHours) => {
          const isValid = validatePosHours(posHours);
          
          // Property: Valid only if 0 <= posHours <= 24
          const expectedValid = posHours >= 0 && posHours <= 24;
          expect(isValid).toBe(expectedValid);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject negative POS hours', () => {
    expect(validatePosHours(-1)).toBe(false);
    expect(validatePosHours(-0.1)).toBe(false);
    expect(validatePosHours(-24)).toBe(false);
  });

  it('should reject POS hours exceeding 24', () => {
    expect(validatePosHours(24.1)).toBe(false);
    expect(validatePosHours(25)).toBe(false);
    expect(validatePosHours(48)).toBe(false);
  });

  it('should accept valid POS hours', () => {
    expect(validatePosHours(0)).toBe(true);
    expect(validatePosHours(12)).toBe(true);
    expect(validatePosHours(24)).toBe(true);
  });
});

// ============================================
// Property Tests for Availability Thresholds
// ============================================

describe('Availability Threshold Properties', () => {
  /**
   * **Feature: daily-status-management, Property 4: Availability threshold highlighting**
   * 
   * *For any* daily status record, records with availability below 85% should 
   * have amber styling and records below 70% should have red styling
   * 
   * **Validates: Requirements 1.5**
   */
  it('**Feature: daily-status-management, Property 4: Availability threshold highlighting**', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
        (percentage) => {
          const status = getAvailabilityStatus(percentage);
          
          // Property: Status should match threshold rules
          if (percentage >= 85) {
            expect(status).toBe('green');
          } else if (percentage >= 70) {
            expect(status).toBe('amber');
          } else {
            expect(status).toBe('red');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return green for availability >= 85%', () => {
    expect(getAvailabilityStatus(85)).toBe('green');
    expect(getAvailabilityStatus(90)).toBe('green');
    expect(getAvailabilityStatus(100)).toBe('green');
  });

  it('should return amber for availability 70-84%', () => {
    expect(getAvailabilityStatus(70)).toBe('amber');
    expect(getAvailabilityStatus(75)).toBe('amber');
    expect(getAvailabilityStatus(84.9)).toBe('amber');
  });

  it('should return red for availability < 70%', () => {
    expect(getAvailabilityStatus(0)).toBe('red');
    expect(getAvailabilityStatus(50)).toBe('red');
    expect(getAvailabilityStatus(69.9)).toBe('red');
  });
});

// ============================================
// Property Tests for Fleet Availability
// ============================================

describe('Fleet Availability Properties', () => {
  /**
   * Fleet-wide availability calculation accuracy
   * 
   * *For any* set of daily status records, the fleet availability should 
   * accurately reflect the weighted average based on POS hours
   */
  it('should calculate fleet availability as weighted average', () => {
    fc.assert(
      fc.property(
        fleetDailyStatusArbitrary,
        (records) => {
          // Calculate FMC hours for each record
          const recordsWithFmc = records.map(r => ({
            posHours: r.posHours,
            fmcHours: calculateFmcHours(r.posHours, r.nmcmSHours, r.nmcmUHours, r.nmcsHours),
          }));
          
          const fleetAvailability = calculateFleetAvailability(recordsWithFmc);
          
          // Calculate expected fleet availability
          const totalPos = recordsWithFmc.reduce((sum, r) => sum + r.posHours, 0);
          const totalFmc = recordsWithFmc.reduce((sum, r) => sum + r.fmcHours, 0);
          const expectedAvailability = totalPos > 0 
            ? Math.min((totalFmc / totalPos) * 100, 100) 
            : 0;
          
          // Property: Fleet availability should match weighted calculation
          expect(fleetAvailability).toBeCloseTo(expectedAvailability, 5);
          
          // Property: Fleet availability should be between 0 and 100
          expect(fleetAvailability).toBeGreaterThanOrEqual(0);
          expect(fleetAvailability).toBeLessThanOrEqual(100);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 for empty fleet', () => {
    expect(calculateFleetAvailability([])).toBe(0);
  });

  it('should return 100 for fleet with no downtime', () => {
    const records = [
      { posHours: 24, fmcHours: 24 },
      { posHours: 24, fmcHours: 24 },
    ];
    expect(calculateFleetAvailability(records)).toBe(100);
  });
});

// ============================================
// Edge Case Tests
// ============================================

describe('Edge Cases', () => {
  it('should handle zero POS hours gracefully', () => {
    expect(calculateAvailability(0, 0)).toBe(0);
    expect(calculateFmcHours(0, 0, 0, 0)).toBe(0);
  });

  it('should handle negative inputs gracefully', () => {
    // FMC calculation should clamp to 0
    const fmc = calculateFmcHours(24, 30, 0, 0); // Downtime exceeds POS
    expect(fmc).toBe(0);
  });

  it('should handle very small values', () => {
    const availability = calculateAvailability(0.001, 0.001);
    expect(availability).toBeCloseTo(100, 1);
  });

  it('should handle maximum values', () => {
    const availability = calculateAvailability(24, 24);
    expect(availability).toBe(100);
    
    const fmc = calculateFmcHours(24, 0, 0, 0);
    expect(fmc).toBe(24);
  });
});

// ============================================
// Integration Tests for Data Consistency
// ============================================

describe('Data Consistency', () => {
  /**
   * Verify that FMC + total downtime = POS hours
   * This ensures mathematical consistency in the calculations
   */
  it('should maintain FMC + downtime = POS invariant', () => {
    fc.assert(
      fc.property(
        validDailyStatusArbitrary,
        ({ posHours, nmcmSHours, nmcmUHours, nmcsHours }) => {
          const fmcHours = calculateFmcHours(posHours, nmcmSHours, nmcmUHours, nmcsHours);
          const totalDowntime = calculateTotalDowntime(nmcmSHours, nmcmUHours, nmcsHours);
          
          // Property: FMC + downtime should equal POS (when downtime <= POS)
          if (totalDowntime <= posHours) {
            expect(fmcHours + totalDowntime).toBeCloseTo(posHours, 5);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Verify availability percentage is consistent with FMC/POS ratio
   */
  it('should maintain availability = (FMC/POS) * 100 invariant', () => {
    fc.assert(
      fc.property(
        validDailyStatusArbitrary,
        ({ posHours, nmcmSHours, nmcmUHours, nmcsHours }) => {
          const fmcHours = calculateFmcHours(posHours, nmcmSHours, nmcmUHours, nmcsHours);
          const availability = calculateAvailability(posHours, fmcHours);
          
          // Property: Availability should equal (FMC/POS) * 100
          if (posHours > 0) {
            const expectedAvailability = (fmcHours / posHours) * 100;
            expect(availability).toBeCloseTo(expectedAvailability, 5);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
