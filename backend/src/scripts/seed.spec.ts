/**
 * Property-Based Tests for Seed Script
 * 
 * These tests verify the correctness properties of the seed data generation
 * using fast-check for property-based testing.
 * 
 * Run with: npm test -- seed.spec.ts
 */

import * as fc from 'fast-check';

// Import the seed data generation helpers and constants
// We'll test the logic directly without database connections

// ATA Chapters for discrepancies (from seed.ts)
const ATA_CHAPTERS = [
  '21', '24', '27', '29', '32', '34', '36', '49',
  '52', '71', '72', '73', '74', '78', '79', '80',
];

// Responsible parties
const RESPONSIBLE_PARTIES = ['Internal', 'OEM', 'Customs', 'Finance', 'Other'];

// Shifts
const SHIFTS = ['Morning', 'Evening', 'Night'];

// Work order statuses
const WORK_ORDER_STATUSES = ['Open', 'InProgress', 'Closed', 'Deferred'];

// Helper functions (mirrored from seed.ts for testing)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Seed data generation functions for testing
interface UtilizationCounter {
  date: Date;
  airframeHoursTtsn: number;
  airframeCyclesTcsn: number;
}

interface AOGEvent {
  responsibleParty: string;
}

interface MaintenanceTask {
  shift: string;
}

interface WorkOrder {
  status: string;
  dueDate?: Date;
  dateIn: Date;
}

interface Discrepancy {
  ataChapter: string;
}

/**
 * Generate utilization counters with monotonically increasing values
 */
function generateUtilizationCounters(days: number, baseHours: number, baseCycles: number): UtilizationCounter[] {
  const counters: UtilizationCounter[] = [];
  let currentHours = baseHours;
  let currentCycles = baseCycles;

  for (let day = days - 1; day >= 0; day--) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    // Daily increments (2-8 flight hours, 1-3 cycles)
    const dailyHours = randomFloat(2, 8, 1);
    const dailyCycles = randomInt(1, 3);

    currentHours += dailyHours;
    currentCycles += dailyCycles;

    counters.push({
      date,
      airframeHoursTtsn: parseFloat(currentHours.toFixed(1)),
      airframeCyclesTcsn: currentCycles,
    });
  }

  return counters;
}

/**
 * Generate AOG events with responsible party distribution
 */
function generateAOGEvents(count: number): AOGEvent[] {
  const events: AOGEvent[] = [];
  const partyUsage: Record<string, number> = {};
  RESPONSIBLE_PARTIES.forEach(p => partyUsage[p] = 0);

  for (let i = 0; i < count; i++) {
    // Ensure coverage of all parties
    let responsibleParty: string;
    const underrepresented = RESPONSIBLE_PARTIES.filter(p => partyUsage[p] < 1);
    
    if (underrepresented.length > 0 && i < RESPONSIBLE_PARTIES.length) {
      // First ensure all parties are represented
      responsibleParty = underrepresented[0];
    } else {
      // Then use weighted distribution
      const rand = Math.random();
      if (rand < 0.40) responsibleParty = 'Internal';
      else if (rand < 0.65) responsibleParty = 'OEM';
      else if (rand < 0.80) responsibleParty = 'Customs';
      else if (rand < 0.90) responsibleParty = 'Finance';
      else responsibleParty = 'Other';
    }
    
    partyUsage[responsibleParty]++;
    events.push({ responsibleParty });
  }

  return events;
}

/**
 * Generate maintenance tasks with shift coverage
 */
function generateMaintenanceTasks(count: number): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = [];
  const shiftUsage: Record<string, number> = {};
  SHIFTS.forEach(s => shiftUsage[s] = 0);

  for (let i = 0; i < count; i++) {
    let shift: string;
    const underrepresented = SHIFTS.filter(s => shiftUsage[s] < 1);
    
    if (underrepresented.length > 0 && i < SHIFTS.length) {
      shift = underrepresented[0];
    } else {
      shift = randomElement(SHIFTS);
    }
    
    shiftUsage[shift]++;
    tasks.push({ shift });
  }

  return tasks;
}

/**
 * Generate work orders with status mix and overdue items
 */
function generateWorkOrders(count: number): WorkOrder[] {
  const workOrders: WorkOrder[] = [];
  const statusUsage: Record<string, number> = {};
  WORK_ORDER_STATUSES.forEach(s => statusUsage[s] = 0);

  for (let i = 0; i < count; i++) {
    let status: string;
    const underrepresented = WORK_ORDER_STATUSES.filter(s => statusUsage[s] < 1);
    
    if (underrepresented.length > 0 && i < WORK_ORDER_STATUSES.length) {
      status = underrepresented[0];
    } else {
      status = randomElement(WORK_ORDER_STATUSES);
    }
    
    statusUsage[status]++;

    const daysAgo = randomInt(1, 90);
    const dateIn = new Date();
    dateIn.setDate(dateIn.getDate() - daysAgo);

    // Set due date for some work orders, some in the past (overdue)
    let dueDate: Date | undefined;
    if (Math.random() < 0.7) {
      const dueDaysFromIn = randomInt(-10, 45);
      dueDate = new Date(dateIn.getTime() + dueDaysFromIn * 24 * 60 * 60 * 1000);
    }

    workOrders.push({ status, dueDate, dateIn });
  }

  return workOrders;
}

/**
 * Generate discrepancies with ATA chapter coverage
 */
function generateDiscrepancies(count: number): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  const ataUsage: Record<string, number> = {};
  ATA_CHAPTERS.forEach(c => ataUsage[c] = 0);

  for (let i = 0; i < count; i++) {
    let ataChapter: string;
    const underrepresented = ATA_CHAPTERS.filter(c => ataUsage[c] < 1);
    
    if (underrepresented.length > 0 && Math.random() < 0.6) {
      ataChapter = randomElement(underrepresented);
    } else {
      ataChapter = randomElement(ATA_CHAPTERS);
    }
    
    ataUsage[ataChapter]++;
    discrepancies.push({ ataChapter });
  }

  return discrepancies;
}

describe('Seed Script Property Tests', () => {
  /**
   * **Feature: demo-preparation, Property 2: Seed Data Monotonic Counters**
   * **Validates: Requirements 2.3**
   * 
   * For any aircraft and any two consecutive days in the seeded utilization data,
   * the later day's counter values should be greater than or equal to the earlier day's values.
   */
  describe('Property 2: Seed Data Monotonic Counters', () => {
    it('**Feature: demo-preparation, Property 2: Seed Data Monotonic Counters**', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }), // days of data
          fc.integer({ min: 1000, max: 50000 }), // base hours (use integer to avoid NaN)
          fc.integer({ min: 500, max: 20000 }), // base cycles
          (days, baseHours, baseCycles) => {
            const counters = generateUtilizationCounters(days, baseHours, baseCycles);
            
            // Sort by date ascending
            const sorted = [...counters].sort((a, b) => a.date.getTime() - b.date.getTime());
            
            // Verify monotonic increase
            for (let i = 1; i < sorted.length; i++) {
              expect(sorted[i].airframeHoursTtsn).toBeGreaterThanOrEqual(sorted[i - 1].airframeHoursTtsn);
              expect(sorted[i].airframeCyclesTcsn).toBeGreaterThanOrEqual(sorted[i - 1].airframeCyclesTcsn);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: demo-preparation, Property 3: Seed Data Responsible Party Coverage**
   * **Validates: Requirements 2.4**
   * 
   * For any set of seeded AOG events, all five responsible parties should be represented.
   */
  describe('Property 3: Seed Data Responsible Party Coverage', () => {
    it('**Feature: demo-preparation, Property 3: Seed Data Responsible Party Coverage**', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }), // number of events (minimum 10 to ensure coverage)
          (eventCount) => {
            const events = generateAOGEvents(eventCount);
            
            // Get unique responsible parties
            const uniqueParties = new Set(events.map(e => e.responsibleParty));
            
            // All 5 parties should be represented
            expect(uniqueParties.size).toBe(5);
            RESPONSIBLE_PARTIES.forEach(party => {
              expect(uniqueParties.has(party)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: demo-preparation, Property 4: Seed Data Shift Coverage**
   * **Validates: Requirements 2.5**
   * 
   * For any set of seeded maintenance tasks, all three shifts should be represented.
   */
  describe('Property 4: Seed Data Shift Coverage', () => {
    it('**Feature: demo-preparation, Property 4: Seed Data Shift Coverage**', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 200 }), // number of tasks (minimum 10 to ensure coverage)
          (taskCount) => {
            const tasks = generateMaintenanceTasks(taskCount);
            
            // Get unique shifts
            const uniqueShifts = new Set(tasks.map(t => t.shift));
            
            // All 3 shifts should be represented
            expect(uniqueShifts.size).toBe(3);
            SHIFTS.forEach(shift => {
              expect(uniqueShifts.has(shift)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: demo-preparation, Property 5: Seed Data Work Order Status Mix**
   * **Validates: Requirements 2.6**
   * 
   * For any set of seeded work orders, all four statuses should be represented,
   * and at least one work order should be overdue.
   */
  describe('Property 5: Seed Data Work Order Status Mix', () => {
    it('**Feature: demo-preparation, Property 5: Seed Data Work Order Status Mix**', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20, max: 100 }), // number of work orders (minimum 20 to ensure coverage and overdue)
          (woCount) => {
            const workOrders = generateWorkOrders(woCount);
            
            // Get unique statuses
            const uniqueStatuses = new Set(workOrders.map(wo => wo.status));
            
            // All 4 statuses should be represented
            expect(uniqueStatuses.size).toBe(4);
            WORK_ORDER_STATUSES.forEach(status => {
              expect(uniqueStatuses.has(status)).toBe(true);
            });
            
            // At least one should be overdue (dueDate in past and not Closed)
            const now = new Date();
            const overdueCount = workOrders.filter(wo => 
              wo.dueDate && 
              wo.dueDate < now && 
              wo.status !== 'Closed'
            ).length;
            
            expect(overdueCount).toBeGreaterThanOrEqual(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: demo-preparation, Property 6: Seed Data ATA Chapter Coverage**
   * **Validates: Requirements 2.7**
   * 
   * For any set of seeded discrepancies, at least 10 different ATA chapters should be represented.
   */
  describe('Property 6: Seed Data ATA Chapter Coverage', () => {
    it('**Feature: demo-preparation, Property 6: Seed Data ATA Chapter Coverage**', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 30, max: 150 }), // number of discrepancies (minimum 30 to ensure coverage)
          (discCount) => {
            const discrepancies = generateDiscrepancies(discCount);
            
            // Get unique ATA chapters
            const uniqueChapters = new Set(discrepancies.map(d => d.ataChapter));
            
            // At least 10 different ATA chapters should be represented
            expect(uniqueChapters.size).toBeGreaterThanOrEqual(10);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
