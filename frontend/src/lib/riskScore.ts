/**
 * Risk Score Calculation Utilities
 * 
 * Calculates aircraft-level risk assessment based on multiple factors:
 * - Recent event frequency (40% weight)
 * - Average downtime trend (30% weight)
 * - Cost trend (20% weight)
 * - Recurring issues (10% weight)
 */

interface AOGEvent {
  aircraftId: string;
  detectedAt: string;
  clearedAt?: string;
  totalDowntimeHours?: number;
  internalCost?: number;
  externalCost?: number;
  reasonCode?: string;
}

interface RiskFactor {
  name: string;
  contribution: number; // percentage
}

interface RiskScoreResult {
  aircraftId: string;
  registration: string;
  riskScore: number; // 0-100, higher = higher risk
  factors: RiskFactor[];
}

/**
 * Calculate risk score for an aircraft
 * Formula: (recentEventFrequency * 0.4) + (averageDowntimeTrend * 0.3) + (costTrend * 0.2) + (recurringIssues * 0.1)
 */
export function calculateRiskScore(
  aircraftId: string,
  registration: string,
  events: AOGEvent[],
  allEvents: AOGEvent[] // For fleet-wide comparison
): RiskScoreResult {
  // Filter events for this aircraft
  const aircraftEvents = events.filter((e) => e.aircraftId === aircraftId);

  if (aircraftEvents.length === 0) {
    return {
      aircraftId,
      registration,
      riskScore: 0,
      factors: [],
    };
  }

  // Calculate each risk factor
  const recentEventFrequency = calculateRecentEventFrequency(aircraftEvents, allEvents);
  const averageDowntimeTrend = calculateAverageDowntimeTrend(aircraftEvents);
  const costTrend = calculateCostTrend(aircraftEvents);
  const recurringIssues = calculateRecurringIssues(aircraftEvents);

  // Calculate weighted risk score
  const riskScore = Math.min(
    100,
    recentEventFrequency.score * 0.4 +
      averageDowntimeTrend.score * 0.3 +
      costTrend.score * 0.2 +
      recurringIssues.score * 0.1
  );

  // Build factors array with contributions
  const factors: RiskFactor[] = [
    {
      name: 'Recent Event Frequency',
      contribution: (recentEventFrequency.score * 0.4 / riskScore) * 100,
    },
    {
      name: 'Average Downtime Trend',
      contribution: (averageDowntimeTrend.score * 0.3 / riskScore) * 100,
    },
    {
      name: 'Cost Trend',
      contribution: (costTrend.score * 0.2 / riskScore) * 100,
    },
    {
      name: 'Recurring Issues',
      contribution: (recurringIssues.score * 0.1 / riskScore) * 100,
    },
  ].filter((f) => f.contribution > 0);

  return {
    aircraftId,
    registration,
    riskScore: Math.round(riskScore * 10) / 10,
    factors,
  };
}

/**
 * Calculate recent event frequency score (0-100)
 * Compares last 30 days to fleet average
 */
function calculateRecentEventFrequency(
  aircraftEvents: AOGEvent[],
  allEvents: AOGEvent[]
): { score: number } {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count events in last 30 days
  const recentEvents = aircraftEvents.filter(
    (e) => new Date(e.detectedAt) >= thirtyDaysAgo
  ).length;

  // Calculate fleet average for last 30 days
  const aircraftIds = [...new Set(allEvents.map((e) => e.aircraftId))];
  const fleetRecentEvents = allEvents.filter(
    (e) => new Date(e.detectedAt) >= thirtyDaysAgo
  ).length;
  const fleetAverage = fleetRecentEvents / Math.max(1, aircraftIds.length);

  // Score: 0 if below average, scales up to 100 for 3x average or more
  if (recentEvents <= fleetAverage) {
    return { score: 0 };
  }

  const ratio = recentEvents / Math.max(0.1, fleetAverage);
  const score = Math.min(100, ((ratio - 1) / 2) * 100); // 3x average = 100 score

  return { score };
}

/**
 * Calculate average downtime trend score (0-100)
 * Compares recent average to historical average
 */
function calculateAverageDowntimeTrend(aircraftEvents: AOGEvent[]): { score: number } {
  if (aircraftEvents.length < 2) {
    return { score: 0 };
  }

  // Sort by date
  const sorted = [...aircraftEvents].sort(
    (a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
  );

  // Split into two halves
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  // Calculate average downtime for each half
  const firstAvg =
    firstHalf.reduce((sum, e) => sum + (e.totalDowntimeHours || 0), 0) /
    Math.max(1, firstHalf.length);
  const secondAvg =
    secondHalf.reduce((sum, e) => sum + (e.totalDowntimeHours || 0), 0) /
    Math.max(1, secondHalf.length);

  // Score: 0 if improving, scales up to 100 for 2x increase
  if (secondAvg <= firstAvg) {
    return { score: 0 };
  }

  const ratio = secondAvg / Math.max(0.1, firstAvg);
  const score = Math.min(100, ((ratio - 1) / 1) * 100); // 2x increase = 100 score

  return { score };
}

/**
 * Calculate cost trend score (0-100)
 * Compares recent costs to historical costs
 */
function calculateCostTrend(aircraftEvents: AOGEvent[]): { score: number } {
  if (aircraftEvents.length < 2) {
    return { score: 0 };
  }

  // Sort by date
  const sorted = [...aircraftEvents].sort(
    (a, b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()
  );

  // Split into two halves
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  // Calculate total cost for each half
  const firstCost = firstHalf.reduce(
    (sum, e) => sum + (e.internalCost || 0) + (e.externalCost || 0),
    0
  );
  const secondCost = secondHalf.reduce(
    (sum, e) => sum + (e.internalCost || 0) + (e.externalCost || 0),
    0
  );

  // Calculate average cost per event
  const firstAvg = firstCost / Math.max(1, firstHalf.length);
  const secondAvg = secondCost / Math.max(1, secondHalf.length);

  // Score: 0 if costs are stable or decreasing, scales up to 100 for 2x increase
  if (secondAvg <= firstAvg) {
    return { score: 0 };
  }

  const ratio = secondAvg / Math.max(0.1, firstAvg);
  const score = Math.min(100, ((ratio - 1) / 1) * 100); // 2x increase = 100 score

  return { score };
}

/**
 * Calculate recurring issues score (0-100)
 * Checks for same reason code appearing multiple times
 */
function calculateRecurringIssues(aircraftEvents: AOGEvent[]): { score: number } {
  if (aircraftEvents.length < 2) {
    return { score: 0 };
  }

  // Count reason codes
  const reasonCounts = new Map<string, number>();
  aircraftEvents.forEach((e) => {
    if (e.reasonCode) {
      reasonCounts.set(e.reasonCode, (reasonCounts.get(e.reasonCode) || 0) + 1);
    }
  });

  // Find max occurrences
  let maxOccurrences = 0;
  reasonCounts.forEach((count) => {
    if (count > maxOccurrences) {
      maxOccurrences = count;
    }
  });

  // Score: 0 for no recurring issues, scales up to 100 for 5+ occurrences
  if (maxOccurrences <= 1) {
    return { score: 0 };
  }

  const score = Math.min(100, ((maxOccurrences - 1) / 4) * 100); // 5+ occurrences = 100 score

  return { score };
}

/**
 * Calculate risk scores for multiple aircraft
 */
export function calculateRiskScores(
  aircraft: Array<{ id: string; registration: string }>,
  events: AOGEvent[]
): RiskScoreResult[] {
  return aircraft.map((a) =>
    calculateRiskScore(a.id, a.registration, events, events)
  );
}

/**
 * Get top N high-risk aircraft
 */
export function getHighRiskAircraft(
  riskScores: RiskScoreResult[],
  topN: number = 3
): RiskScoreResult[] {
  return [...riskScores]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, topN)
    .filter((r) => r.riskScore > 30); // Only include medium/high risk
}
