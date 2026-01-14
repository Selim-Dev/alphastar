/**
 * Availability Calculation Utilities
 * 
 * Centralized availability calculation logic to ensure consistency
 * between frontend and backend calculations.
 * 
 * Requirements: 8.3 - Ensure calculations remain consistent with existing
 * availability logic in DailyStatusService
 */

/**
 * Calculates availability percentage from FMC and POS hours
 * Formula: (fmcHours / posHours) * 100
 * 
 * @param posHours - Possessed hours (total hours aircraft was under operational control)
 * @param fmcHours - Fully Mission Capable hours (hours aircraft was available)
 * @returns Availability percentage (0-100)
 * 
 * Edge cases:
 * - Returns 0 if posHours is 0 or negative (prevents division by zero)
 * - Returns 100 if fmcHours >= posHours (caps at 100%)
 */
export function calculateAvailability(posHours: number, fmcHours: number): number {
  if (posHours <= 0) return 0;
  const percentage = (fmcHours / posHours) * 100;
  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Calculates FMC hours from POS hours and downtime categories
 * Formula: posHours - (nmcmSHours + nmcmUHours + nmcsHours)
 * 
 * @param posHours - Possessed hours
 * @param nmcmSHours - Not Mission Capable Maintenance - Scheduled hours
 * @param nmcmUHours - Not Mission Capable Maintenance - Unscheduled hours
 * @param nmcsHours - Not Mission Capable Supply hours (optional)
 * @returns FMC hours (never negative, never exceeds posHours)
 * 
 * Requirements: 8.7 - FMC hours calculation ensures values never exceed
 * POS hours or go below zero
 */
export function calculateFmcHours(
  posHours: number,
  nmcmSHours: number,
  nmcmUHours: number,
  nmcsHours: number = 0
): number {
  const totalDowntime = nmcmSHours + nmcmUHours + nmcsHours;
  // Ensure FMC hours never go negative
  const fmcHours = Math.max(0, posHours - totalDowntime);
  // Ensure FMC hours never exceed POS hours
  return Math.min(fmcHours, posHours);
}

/**
 * Calculates total downtime hours from all downtime categories
 * 
 * @param nmcmSHours - Scheduled maintenance downtime
 * @param nmcmUHours - Unscheduled maintenance downtime
 * @param nmcsHours - Supply-related downtime (optional)
 * @returns Total downtime hours
 */
export function calculateTotalDowntime(
  nmcmSHours: number,
  nmcmUHours: number,
  nmcsHours: number = 0
): number {
  return nmcmSHours + nmcmUHours + nmcsHours;
}

/**
 * Calculates fleet-wide availability from an array of daily status records
 * 
 * @param records - Array of records with posHours and fmcHours
 * @returns Fleet-wide availability percentage
 * 
 * Requirements: 8.3 - Fleet-wide aggregation accuracy
 */
export function calculateFleetAvailability(
  records: Array<{ posHours: number; fmcHours: number }>
): number {
  if (records.length === 0) return 0;
  
  const totalPosHours = records.reduce((sum, record) => sum + record.posHours, 0);
  const totalFmcHours = records.reduce((sum, record) => sum + record.fmcHours, 0);
  
  return calculateAvailability(totalPosHours, totalFmcHours);
}

/**
 * Determines the availability status color based on percentage thresholds
 * 
 * @param percentage - Availability percentage
 * @returns Status indicator: 'green' | 'amber' | 'red'
 * 
 * Thresholds:
 * - >= 85%: green (healthy)
 * - >= 70%: amber (warning)
 * - < 70%: red (critical)
 * 
 * Requirements: 1.5 - Highlight records with availability below 85% in amber
 * and below 70% in red
 */
export function getAvailabilityStatus(percentage: number): 'green' | 'amber' | 'red' {
  if (percentage >= 85) return 'green';
  if (percentage >= 70) return 'amber';
  return 'red';
}

/**
 * Validates that downtime hours don't exceed POS hours
 * 
 * @param posHours - Possessed hours
 * @param nmcmSHours - Scheduled maintenance downtime
 * @param nmcmUHours - Unscheduled maintenance downtime
 * @param nmcsHours - Supply-related downtime (optional)
 * @returns true if valid, false if downtime exceeds POS hours
 * 
 * Requirements: 3.2 - Validate that sum of downtime hours does not exceed POS hours
 */
export function validateDowntimeHours(
  posHours: number,
  nmcmSHours: number,
  nmcmUHours: number,
  nmcsHours: number = 0
): boolean {
  const totalDowntime = calculateTotalDowntime(nmcmSHours, nmcmUHours, nmcsHours);
  return totalDowntime <= posHours;
}

/**
 * Validates POS hours are within valid range (0-24)
 * 
 * @param posHours - Possessed hours to validate
 * @returns true if valid, false otherwise
 * 
 * Requirements: 2.2 - Validate that POS hours are between 0 and 24
 */
export function validatePosHours(posHours: number): boolean {
  return posHours >= 0 && posHours <= 24;
}
