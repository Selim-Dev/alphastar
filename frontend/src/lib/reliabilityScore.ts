/**
 * Reliability Score Calculation Utilities
 * 
 * Provides functions to calculate aircraft reliability scores and trends.
 */

export interface AircraftReliabilityData {
  aircraftId: string;
  registration: string;
  eventCount: number;
  totalDowntimeHours: number;
  previousEventCount?: number;
  previousDowntimeHours?: number;
}

export interface AircraftReliability extends AircraftReliabilityData {
  reliabilityScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Calculate reliability score for an aircraft
 * 
 * Formula: 100 - min(100, (eventCount * 5) + (totalDowntimeHours / 10))
 * 
 * Higher score = more reliable
 * - Score of 100: Perfect (no events, no downtime)
 * - Score of 0: Very unreliable (20+ events or 1000+ hours downtime)
 * 
 * @param eventCount - Number of AOG events
 * @param totalDowntimeHours - Total downtime in hours
 * @returns Reliability score (0-100)
 */
export function calculateReliabilityScore(
  eventCount: number,
  totalDowntimeHours: number
): number {
  const penalty = (eventCount * 5) + (totalDowntimeHours / 10);
  const score = 100 - Math.min(100, penalty);
  return Math.max(0, Math.round(score * 10) / 10); // Round to 1 decimal place
}

/**
 * Determine trend by comparing current score to previous period score
 * 
 * @param currentScore - Current period reliability score
 * @param previousScore - Previous period reliability score
 * @returns Trend indicator
 */
export function determineTrend(
  currentScore: number,
  previousScore: number
): 'improving' | 'stable' | 'declining' {
  const delta = currentScore - previousScore;
  
  if (delta > 5) return 'improving';
  if (delta < -5) return 'declining';
  return 'stable';
}

/**
 * Calculate reliability scores for multiple aircraft with trend detection
 * 
 * @param data - Array of aircraft reliability data
 * @returns Array of aircraft with calculated scores and trends
 */
export function calculateReliabilityScores(
  data: AircraftReliabilityData[]
): AircraftReliability[] {
  return data.map((aircraft) => {
    const currentScore = calculateReliabilityScore(
      aircraft.eventCount,
      aircraft.totalDowntimeHours
    );
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    
    // Calculate trend if previous period data is available
    if (
      aircraft.previousEventCount !== undefined &&
      aircraft.previousDowntimeHours !== undefined
    ) {
      const previousScore = calculateReliabilityScore(
        aircraft.previousEventCount,
        aircraft.previousDowntimeHours
      );
      trend = determineTrend(currentScore, previousScore);
    }
    
    return {
      ...aircraft,
      reliabilityScore: currentScore,
      trend,
    };
  });
}

/**
 * Sort aircraft by reliability score
 * 
 * @param aircraft - Array of aircraft with reliability scores
 * @param order - Sort order ('asc' for worst first, 'desc' for best first)
 * @returns Sorted array
 */
export function sortByReliabilityScore(
  aircraft: AircraftReliability[],
  order: 'asc' | 'desc' = 'desc'
): AircraftReliability[] {
  return [...aircraft].sort((a, b) => {
    if (order === 'desc') {
      return b.reliabilityScore - a.reliabilityScore;
    }
    return a.reliabilityScore - b.reliabilityScore;
  });
}

/**
 * Get top N most reliable aircraft
 * 
 * @param aircraft - Array of aircraft with reliability scores
 * @param count - Number of aircraft to return
 * @returns Top N most reliable aircraft
 */
export function getMostReliable(
  aircraft: AircraftReliability[],
  count: number = 5
): AircraftReliability[] {
  return sortByReliabilityScore(aircraft, 'desc').slice(0, count);
}

/**
 * Get top N aircraft that need attention (least reliable)
 * 
 * @param aircraft - Array of aircraft with reliability scores
 * @param count - Number of aircraft to return
 * @returns Top N aircraft needing attention
 */
export function getNeedsAttention(
  aircraft: AircraftReliability[],
  count: number = 5
): AircraftReliability[] {
  return sortByReliabilityScore(aircraft, 'asc').slice(0, count);
}
