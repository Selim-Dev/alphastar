/**
 * Database Seed Script
 * Seeds the database with:
 * - Default admin user
 * - Aircraft master data from Alpha Star fleet
 * - Sample budget plan based on RSAF budget structure
 * - 90 days of daily status records (availability)
 * - 90 days of utilization counter records
 * - AOG events with varied responsible parties
 * - Maintenance tasks across all shifts
 * - Work orders with mixed statuses
 * - Discrepancies across ATA chapters
 * - Actual spend records with variance patterns
 *
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/seed.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

// Import schemas
import { User, UserDocument, UserRole, UserSchema } from '../auth/schemas/user.schema';
import { Aircraft, AircraftDocument, AircraftStatus, AircraftSchema } from '../aircraft/schemas/aircraft.schema';
import { BudgetPlan, BudgetPlanDocument, BudgetPlanSchema } from '../budget/schemas/budget-plan.schema';
import { DailyStatus, DailyStatusDocument, DailyStatusSchema } from '../daily-status/schemas/daily-status.schema';
import { DailyCounter, DailyCounterDocument, DailyCounterSchema } from '../utilization/schemas/daily-counter.schema';
import { AOGEvent, AOGEventDocument, AOGEventSchema, ResponsibleParty, AOGCategory } from '../aog-events/schemas/aog-event.schema';
import { MaintenanceTask, MaintenanceTaskDocument, MaintenanceTaskSchema, Shift } from '../maintenance-tasks/schemas/maintenance-task.schema';
import { WorkOrder, WorkOrderDocument, WorkOrderSchema, WorkOrderStatus } from '../work-orders/schemas/work-order.schema';
import { Discrepancy, DiscrepancyDocument, DiscrepancySchema, ResponsibleParty as DiscrepancyResponsibleParty } from '../discrepancies/schemas/discrepancy.schema';
import { ActualSpend, ActualSpendDocument, ActualSpendSchema } from '../budget/schemas/actual-spend.schema';

// Seed configuration
const SEED_CONFIG = {
  daysOfData: 90,
  aogEventsPerAircraft: { min: 3, max: 5 },
  workOrdersPerAircraft: { min: 5, max: 10 },
  discrepanciesPerAircraft: { min: 3, max: 8 },
  maintenanceTasksPerDay: { min: 3, max: 8 },
};

// Seed data
const ADMIN_USER = {
  email: 'admin@alphastarav.com',
  password: 'Admin@123!',
  name: 'System Administrator',
  role: UserRole.Admin,
};

const EDITOR_USER = {
  email: 'editor@alphastarav.com',
  password: 'Editor@123!',
  name: 'Operations Editor',
  role: UserRole.Editor,
};

const VIEWER_USER = {
  email: 'viewer@alphastarav.com',
  password: 'Viewer@123!',
  name: 'Dashboard Viewer',
  role: UserRole.Viewer,
};

// Aircraft fleet data from Alpha Star fleet analysis
const AIRCRAFT_DATA: Partial<Aircraft>[] = [
  // A340 Fleet
  {
    registration: 'HZ-A42',
    fleetGroup: 'A340',
    aircraftType: 'A340-642',
    msn: '1015',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2010-01-15'),
    enginesCount: 4,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SKY1',
    fleetGroup: 'A340',
    aircraftType: 'A340-212',
    msn: '0089',
    owner: 'Sky Prime Aviation',
    manufactureDate: new Date('1995-06-20'),
    enginesCount: 4,
    status: AircraftStatus.Active,
  },
  // A330 Fleet
  {
    registration: 'HZ-SKY2',
    fleetGroup: 'A330',
    aircraftType: 'A330-243',
    msn: '0456',
    owner: 'Sky Prime Aviation',
    manufactureDate: new Date('2008-03-10'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  // A320 Family Fleet
  {
    registration: 'HZ-A2',
    fleetGroup: 'A320',
    aircraftType: 'A320-214',
    msn: '2345',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2005-08-12'),
    enginesCount: 2,
    status: AircraftStatus.Parked,
  },
  {
    registration: 'HZ-A3',
    fleetGroup: 'A320',
    aircraftType: 'A320-214',
    msn: '1234',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2003-04-22'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A4',
    fleetGroup: 'A319',
    aircraftType: 'A319-112',
    msn: '1567',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2004-11-05'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A5',
    fleetGroup: 'A318',
    aircraftType: 'A318-112',
    msn: '2890',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2007-02-18'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A15',
    fleetGroup: 'A320',
    aircraftType: 'A320-216',
    msn: '3456',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2002-09-30'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-SKY4',
    fleetGroup: 'A319',
    aircraftType: 'A319-115',
    msn: '4567',
    owner: 'Sky Prime Aviation',
    manufactureDate: new Date('2015-07-14'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  // Hawker Fleet
  {
    registration: 'HZ-A8',
    fleetGroup: 'Hawker',
    aircraftType: 'Hawker 900XP',
    msn: '5678',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2010-05-25'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A9',
    fleetGroup: 'Hawker',
    aircraftType: 'Hawker 900XP',
    msn: '5679',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2011-03-15'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  // Gulfstream Fleet
  {
    registration: 'HZ-A22',
    fleetGroup: 'G650ER',
    aircraftType: 'Gulfstream G650ER',
    msn: '6234',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2018-08-20'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-A23',
    fleetGroup: 'G650ER',
    aircraftType: 'Gulfstream G650ER',
    msn: '6235',
    owner: 'Alpha Star Aviation',
    manufactureDate: new Date('2019-01-10'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  // Cessna Citation Bravo Fleet (RSAF)
  {
    registration: 'HZ-133',
    fleetGroup: 'Cessna',
    aircraftType: 'Citation Bravo',
    msn: '550-1115',
    owner: 'RSAF',
    manufactureDate: new Date('2000-06-15'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-134',
    fleetGroup: 'Cessna',
    aircraftType: 'Citation Bravo',
    msn: '550-1116',
    owner: 'RSAF',
    manufactureDate: new Date('2000-07-20'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-135',
    fleetGroup: 'Cessna',
    aircraftType: 'Citation Bravo',
    msn: '550-1126',
    owner: 'RSAF',
    manufactureDate: new Date('2001-02-10'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
  {
    registration: 'HZ-136',
    fleetGroup: 'Cessna',
    aircraftType: 'Citation Bravo',
    msn: '550-1127',
    owner: 'RSAF',
    manufactureDate: new Date('2001-03-25'),
    enginesCount: 2,
    status: AircraftStatus.Active,
  },
];


// Budget plan data based on RSAF budget structure
const BUDGET_CLAUSES = [
  { clauseId: 1, clauseDescription: 'Aircraft Lease' },
  { clauseId: 2, clauseDescription: 'Airframe Maintenance' },
  { clauseId: 3, clauseDescription: 'Engines and APU Corporate Care Program' },
  { clauseId: 4, clauseDescription: 'Landing Gear Overhaul' },
  { clauseId: 5, clauseDescription: 'Component Repair' },
  { clauseId: 6, clauseDescription: 'Spare Parts' },
  { clauseId: 7, clauseDescription: 'Consumables' },
  { clauseId: 8, clauseDescription: 'Ground Support Equipment' },
  { clauseId: 9, clauseDescription: 'Fuel' },
  { clauseId: 10, clauseDescription: 'Subscriptions' },
  { clauseId: 11, clauseDescription: 'Insurance' },
  { clauseId: 12, clauseDescription: 'Cabin Crew' },
  { clauseId: 13, clauseDescription: 'Manpower' },
  { clauseId: 14, clauseDescription: 'Handling and Permits' },
  { clauseId: 15, clauseDescription: 'Catering' },
  { clauseId: 16, clauseDescription: 'Communication' },
  { clauseId: 17, clauseDescription: 'Miscellaneous' },
  { clauseId: 18, clauseDescription: 'Training' },
];

const AIRCRAFT_GROUPS = ['A330', 'G650ER', 'Cessna', 'PMO'];

// Sample budget amounts (in USD) per clause per aircraft group
const BUDGET_AMOUNTS: Record<string, Record<number, number>> = {
  'A330': {
    1: 2500000, 2: 1800000, 3: 2200000, 4: 800000, 5: 600000,
    6: 3500000, 7: 250000, 8: 150000, 9: 1600000, 10: 2200000,
    11: 1700000, 12: 1500000, 13: 1600000, 14: 400000, 15: 300000,
    16: 100000, 17: 200000, 18: 2000000,
  },
  'G650ER': {
    1: 3000000, 2: 1200000, 3: 1800000, 4: 500000, 5: 400000,
    6: 2500000, 7: 180000, 8: 100000, 9: 1200000, 10: 1800000,
    11: 1400000, 12: 1200000, 13: 1300000, 14: 350000, 15: 250000,
    16: 80000, 17: 150000, 18: 1600000,
  },
  'Cessna': {
    1: 800000, 2: 600000, 3: 900000, 4: 300000, 5: 250000,
    6: 1200000, 7: 100000, 8: 80000, 9: 500000, 10: 800000,
    11: 600000, 12: 500000, 13: 600000, 14: 200000, 15: 150000,
    16: 50000, 17: 100000, 18: 800000,
  },
  'PMO': {
    1: 0, 2: 200000, 3: 0, 4: 0, 5: 100000,
    6: 300000, 7: 50000, 8: 50000, 9: 0, 10: 400000,
    11: 200000, 12: 0, 13: 500000, 14: 100000, 15: 50000,
    16: 30000, 17: 100000, 18: 400000,
  },
};

// ATA Chapters for discrepancies
const ATA_CHAPTERS = [
  '21', // Air Conditioning
  '24', // Electrical Power
  '27', // Flight Controls
  '29', // Hydraulic Power
  '32', // Landing Gear
  '34', // Navigation
  '36', // Pneumatic
  '49', // APU
  '52', // Doors
  '71', // Power Plant
  '72', // Engine
  '73', // Engine Fuel
  '74', // Ignition
  '78', // Exhaust
  '79', // Oil
  '80', // Starting
];

// Maintenance task types
const TASK_TYPES = [
  'Routine Inspection',
  'Scheduled Maintenance',
  'Component Replacement',
  'System Check',
  'Lubrication',
  'Cleaning',
  'Calibration',
  'Software Update',
  'Structural Inspection',
  'Engine Inspection',
];

// AOG reason codes
const AOG_REASON_CODES = [
  'Engine failure',
  'Hydraulic leak',
  'Avionics malfunction',
  'Landing gear issue',
  'Fuel system problem',
  'Electrical fault',
  'Structural damage',
  'APU failure',
  'Pressurization issue',
  'Navigation system error',
];

// Work order descriptions
const WORK_ORDER_DESCRIPTIONS = [
  'Annual inspection',
  'Engine overhaul',
  'Landing gear service',
  'Avionics upgrade',
  'Interior refurbishment',
  'Paint touch-up',
  'Hydraulic system service',
  'Fuel tank inspection',
  'Structural repair',
  'Component replacement',
];

// Discrepancy texts
const DISCREPANCY_TEXTS = [
  'Abnormal vibration detected',
  'Oil leak observed',
  'Warning light illuminated',
  'Unusual noise during operation',
  'Pressure reading out of range',
  'Temperature exceeding limits',
  'Component wear detected',
  'Corrosion found',
  'Crack discovered during inspection',
  'System malfunction reported',
];

// Corrective actions
const CORRECTIVE_ACTIONS = [
  'Component replaced',
  'System recalibrated',
  'Leak sealed',
  'Part repaired',
  'Software updated',
  'Adjustment made',
  'Cleaned and lubricated',
  'Defective unit removed',
];

// Vendor names for actual spend
const VENDORS = [
  'Airbus Services',
  'Boeing Support',
  'Rolls-Royce',
  'Pratt & Whitney',
  'Honeywell',
  'Collins Aerospace',
  'Safran',
  'GE Aviation',
  'Local MRO',
  'Parts Supplier Co',
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatPeriod(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Create seed module
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Aircraft.name, schema: AircraftSchema },
      { name: BudgetPlan.name, schema: BudgetPlanSchema },
      { name: DailyStatus.name, schema: DailyStatusSchema },
      { name: DailyCounter.name, schema: DailyCounterSchema },
      { name: AOGEvent.name, schema: AOGEventSchema },
      { name: MaintenanceTask.name, schema: MaintenanceTaskSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: Discrepancy.name, schema: DiscrepancySchema },
      { name: ActualSpend.name, schema: ActualSpendSchema },
    ]),
  ],
})
class SeedModule {}

class Seeder {
  private adminUserId!: Types.ObjectId;

  constructor(
    private userModel: Model<UserDocument>,
    private aircraftModel: Model<AircraftDocument>,
    private budgetPlanModel: Model<BudgetPlanDocument>,
    private dailyStatusModel: Model<DailyStatusDocument>,
    private dailyCounterModel: Model<DailyCounterDocument>,
    private aogEventModel: Model<AOGEventDocument>,
    private maintenanceTaskModel: Model<MaintenanceTaskDocument>,
    private workOrderModel: Model<WorkOrderDocument>,
    private discrepancyModel: Model<DiscrepancyDocument>,
    private actualSpendModel: Model<ActualSpendDocument>,
  ) {}

  async seedUsers(): Promise<void> {
    console.log('🔐 Seeding users...');
    const users = [ADMIN_USER, EDITOR_USER, VIEWER_USER];

    for (const userData of users) {
      let existingUser = await this.userModel.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`  ⏭️  User ${userData.email} already exists, skipping...`);
        if (userData.role === UserRole.Admin) {
          this.adminUserId = existingUser._id as Types.ObjectId;
        }
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 10);
      const newUser = await this.userModel.create({
        email: userData.email,
        passwordHash,
        name: userData.name,
        role: userData.role,
      });
      console.log(`  ✅ Created user: ${userData.email} (${userData.role})`);
      
      if (userData.role === UserRole.Admin) {
        this.adminUserId = newUser._id as Types.ObjectId;
      }
    }

    // Ensure we have an admin user ID for other seeds
    if (!this.adminUserId) {
      const admin = await this.userModel.findOne({ role: UserRole.Admin });
      if (!admin) {
        throw new Error('No admin user found. Cannot proceed with seeding.');
      }
      this.adminUserId = admin._id as Types.ObjectId;
    }
  }

  async seedAircraft(): Promise<AircraftDocument[]> {
    console.log('✈️  Seeding aircraft...');
    const createdAircraft: AircraftDocument[] = [];

    for (const aircraft of AIRCRAFT_DATA) {
      let existing = await this.aircraftModel.findOne({ registration: aircraft.registration });
      if (existing) {
        console.log(`  ⏭️  Aircraft ${aircraft.registration} already exists, skipping...`);
        createdAircraft.push(existing);
        continue;
      }

      const newAircraft = await this.aircraftModel.create(aircraft);
      console.log(`  ✅ Created aircraft: ${aircraft.registration} (${aircraft.aircraftType})`);
      createdAircraft.push(newAircraft);
    }

    return createdAircraft;
  }

  async seedBudgetPlans(): Promise<void> {
    console.log('💰 Seeding budget plans...');
    const fiscalYear = new Date().getFullYear();

    for (const group of AIRCRAFT_GROUPS) {
      for (const clause of BUDGET_CLAUSES) {
        const existing = await this.budgetPlanModel.findOne({
          fiscalYear,
          clauseId: clause.clauseId,
          aircraftGroup: group,
        });

        if (existing) {
          continue;
        }

        const plannedAmount = BUDGET_AMOUNTS[group]?.[clause.clauseId] || 0;
        await this.budgetPlanModel.create({
          fiscalYear,
          clauseId: clause.clauseId,
          clauseDescription: clause.clauseDescription,
          aircraftGroup: group,
          plannedAmount,
          currency: 'USD',
        });
      }
      console.log(`  ✅ Created budget plans for ${group} (${BUDGET_CLAUSES.length} clauses)`);
    }
  }

  /**
   * Seed daily status records for 90 days per aircraft
   * Requirements: 2.2 - FMC hours between 18-24, occasional downtime
   */
  async seedDailyStatus(aircraft: AircraftDocument[]): Promise<void> {
    console.log('📊 Seeding daily status records...');
    let totalCreated = 0;

    for (const ac of aircraft) {
      for (let day = 0; day < SEED_CONFIG.daysOfData; day++) {
        const date = getDateDaysAgo(day);
        
        const existing = await this.dailyStatusModel.findOne({
          aircraftId: ac._id,
          date,
        });
        if (existing) continue;

        // Generate realistic availability data
        const posHours = 24;
        let nmcmSHours = 0;
        let nmcmUHours = 0;

        // 15% chance of scheduled maintenance (0-4 hours)
        if (Math.random() < 0.15) {
          nmcmSHours = randomFloat(1, 4, 1);
        }

        // 8% chance of unscheduled maintenance (0-2 hours)
        if (Math.random() < 0.08) {
          nmcmUHours = randomFloat(0.5, 2, 1);
        }

        const fmcHours = Math.max(18, posHours - nmcmSHours - nmcmUHours);

        await this.dailyStatusModel.create({
          aircraftId: ac._id,
          date,
          posHours,
          fmcHours,
          nmcmSHours,
          nmcmUHours,
          updatedBy: this.adminUserId,
        });
        totalCreated++;
      }
    }
    console.log(`  ✅ Created ${totalCreated} daily status records`);
  }

  /**
   * Seed utilization counter records for 90 days per aircraft
   * Requirements: 2.3 - Monotonically increasing counters, 2-8 FH/day
   */
  async seedUtilizationCounters(aircraft: AircraftDocument[]): Promise<void> {
    console.log('⏱️  Seeding utilization counters...');
    let totalCreated = 0;

    for (const ac of aircraft) {
      // Start with base values based on aircraft age
      const yearsOld = (new Date().getTime() - new Date(ac.manufactureDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      let baseHours = yearsOld * 800 + randomInt(1000, 5000); // Approx 800 FH/year
      let baseCycles = yearsOld * 300 + randomInt(500, 2000); // Approx 300 cycles/year
      let engineHours = baseHours * 0.95;
      let engineCycles = baseCycles * 0.95;
      let apuHours = baseHours * 0.3;

      // Generate records from oldest to newest to ensure monotonic increase
      for (let day = SEED_CONFIG.daysOfData - 1; day >= 0; day--) {
        const date = getDateDaysAgo(day);
        
        const existing = await this.dailyCounterModel.findOne({
          aircraftId: ac._id,
          date,
        });
        if (existing) continue;

        // Daily increments (2-8 flight hours, 1-3 cycles)
        const dailyHours = randomFloat(2, 8, 1);
        const dailyCycles = randomInt(1, 3);

        baseHours += dailyHours;
        baseCycles += dailyCycles;
        engineHours += dailyHours * 0.98;
        engineCycles += dailyCycles;
        apuHours += dailyHours * 0.4;

        const counterData: Partial<DailyCounter> = {
          aircraftId: ac._id as Types.ObjectId,
          date,
          airframeHoursTtsn: parseFloat(baseHours.toFixed(1)),
          airframeCyclesTcsn: baseCycles,
          engine1Hours: parseFloat(engineHours.toFixed(1)),
          engine1Cycles: engineCycles,
          engine2Hours: parseFloat((engineHours * 0.99).toFixed(1)),
          engine2Cycles: engineCycles,
          apuHours: parseFloat(apuHours.toFixed(1)),
          lastFlightDate: date,
          updatedBy: this.adminUserId as Types.ObjectId,
        };

        // Add engine 3/4 for 4-engine aircraft
        if (ac.enginesCount === 4) {
          counterData.engine3Hours = parseFloat((engineHours * 0.98).toFixed(1));
          counterData.engine3Cycles = engineCycles;
          counterData.engine4Hours = parseFloat((engineHours * 0.97).toFixed(1));
          counterData.engine4Cycles = engineCycles;
        }

        await this.dailyCounterModel.create(counterData);
        totalCreated++;
      }
    }
    console.log(`  ✅ Created ${totalCreated} utilization counter records`);
  }

  /**
   * Seed AOG events with varied responsible parties and milestone timestamps
   * Requirements: 2.4 - All 5 responsible parties represented
   * Requirements: 8.1, 8.3, 8.5 - Diverse AOG events for three-bucket analytics demo
   */
  async seedAOGEvents(aircraft: AircraftDocument[]): Promise<void> {
    console.log('🚨 Seeding AOG events with milestone timestamps...');
    let totalCreated = 0;
    const responsibleParties = Object.values(ResponsibleParty);
    const partyUsage: Record<string, number> = {};
    responsibleParties.forEach(p => partyUsage[p] = 0);

    // Track scenario distribution for demo purposes
    const scenarioCounts = {
      longProcurement: 0,
      immediatePart: 0,
      noPart: 0,
      withOpsTest: 0,
      withoutOpsTest: 0,
    };

    for (const ac of aircraft) {
      const eventCount = randomInt(SEED_CONFIG.aogEventsPerAircraft.min, SEED_CONFIG.aogEventsPerAircraft.max);
      
      for (let i = 0; i < eventCount; i++) {
        // Distribute events across the 90-day period
        const daysAgo = randomInt(1, SEED_CONFIG.daysOfData - 1);
        const detectedAt = getDateDaysAgo(daysAgo);
        
        // Select responsible party - ensure coverage
        let responsibleParty: ResponsibleParty;
        const underrepresented = responsibleParties.filter(p => partyUsage[p] < 2);
        if (underrepresented.length > 0 && Math.random() < 0.5) {
          responsibleParty = randomElement(underrepresented);
        } else {
          // Weighted distribution: Internal 40%, OEM 25%, Customs 15%, Finance 10%, Other 10%
          const rand = Math.random();
          if (rand < 0.40) responsibleParty = ResponsibleParty.Internal;
          else if (rand < 0.65) responsibleParty = ResponsibleParty.OEM;
          else if (rand < 0.80) responsibleParty = ResponsibleParty.Customs;
          else if (rand < 0.90) responsibleParty = ResponsibleParty.Finance;
          else responsibleParty = ResponsibleParty.Other;
        }
        partyUsage[responsibleParty]++;

        const categories = Object.values(AOGCategory);
        
        // Determine scenario type for this event
        const scenarioRand = Math.random();
        let scenario: 'longProcurement' | 'immediatePart' | 'noPart' | 'standard';
        
        if (scenarioRand < 0.25) {
          scenario = 'longProcurement'; // Long procurement delay
          scenarioCounts.longProcurement++;
        } else if (scenarioRand < 0.45) {
          scenario = 'immediatePart'; // Part already in store
          scenarioCounts.immediatePart++;
        } else if (scenarioRand < 0.60) {
          scenario = 'noPart'; // No part needed
          scenarioCounts.noPart++;
        } else {
          scenario = 'standard'; // Standard flow
        }

        // Determine if ops testing is required (60% yes, 40% no)
        const requiresOpsTest = Math.random() < 0.6;
        if (requiresOpsTest) {
          scenarioCounts.withOpsTest++;
        } else {
          scenarioCounts.withoutOpsTest++;
        }

        // Build milestone timestamps based on scenario
        const reportedAt = new Date(detectedAt);
        let procurementRequestedAt: Date | undefined;
        let availableAtStoreAt: Date | undefined;
        let issuedBackAt: Date | undefined;
        let installationCompleteAt: Date | undefined;
        let testStartAt: Date | undefined;
        let upAndRunningAt: Date | undefined;

        let currentTime = reportedAt.getTime();

        // Technical Time Phase 1: Troubleshooting (1-8 hours)
        const troubleshootingHours = randomFloat(1, 8, 1);
        currentTime += troubleshootingHours * 60 * 60 * 1000;

        if (scenario === 'noPart') {
          // No part needed - skip procurement entirely
          // Technical Time continues: Installation/repair (2-12 hours)
          const repairHours = randomFloat(2, 12, 1);
          currentTime += repairHours * 60 * 60 * 1000;
          installationCompleteAt = new Date(currentTime);
        } else {
          // Part required
          procurementRequestedAt = new Date(currentTime);

          if (scenario === 'immediatePart') {
            // Part in store - minimal procurement time (0.5-2 hours)
            const storeRetrievalHours = randomFloat(0.5, 2, 1);
            currentTime += storeRetrievalHours * 60 * 60 * 1000;
            availableAtStoreAt = new Date(currentTime);
          } else if (scenario === 'longProcurement') {
            // Long procurement delay (48-168 hours = 2-7 days)
            const procurementHours = randomFloat(48, 168, 1);
            currentTime += procurementHours * 60 * 60 * 1000;
            availableAtStoreAt = new Date(currentTime);
          } else {
            // Standard procurement (12-48 hours)
            const procurementHours = randomFloat(12, 48, 1);
            currentTime += procurementHours * 60 * 60 * 1000;
            availableAtStoreAt = new Date(currentTime);
          }

          // Issue part to maintenance (0.5-2 hours)
          const issueHours = randomFloat(0.5, 2, 1);
          currentTime += issueHours * 60 * 60 * 1000;
          issuedBackAt = new Date(currentTime);

          // Technical Time Phase 2: Installation (2-16 hours)
          const installationHours = randomFloat(2, 16, 1);
          currentTime += installationHours * 60 * 60 * 1000;
          installationCompleteAt = new Date(currentTime);
        }

        // Ops Testing Phase (if required)
        if (requiresOpsTest) {
          testStartAt = new Date(currentTime);
          // Ops Time: Testing (1-8 hours)
          const testingHours = randomFloat(1, 8, 1);
          currentTime += testingHours * 60 * 60 * 1000;
        }

        upAndRunningAt = new Date(currentTime);
        const clearedAt = upAndRunningAt;

        // Calculate computed metrics
        const totalDowntimeHours = (upAndRunningAt.getTime() - reportedAt.getTime()) / (1000 * 60 * 60);
        
        let technicalTimeHours = troubleshootingHours;
        if (scenario === 'noPart') {
          // No procurement - all time after troubleshooting is technical
          const repairTime = (installationCompleteAt!.getTime() - (reportedAt.getTime() + troubleshootingHours * 60 * 60 * 1000)) / (1000 * 60 * 60);
          technicalTimeHours += repairTime;
        } else {
          // With procurement - technical time is installation phase
          const installTime = (installationCompleteAt!.getTime() - (issuedBackAt?.getTime() || availableAtStoreAt!.getTime())) / (1000 * 60 * 60);
          technicalTimeHours += installTime;
        }

        const procurementTimeHours = procurementRequestedAt && availableAtStoreAt
          ? (availableAtStoreAt.getTime() - procurementRequestedAt.getTime()) / (1000 * 60 * 60)
          : 0;

        const opsTimeHours = testStartAt && upAndRunningAt
          ? (upAndRunningAt.getTime() - testStartAt.getTime()) / (1000 * 60 * 60)
          : 0;

        // Generate costs
        const internalCost = randomInt(5000, 50000);
        const externalCost = scenario === 'noPart' ? 0 : randomInt(10000, 200000);

        await this.aogEventModel.create({
          aircraftId: ac._id,
          detectedAt,
          clearedAt: Math.random() < 0.9 ? clearedAt : undefined, // 10% still active
          category: randomElement(categories),
          reasonCode: randomElement(AOG_REASON_CODES),
          responsibleParty,
          actionTaken: `Resolved ${randomElement(AOG_REASON_CODES).toLowerCase()} issue`,
          manpowerCount: randomInt(2, 8),
          manHours: Math.round(totalDowntimeHours * randomFloat(0.3, 0.7, 2)),
          costLabor: internalCost,
          costParts: externalCost,
          costExternal: Math.random() < 0.3 ? randomInt(5000, 100000) : undefined,
          // NEW: Milestone timestamps
          reportedAt,
          procurementRequestedAt,
          availableAtStoreAt,
          issuedBackAt,
          installationCompleteAt,
          testStartAt,
          upAndRunningAt: Math.random() < 0.9 ? upAndRunningAt : undefined,
          // NEW: Computed metrics
          technicalTimeHours: parseFloat(technicalTimeHours.toFixed(2)),
          procurementTimeHours: parseFloat(procurementTimeHours.toFixed(2)),
          opsTimeHours: parseFloat(opsTimeHours.toFixed(2)),
          totalDowntimeHours: parseFloat(totalDowntimeHours.toFixed(2)),
          // NEW: Simplified costs
          internalCost,
          externalCost,
          updatedBy: this.adminUserId,
        });
        totalCreated++;
      }
    }
    console.log(`  ✅ Created ${totalCreated} AOG events`);
    console.log(`  📊 Party distribution: ${JSON.stringify(partyUsage)}`);
    console.log(`  📊 Scenario distribution:`);
    console.log(`     - Long procurement delays: ${scenarioCounts.longProcurement}`);
    console.log(`     - Immediate part availability: ${scenarioCounts.immediatePart}`);
    console.log(`     - No parts needed: ${scenarioCounts.noPart}`);
    console.log(`     - With ops testing: ${scenarioCounts.withOpsTest}`);
    console.log(`     - Without ops testing: ${scenarioCounts.withoutOpsTest}`);
  }

  /**
   * Seed maintenance tasks across all shifts
   * Requirements: 2.5 - All shifts represented
   */
  async seedMaintenanceTasks(aircraft: AircraftDocument[], workOrders: WorkOrderDocument[]): Promise<void> {
    console.log('🔧 Seeding maintenance tasks...');
    let totalCreated = 0;
    const shifts = [Shift.Morning, Shift.Evening, Shift.Night];
    const shiftUsage: Record<string, number> = {};
    shifts.forEach(s => shiftUsage[s] = 0);

    // Create tasks for random days
    const daysToSeed = randomInt(30, 60);
    
    for (let d = 0; d < daysToSeed; d++) {
      const date = getDateDaysAgo(randomInt(0, SEED_CONFIG.daysOfData - 1));
      const tasksForDay = randomInt(SEED_CONFIG.maintenanceTasksPerDay.min, SEED_CONFIG.maintenanceTasksPerDay.max);
      
      for (let t = 0; t < tasksForDay; t++) {
        const ac = randomElement(aircraft);
        
        // Ensure shift coverage
        let shift: Shift;
        const underrepresented = shifts.filter(s => shiftUsage[s] < 10);
        if (underrepresented.length > 0 && Math.random() < 0.3) {
          shift = randomElement(underrepresented);
        } else {
          shift = randomElement(shifts);
        }
        shiftUsage[shift]++;

        const taskType = randomElement(TASK_TYPES);
        
        await this.maintenanceTaskModel.create({
          aircraftId: ac._id,
          date,
          shift,
          taskType,
          taskDescription: `${taskType} on ${ac.registration} - ${ac.aircraftType}`,
          manpowerCount: randomInt(1, 4),
          manHours: randomFloat(1, 8, 1),
          cost: randomInt(500, 15000),
          workOrderRef: Math.random() < 0.3 && workOrders.length > 0 
            ? randomElement(workOrders)._id as Types.ObjectId 
            : undefined,
          updatedBy: this.adminUserId,
        });
        totalCreated++;
      }
    }
    console.log(`  ✅ Created ${totalCreated} maintenance tasks`);
    console.log(`  📊 Shift distribution: ${JSON.stringify(shiftUsage)}`);
  }

  /**
   * Seed work orders with mixed statuses
   * Requirements: 2.6 - All statuses, some overdue
   */
  async seedWorkOrders(aircraft: AircraftDocument[]): Promise<WorkOrderDocument[]> {
    console.log('📋 Seeding work orders...');
    const createdWorkOrders: WorkOrderDocument[] = [];
    const statuses = Object.values(WorkOrderStatus);
    const statusUsage: Record<string, number> = {};
    statuses.forEach(s => statusUsage[s] = 0);
    let overdueCount = 0;

    for (const ac of aircraft) {
      const woCount = randomInt(SEED_CONFIG.workOrdersPerAircraft.min, SEED_CONFIG.workOrdersPerAircraft.max);
      
      for (let i = 0; i < woCount; i++) {
        const woNumber = `WO-${ac.registration}-${Date.now()}-${i}`;
        
        // Check if exists
        const existing = await this.workOrderModel.findOne({ woNumber });
        if (existing) continue;

        const daysAgo = randomInt(1, SEED_CONFIG.daysOfData);
        const dateIn = getDateDaysAgo(daysAgo);
        
        // Ensure status coverage
        let status: WorkOrderStatus;
        const underrepresented = statuses.filter(s => statusUsage[s] < 3);
        if (underrepresented.length > 0 && Math.random() < 0.4) {
          status = randomElement(underrepresented);
        } else {
          status = randomElement(statuses);
        }
        statusUsage[status]++;

        // Set dates based on status
        let dateOut: Date | undefined;
        let dueDate: Date | undefined;
        
        if (status === WorkOrderStatus.Closed) {
          dateOut = new Date(dateIn.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000);
        }
        
        // Set due date for some work orders
        if (Math.random() < 0.7) {
          const dueDaysFromIn = randomInt(-5, 45); // Some in past (overdue), some in future
          dueDate = new Date(dateIn.getTime() + dueDaysFromIn * 24 * 60 * 60 * 1000);
          
          // Check if overdue
          if (dueDate < new Date() && status !== WorkOrderStatus.Closed) {
            overdueCount++;
          }
        }

        const wo = await this.workOrderModel.create({
          woNumber,
          aircraftId: ac._id,
          description: randomElement(WORK_ORDER_DESCRIPTIONS),
          status,
          dateIn,
          dateOut,
          dueDate,
          crsNumber: status === WorkOrderStatus.Closed ? `CRS-${randomInt(10000, 99999)}` : undefined,
          mrNumber: `MR-${randomInt(1000, 9999)}`,
          updatedBy: this.adminUserId,
        });
        createdWorkOrders.push(wo);
      }
    }
    console.log(`  ✅ Created ${createdWorkOrders.length} work orders`);
    console.log(`  📊 Status distribution: ${JSON.stringify(statusUsage)}`);
    console.log(`  ⚠️  Overdue work orders: ${overdueCount}`);
    
    return createdWorkOrders;
  }

  /**
   * Seed discrepancies across ATA chapters
   * Requirements: 2.7 - At least 10 different ATA chapters
   */
  async seedDiscrepancies(aircraft: AircraftDocument[]): Promise<void> {
    console.log('⚠️  Seeding discrepancies...');
    let totalCreated = 0;
    const ataUsage: Record<string, number> = {};
    ATA_CHAPTERS.forEach(c => ataUsage[c] = 0);

    for (const ac of aircraft) {
      const discCount = randomInt(SEED_CONFIG.discrepanciesPerAircraft.min, SEED_CONFIG.discrepanciesPerAircraft.max);
      
      for (let i = 0; i < discCount; i++) {
        const daysAgo = randomInt(1, SEED_CONFIG.daysOfData);
        const dateDetected = getDateDaysAgo(daysAgo);
        
        // Ensure ATA chapter coverage
        let ataChapter: string;
        const underrepresented = ATA_CHAPTERS.filter(c => ataUsage[c] < 2);
        if (underrepresented.length > 0 && Math.random() < 0.4) {
          ataChapter = randomElement(underrepresented);
        } else {
          ataChapter = randomElement(ATA_CHAPTERS);
        }
        ataUsage[ataChapter]++;

        // 70% have been corrected
        const isCorrected = Math.random() < 0.7;
        const dateCorrected = isCorrected 
          ? new Date(dateDetected.getTime() + randomInt(1, 14) * 24 * 60 * 60 * 1000)
          : undefined;

        await this.discrepancyModel.create({
          aircraftId: ac._id,
          dateDetected,
          ataChapter,
          discrepancyText: `${randomElement(DISCREPANCY_TEXTS)} - ATA ${ataChapter}`,
          dateCorrected,
          correctiveAction: isCorrected ? randomElement(CORRECTIVE_ACTIONS) : undefined,
          responsibility: randomElement(Object.values(DiscrepancyResponsibleParty)),
          downtimeHours: randomFloat(0.5, 24, 1),
          updatedBy: this.adminUserId,
        });
        totalCreated++;
      }
    }
    
    const uniqueChapters = Object.keys(ataUsage).filter(c => ataUsage[c] > 0).length;
    console.log(`  ✅ Created ${totalCreated} discrepancies`);
    console.log(`  📊 ATA chapters covered: ${uniqueChapters}`);
  }

  /**
   * Seed actual spend records with variance patterns
   * Requirements: 2.8 - 12 months, variance patterns
   */
  async seedActualSpend(): Promise<void> {
    console.log('💵 Seeding actual spend records...');
    let totalCreated = 0;
    const currentYear = new Date().getFullYear();

    for (const group of AIRCRAFT_GROUPS) {
      for (let month = 1; month <= 12; month++) {
        const period = `${currentYear}-${String(month).padStart(2, '0')}`;
        
        for (const clause of BUDGET_CLAUSES) {
          const existing = await this.actualSpendModel.findOne({
            period,
            aircraftGroup: group,
            clauseId: clause.clauseId,
          });
          if (existing) continue;

          const plannedAmount = BUDGET_AMOUNTS[group]?.[clause.clauseId] || 0;
          if (plannedAmount === 0) continue;

          // Monthly budget = annual / 12
          const monthlyBudget = plannedAmount / 12;
          
          // Create variance: 60% under budget, 30% over budget, 10% on target
          const varianceType = Math.random();
          let spendMultiplier: number;
          if (varianceType < 0.6) {
            spendMultiplier = randomFloat(0.7, 0.95); // Under budget
          } else if (varianceType < 0.9) {
            spendMultiplier = randomFloat(1.05, 1.25); // Over budget
          } else {
            spendMultiplier = randomFloat(0.98, 1.02); // On target
          }

          const amount = Math.round(monthlyBudget * spendMultiplier);

          await this.actualSpendModel.create({
            period,
            aircraftGroup: group,
            clauseId: clause.clauseId,
            amount,
            currency: 'USD',
            vendor: randomElement(VENDORS),
            notes: `${clause.clauseDescription} expense for ${period}`,
            updatedBy: this.adminUserId,
          });
          totalCreated++;
        }
      }
    }
    console.log(`  ✅ Created ${totalCreated} actual spend records`);
  }

  /**
   * Seed historical data for 2024 (previous year) for YoY comparison
   * Creates daily status and utilization records for the same period last year
   */
  async seedHistoricalData2024(aircraft: AircraftDocument[]): Promise<void> {
    console.log('📅 Seeding 2024 historical data for YoY comparison...');
    
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    let statusCreated = 0;
    let counterCreated = 0;

    for (const ac of aircraft) {
      // Get base values for counters (slightly lower than current year)
      const yearsOld = (new Date().getTime() - new Date(ac.manufactureDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      let baseHours = (yearsOld - 1) * 800 + randomInt(800, 4000); // One year less
      let baseCycles = (yearsOld - 1) * 300 + randomInt(400, 1500);
      let engineHours = baseHours * 0.95;
      let engineCycles = baseCycles * 0.95;
      let apuHours = baseHours * 0.3;

      // Seed 90 days of historical data for the same period last year
      for (let day = 0; day < SEED_CONFIG.daysOfData; day++) {
        // Calculate the date for the same day last year
        const currentDate = getDateDaysAgo(day);
        const historicalDate = new Date(currentDate);
        historicalDate.setFullYear(previousYear);
        historicalDate.setHours(0, 0, 0, 0);

        // Use date range query to handle timezone issues
        const startOfDay = new Date(historicalDate);
        const endOfDay = new Date(historicalDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Seed Daily Status for 2024
        const existingStatus = await this.dailyStatusModel.findOne({
          aircraftId: ac._id,
          date: { $gte: startOfDay, $lte: endOfDay },
        });
        
        if (!existingStatus) {
          const posHours = 24;
          let nmcmSHours = 0;
          let nmcmUHours = 0;

          // Slightly higher maintenance in previous year (18% scheduled, 10% unscheduled)
          if (Math.random() < 0.18) {
            nmcmSHours = randomFloat(1, 5, 1);
          }
          if (Math.random() < 0.10) {
            nmcmUHours = randomFloat(0.5, 3, 1);
          }

          const fmcHours = Math.max(17, posHours - nmcmSHours - nmcmUHours);

          try {
            await this.dailyStatusModel.create({
              aircraftId: ac._id,
              date: historicalDate,
              posHours,
              fmcHours,
              nmcmSHours,
              nmcmUHours,
              updatedBy: this.adminUserId,
            });
            statusCreated++;
          } catch (err: unknown) {
            // Skip duplicate key errors
            if ((err as { code?: number }).code !== 11000) throw err;
          }
        }

        // Seed Utilization Counters for 2024
        const existingCounter = await this.dailyCounterModel.findOne({
          aircraftId: ac._id,
          date: { $gte: startOfDay, $lte: endOfDay },
        });

        if (!existingCounter) {
          // Daily increments (slightly lower utilization in previous year: 1.5-7 FH)
          const dailyHours = randomFloat(1.5, 7, 1);
          const dailyCycles = randomInt(1, 3);

          baseHours += dailyHours;
          baseCycles += dailyCycles;
          engineHours += dailyHours * 0.98;
          engineCycles += dailyCycles;
          apuHours += dailyHours * 0.4;

          const counterData: Partial<DailyCounter> = {
            aircraftId: ac._id as Types.ObjectId,
            date: historicalDate,
            airframeHoursTtsn: parseFloat(baseHours.toFixed(1)),
            airframeCyclesTcsn: baseCycles,
            engine1Hours: parseFloat(engineHours.toFixed(1)),
            engine1Cycles: engineCycles,
            engine2Hours: parseFloat((engineHours * 0.99).toFixed(1)),
            engine2Cycles: engineCycles,
            apuHours: parseFloat(apuHours.toFixed(1)),
            lastFlightDate: historicalDate,
            updatedBy: this.adminUserId as Types.ObjectId,
          };

          if (ac.enginesCount === 4) {
            counterData.engine3Hours = parseFloat((engineHours * 0.98).toFixed(1));
            counterData.engine3Cycles = engineCycles;
            counterData.engine4Hours = parseFloat((engineHours * 0.97).toFixed(1));
            counterData.engine4Cycles = engineCycles;
          }

          try {
            await this.dailyCounterModel.create(counterData);
            counterCreated++;
          } catch (err: unknown) {
            // Skip duplicate key errors
            if ((err as { code?: number }).code !== 11000) throw err;
          }
        }
      }
    }

    console.log(`  ✅ Created ${statusCreated} historical daily status records (${previousYear})`);
    console.log(`  ✅ Created ${counterCreated} historical utilization counter records (${previousYear})`);
  }

  async run(): Promise<void> {
    console.log('\n🚀 Starting database seed...\n');

    await this.seedUsers();
    console.log('');
    
    const aircraft = await this.seedAircraft();
    console.log('');
    
    await this.seedBudgetPlans();
    console.log('');
    
    await this.seedDailyStatus(aircraft);
    console.log('');
    
    await this.seedUtilizationCounters(aircraft);
    console.log('');
    
    await this.seedHistoricalData2024(aircraft);
    console.log('');
    
    await this.seedAOGEvents(aircraft);
    console.log('');
    
    const workOrders = await this.seedWorkOrders(aircraft);
    console.log('');
    
    await this.seedMaintenanceTasks(aircraft, workOrders);
    console.log('');
    
    await this.seedDiscrepancies(aircraft);
    console.log('');
    
    await this.seedActualSpend();

    console.log('\n✨ Database seed completed!\n');
    console.log('Default credentials:');
    console.log('  Admin:  admin@alphastarav.com / Admin@123!');
    console.log('  Editor: editor@alphastarav.com / Editor@123!');
    console.log('  Viewer: viewer@alphastarav.com / Viewer@123!\n');
  }
}


// Main execution
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aircraftModel = app.get<Model<AircraftDocument>>('AircraftModel');
  const budgetPlanModel = app.get<Model<BudgetPlanDocument>>('BudgetPlanModel');
  const dailyStatusModel = app.get<Model<DailyStatusDocument>>('DailyStatusModel');
  const dailyCounterModel = app.get<Model<DailyCounterDocument>>('DailyCounterModel');
  const aogEventModel = app.get<Model<AOGEventDocument>>('AOGEventModel');
  const maintenanceTaskModel = app.get<Model<MaintenanceTaskDocument>>('MaintenanceTaskModel');
  const workOrderModel = app.get<Model<WorkOrderDocument>>('WorkOrderModel');
  const discrepancyModel = app.get<Model<DiscrepancyDocument>>('DiscrepancyModel');
  const actualSpendModel = app.get<Model<ActualSpendDocument>>('ActualSpendModel');

  const seeder = new Seeder(
    userModel,
    aircraftModel,
    budgetPlanModel,
    dailyStatusModel,
    dailyCounterModel,
    aogEventModel,
    maintenanceTaskModel,
    workOrderModel,
    discrepancyModel,
    actualSpendModel,
  );

  try {
    await seeder.run();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
