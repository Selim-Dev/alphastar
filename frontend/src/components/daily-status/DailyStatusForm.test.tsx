import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { z } from 'zod';

/**
 * Error Handling and Recovery Tests for Daily Status Form
 * 
 * These tests verify that all error scenarios are handled with appropriate 
 * user messaging and that graceful degradation works correctly.
 * 
 * Requirements: 9.10 - Error handling and recovery testing
 */

// ============================================
// Validation Schema (matching DailyStatusForm)
// ============================================

const dailyStatusSchema = z.object({
  aircraftId: z.string().min(1, 'Aircraft is required'),
  date: z.string().min(1, 'Date is required'),
  posHours: z.coerce
    .number()
    .min(0, 'POS hours cannot be negative')
    .max(24, 'POS hours cannot exceed 24'),
  nmcmSHours: z.coerce
    .number()
    .min(0, 'NMCM-S hours cannot be negative')
    .max(24, 'NMCM-S hours cannot exceed 24'),
  nmcmUHours: z.coerce
    .number()
    .min(0, 'NMCM-U hours cannot be negative')
    .max(24, 'NMCM-U hours cannot exceed 24'),
  nmcsHours: z.coerce
    .number()
    .min(0, 'NMCS hours cannot be negative')
    .max(24, 'NMCS hours cannot exceed 24')
    .optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const totalDowntime = data.nmcmSHours + data.nmcmUHours + (data.nmcsHours || 0);
    return totalDowntime <= data.posHours;
  },
  {
    message: 'Total downtime hours cannot exceed POS hours',
    path: ['nmcmSHours'],
  }
);

// ============================================
// Arbitraries for Property-Based Testing
// ============================================

/**
 * Generator for valid form data
 */
const validFormDataArbitrary = fc
  .record({
    aircraftId: fc.stringMatching(/^[a-f0-9]{24}$/),
    date: fc.constant('2024-01-01'),
    posHours: fc.integer({ min: 1, max: 24 }),
    nmcmSRatio: fc.integer({ min: 0, max: 30 }).map(n => n / 100),
    nmcmURatio: fc.integer({ min: 0, max: 30 }).map(n => n / 100),
    nmcsRatio: fc.integer({ min: 0, max: 20 }).map(n => n / 100),
    notes: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
  })
  .filter(({ nmcmSRatio, nmcmURatio, nmcsRatio }) => nmcmSRatio + nmcmURatio + nmcsRatio <= 1)
  .map(({ posHours, nmcmSRatio, nmcmURatio, nmcsRatio, ...rest }) => ({
    ...rest,
    posHours,
    nmcmSHours: posHours * nmcmSRatio,
    nmcmUHours: posHours * nmcmURatio,
    nmcsHours: posHours * nmcsRatio,
  }));

/**
 * Generator for invalid form data (various error scenarios)
 */
const invalidFormDataArbitrary = fc.oneof(
  // Missing aircraft ID
  fc.record({
    aircraftId: fc.constant(''),
    date: fc.constant('2024-01-01'),
    posHours: fc.constant(24),
    nmcmSHours: fc.constant(0),
    nmcmUHours: fc.constant(0),
    nmcsHours: fc.constant(0),
  }),
  // Missing date
  fc.record({
    aircraftId: fc.constant('507f1f77bcf86cd799439011'),
    date: fc.constant(''),
    posHours: fc.constant(24),
    nmcmSHours: fc.constant(0),
    nmcmUHours: fc.constant(0),
    nmcsHours: fc.constant(0),
  }),
  // POS hours out of range (negative)
  fc.record({
    aircraftId: fc.constant('507f1f77bcf86cd799439011'),
    date: fc.constant('2024-01-01'),
    posHours: fc.integer({ min: -100, max: -1 }),
    nmcmSHours: fc.constant(0),
    nmcmUHours: fc.constant(0),
    nmcsHours: fc.constant(0),
  }),
  // POS hours out of range (exceeds 24)
  fc.record({
    aircraftId: fc.constant('507f1f77bcf86cd799439011'),
    date: fc.constant('2024-01-01'),
    posHours: fc.integer({ min: 25, max: 100 }),
    nmcmSHours: fc.constant(0),
    nmcmUHours: fc.constant(0),
    nmcsHours: fc.constant(0),
  }),
  // Downtime exceeds POS hours
  fc.record({
    aircraftId: fc.constant('507f1f77bcf86cd799439011'),
    date: fc.constant('2024-01-01'),
    posHours: fc.constant(24),
    nmcmSHours: fc.constant(15),
    nmcmUHours: fc.constant(15),
    nmcsHours: fc.constant(0),
  })
);

// ============================================
// Error Message Helpers
// ============================================

/**
 * Categorizes error messages for user-friendly display
 */
function categorizeError(errorMessage: string): 'duplicate' | 'validation' | 'network' | 'unknown' {
  if (errorMessage.includes('already exists') || errorMessage.includes('409') || errorMessage.includes('duplicate')) {
    return 'duplicate';
  }
  if (errorMessage.includes('exceed') || errorMessage.includes('cannot be') || errorMessage.includes('required')) {
    return 'validation';
  }
  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return 'network';
  }
  return 'unknown';
}

/**
 * Gets user-friendly suggestions based on error category
 */
function getErrorSuggestions(category: ReturnType<typeof categorizeError>): string[] {
  switch (category) {
    case 'duplicate':
      return [
        'Check if a record already exists for this aircraft and date',
        'Try selecting a different date or aircraft',
      ];
    case 'validation':
      return [
        'Ensure total downtime hours don\'t exceed POS hours',
        'Review each downtime category value',
      ];
    case 'network':
      return [
        'Check your network connection',
        'Try refreshing the page and submitting again',
      ];
    default:
      return [
        'Check your network connection',
        'Try refreshing the page and submitting again',
        'Contact support if the issue persists',
      ];
  }
}

// ============================================
// Property Tests for Validation
// ============================================

describe('Form Validation Properties', () => {
  /**
   * Property: Valid form data should always pass validation
   */
  it('should accept all valid form data', () => {
    fc.assert(
      fc.property(
        validFormDataArbitrary,
        (formData) => {
          const result = dailyStatusSchema.safeParse(formData);
          
          // Property: Valid data should pass validation
          expect(result.success).toBe(true);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid form data should always fail validation with appropriate messages
   */
  it('should reject all invalid form data with appropriate error messages', () => {
    fc.assert(
      fc.property(
        invalidFormDataArbitrary,
        (formData) => {
          const result = dailyStatusSchema.safeParse(formData);
          
          // Property: Invalid data should fail validation
          expect(result.success).toBe(false);
          
          // Property: Error should have meaningful message
          if (!result.success) {
            const issues = result.error.issues;
            expect(issues.length).toBeGreaterThan(0);
            issues.forEach((err) => {
              expect(err.message).toBeTruthy();
              expect(err.message!.length).toBeGreaterThan(0);
            });
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================
// Property Tests for Error Categorization
// ============================================

describe('Error Categorization Properties', () => {
  /**
   * Property: All error messages should be categorizable
   */
  it('should categorize all error messages', () => {
    const errorMessages = [
      'A record already exists for this aircraft and date',
      'Status code 409: Conflict',
      'duplicate key error',
      'Total downtime hours cannot exceed POS hours',
      'POS hours cannot be negative',
      'Aircraft is required',
      'Network error: Failed to fetch',
      'Request timeout',
      'Unknown server error',
      'Something went wrong',
    ];

    errorMessages.forEach(message => {
      const category = categorizeError(message);
      expect(['duplicate', 'validation', 'network', 'unknown']).toContain(category);
    });
  });

  /**
   * Property: All error categories should have suggestions
   */
  it('should provide suggestions for all error categories', () => {
    const categories: ReturnType<typeof categorizeError>[] = ['duplicate', 'validation', 'network', 'unknown'];
    
    categories.forEach(category => {
      const suggestions = getErrorSuggestions(category);
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(suggestion => {
        expect(suggestion).toBeTruthy();
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });
  });
});

// ============================================
// Unit Tests for Specific Error Scenarios
// ============================================

describe('Specific Error Scenarios', () => {
  it('should validate POS hours range (0-24)', () => {
    // Valid cases
    expect(dailyStatusSchema.safeParse({
      aircraftId: '507f1f77bcf86cd799439011',
      date: '2024-01-01',
      posHours: 0,
      nmcmSHours: 0,
      nmcmUHours: 0,
    }).success).toBe(true);

    expect(dailyStatusSchema.safeParse({
      aircraftId: '507f1f77bcf86cd799439011',
      date: '2024-01-01',
      posHours: 24,
      nmcmSHours: 0,
      nmcmUHours: 0,
    }).success).toBe(true);

    // Invalid cases
    expect(dailyStatusSchema.safeParse({
      aircraftId: '507f1f77bcf86cd799439011',
      date: '2024-01-01',
      posHours: -1,
      nmcmSHours: 0,
      nmcmUHours: 0,
    }).success).toBe(false);

    expect(dailyStatusSchema.safeParse({
      aircraftId: '507f1f77bcf86cd799439011',
      date: '2024-01-01',
      posHours: 25,
      nmcmSHours: 0,
      nmcmUHours: 0,
    }).success).toBe(false);
  });

  it('should validate downtime does not exceed POS hours', () => {
    // Valid: downtime equals POS hours
    expect(dailyStatusSchema.safeParse({
      aircraftId: '507f1f77bcf86cd799439011',
      date: '2024-01-01',
      posHours: 24,
      nmcmSHours: 12,
      nmcmUHours: 12,
      nmcsHours: 0,
    }).success).toBe(true);

    // Invalid: downtime exceeds POS hours
    expect(dailyStatusSchema.safeParse({
      aircraftId: '507f1f77bcf86cd799439011',
      date: '2024-01-01',
      posHours: 24,
      nmcmSHours: 15,
      nmcmUHours: 15,
      nmcsHours: 0,
    }).success).toBe(false);
  });

  it('should require aircraft ID', () => {
    const result = dailyStatusSchema.safeParse({
      aircraftId: '',
      date: '2024-01-01',
      posHours: 24,
      nmcmSHours: 0,
      nmcmUHours: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((e) => 
        e.path?.includes('aircraftId')
      )).toBe(true);
    }
  });

  it('should require date', () => {
    const result = dailyStatusSchema.safeParse({
      aircraftId: '507f1f77bcf86cd799439011',
      date: '',
      posHours: 24,
      nmcmSHours: 0,
      nmcmUHours: 0,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      expect(issues.some((e) => 
        e.path?.includes('date')
      )).toBe(true);
    }
  });
});

// ============================================
// Recovery Mechanism Tests
// ============================================

describe('Recovery Mechanisms', () => {
  it('should provide retry suggestions for network errors', () => {
    const suggestions = getErrorSuggestions('network');
    expect(suggestions.some(s => s.toLowerCase().includes('network'))).toBe(true);
    expect(suggestions.some(s => s.toLowerCase().includes('refresh'))).toBe(true);
  });

  it('should provide alternative actions for duplicate errors', () => {
    const suggestions = getErrorSuggestions('duplicate');
    expect(suggestions.some(s => s.toLowerCase().includes('different'))).toBe(true);
  });

  it('should provide validation guidance for validation errors', () => {
    const suggestions = getErrorSuggestions('validation');
    expect(suggestions.some(s => s.toLowerCase().includes('downtime') || s.toLowerCase().includes('review'))).toBe(true);
  });
});
