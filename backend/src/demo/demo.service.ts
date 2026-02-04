import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Aircraft, AircraftDocument, AircraftStatus } from '../aircraft/schemas/aircraft.schema';
import { DailyStatus, DailyStatusDocument } from '../daily-status/schemas/daily-status.schema';
import { DailyCounter, DailyCounterDocument } from '../utilization/schemas/daily-counter.schema';
import { AOGEvent, AOGEventDocument, ResponsibleParty, AOGCategory } from '../aog-events/schemas/aog-event.schema';
import { MaintenanceTask, MaintenanceTaskDocument, Shift } from '../maintenance-tasks/schemas/maintenance-task.schema';
import { WorkOrder, WorkOrderDocument, WorkOrderStatus } from '../work-orders/schemas/work-order.schema';
import { Discrepancy, DiscrepancyDocument, ResponsibleParty as DiscrepancyResponsibleParty } from '../discrepancies/schemas/discrepancy.schema';
import { BudgetPlan, BudgetPlanDocument } from '../budget/schemas/budget-plan.schema';
import { ActualSpend, ActualSpendDocument } from '../budget/schemas/actual-spend.schema';
import { User, UserDocument, UserRole } from '../auth/schemas/user.schema';
import {
  CollectionCounts,
  DemoSeedResponseDto,
  DemoResetResponseDto,
  DemoStatusResponseDto,
} from './dto/demo-response.dto';

// Demo seed configuration
const DEMO_CONFIG = {
  daysOfData: 90,
  aogEventsPerAircraft: { min: 2, max: 4 },
  workOrdersPerAircraft: { min: 3, max: 6 },
  discrepanciesPerAircraft: { min: 2, max: 5 },
  maintenanceTasksPerDay: { min: 2, max: 5 },
};

// Demo aircraft data
const DEMO_AIRCRAFT: Partial<Aircraft>[] = [
  {
    registration: 'DEMO-A1',
    fleetGroup: 'A340',
    aircraftType: 'A340-642',
    msn: 'DEMO-1015',
    owner: 'Demo Aviation',
    manufactureDate: new Date('2010-01-15'),
    enginesCount: 4,
    status: AircraftStatus.Active,
    isDemo: true,
  },
  {
    registration: 'DEMO-A2',
    fleetGroup: 'A330',
    aircraftType: 'A330-243',
    msn: 'DEMO-0456',
    owner: 'Demo Aviation',
    manufactureDate: new Date('2008-03-10'),
    enginesCount: 2,
    status: AircraftStatus.Active,
    isDemo: true,
  },
  {
    registration: 'DEMO-G1',
    fleetGroup: 'G650ER',
    aircraftType: 'Gulfstream G650ER',
    msn: 'DEMO-6234',
    owner: 'Demo Aviation',
    manufactureDate: new Date('2018-08-20'),
    enginesCount: 2,
    status: AircraftStatus.Active,
    isDemo: true,
  },
  {
    registration: 'DEMO-C1',
    fleetGroup: 'Cessna',
    aircraftType: 'Citation Bravo',
    msn: 'DEMO-1115',
    owner: 'Demo Aviation',
    manufactureDate: new Date('2000-06-15'),
    enginesCount: 2,
    status: AircraftStatus.Active,
    isDemo: true,
  },
];


// Budget clauses
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

const DEMO_AIRCRAFT_GROUPS = ['A330', 'G650ER', 'Cessna'];

// Sample budget amounts for demo
const DEMO_BUDGET_AMOUNTS: Record<string, Record<number, number>> = {
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
};

import { COMMON_ATA_CHAPTER_CODES } from '../common/constants/ata-chapters';

// ATA Chapters for discrepancies
const ATA_CHAPTERS = COMMON_ATA_CHAPTER_CODES;

// Maintenance task types
const TASK_TYPES = ['Routine Inspection', 'Scheduled Maintenance', 'Component Replacement', 'System Check', 'Lubrication', 'Cleaning', 'Calibration', 'Software Update'];

// AOG reason codes
const AOG_REASON_CODES = ['Engine failure', 'Hydraulic leak', 'Avionics malfunction', 'Landing gear issue', 'Fuel system problem', 'Electrical fault', 'APU failure', 'Navigation system error'];

// Work order descriptions
const WORK_ORDER_DESCRIPTIONS = ['Annual inspection', 'Engine overhaul', 'Landing gear service', 'Avionics upgrade', 'Interior refurbishment', 'Hydraulic system service', 'Fuel tank inspection', 'Component replacement'];

// Discrepancy texts
const DISCREPANCY_TEXTS = ['Abnormal vibration detected', 'Oil leak observed', 'Warning light illuminated', 'Unusual noise during operation', 'Pressure reading out of range', 'Temperature exceeding limits', 'Component wear detected', 'Corrosion found'];

// Corrective actions
const CORRECTIVE_ACTIONS = ['Component replaced', 'System recalibrated', 'Leak sealed', 'Part repaired', 'Software updated', 'Adjustment made', 'Cleaned and lubricated'];

// Vendor names
const VENDORS = ['Airbus Services', 'Boeing Support', 'Rolls-Royce', 'Pratt & Whitney', 'Honeywell', 'Collins Aerospace', 'Local MRO'];

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


@Injectable()
export class DemoService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Aircraft.name) private readonly aircraftModel: Model<AircraftDocument>,
    @InjectModel(DailyStatus.name) private readonly dailyStatusModel: Model<DailyStatusDocument>,
    @InjectModel(DailyCounter.name) private readonly dailyCounterModel: Model<DailyCounterDocument>,
    @InjectModel(AOGEvent.name) private readonly aogEventModel: Model<AOGEventDocument>,
    @InjectModel(MaintenanceTask.name) private readonly maintenanceTaskModel: Model<MaintenanceTaskDocument>,
    @InjectModel(WorkOrder.name) private readonly workOrderModel: Model<WorkOrderDocument>,
    @InjectModel(Discrepancy.name) private readonly discrepancyModel: Model<DiscrepancyDocument>,
    @InjectModel(BudgetPlan.name) private readonly budgetPlanModel: Model<BudgetPlanDocument>,
    @InjectModel(ActualSpend.name) private readonly actualSpendModel: Model<ActualSpendDocument>,
  ) {}

  /**
   * Get counts of demo records per collection
   */
  async getStatus(): Promise<DemoStatusResponseDto> {
    const counts = await this.getDemoCounts();
    const hasDemoData = Object.values(counts).some(count => count > 0);
    return { hasDemoData, counts };
  }

  /**
   * Seed demo data across all collections
   */
  async seed(): Promise<DemoSeedResponseDto> {
    const startTime = Date.now();

    // Get admin user for updatedBy field
    const adminUser = await this.userModel.findOne({ role: UserRole.Admin });
    if (!adminUser) {
      throw new Error('No admin user found. Please run the main seed first.');
    }
    const adminUserId = adminUser._id as Types.ObjectId;

    // Seed aircraft
    const aircraft = await this.seedAircraft();

    // Seed budget plans
    await this.seedBudgetPlans();

    // Seed daily status
    await this.seedDailyStatus(aircraft, adminUserId);

    // Seed utilization counters
    await this.seedUtilizationCounters(aircraft, adminUserId);

    // Seed AOG events
    await this.seedAOGEvents(aircraft, adminUserId);

    // Seed work orders
    const workOrders = await this.seedWorkOrders(aircraft, adminUserId);

    // Seed maintenance tasks
    await this.seedMaintenanceTasks(aircraft, workOrders, adminUserId);

    // Seed discrepancies
    await this.seedDiscrepancies(aircraft, adminUserId);

    // Seed actual spend
    await this.seedActualSpend(adminUserId);

    const counts = await this.getDemoCounts();
    const duration = Date.now() - startTime;

    return {
      success: true,
      message: 'Demo data seeded successfully',
      counts,
      duration,
    };
  }

  /**
   * Reset (delete) all demo data
   */
  async reset(): Promise<DemoResetResponseDto> {
    const deletedCounts: CollectionCounts = {
      aircraft: 0,
      dailyStatus: 0,
      dailyCounters: 0,
      aogEvents: 0,
      maintenanceTasks: 0,
      workOrders: 0,
      discrepancies: 0,
      budgetPlans: 0,
      actualSpend: 0,
    };

    // Delete in reverse order of dependencies
    const actualSpendResult = await this.actualSpendModel.deleteMany({ isDemo: true });
    deletedCounts.actualSpend = actualSpendResult.deletedCount;

    const budgetPlanResult = await this.budgetPlanModel.deleteMany({ isDemo: true });
    deletedCounts.budgetPlans = budgetPlanResult.deletedCount;

    const discrepancyResult = await this.discrepancyModel.deleteMany({ isDemo: true });
    deletedCounts.discrepancies = discrepancyResult.deletedCount;

    const maintenanceTaskResult = await this.maintenanceTaskModel.deleteMany({ isDemo: true });
    deletedCounts.maintenanceTasks = maintenanceTaskResult.deletedCount;

    const workOrderResult = await this.workOrderModel.deleteMany({ isDemo: true });
    deletedCounts.workOrders = workOrderResult.deletedCount;

    const aogEventResult = await this.aogEventModel.deleteMany({ isDemo: true });
    deletedCounts.aogEvents = aogEventResult.deletedCount;

    const dailyCounterResult = await this.dailyCounterModel.deleteMany({ isDemo: true });
    deletedCounts.dailyCounters = dailyCounterResult.deletedCount;

    const dailyStatusResult = await this.dailyStatusModel.deleteMany({ isDemo: true });
    deletedCounts.dailyStatus = dailyStatusResult.deletedCount;

    const aircraftResult = await this.aircraftModel.deleteMany({ isDemo: true });
    deletedCounts.aircraft = aircraftResult.deletedCount;

    return {
      success: true,
      message: 'Demo data reset successfully',
      deletedCounts,
    };
  }

  private async getDemoCounts(): Promise<CollectionCounts> {
    const [
      aircraft,
      dailyStatus,
      dailyCounters,
      aogEvents,
      maintenanceTasks,
      workOrders,
      discrepancies,
      budgetPlans,
      actualSpend,
    ] = await Promise.all([
      this.aircraftModel.countDocuments({ isDemo: true }),
      this.dailyStatusModel.countDocuments({ isDemo: true }),
      this.dailyCounterModel.countDocuments({ isDemo: true }),
      this.aogEventModel.countDocuments({ isDemo: true }),
      this.maintenanceTaskModel.countDocuments({ isDemo: true }),
      this.workOrderModel.countDocuments({ isDemo: true }),
      this.discrepancyModel.countDocuments({ isDemo: true }),
      this.budgetPlanModel.countDocuments({ isDemo: true }),
      this.actualSpendModel.countDocuments({ isDemo: true }),
    ]);

    return {
      aircraft,
      dailyStatus,
      dailyCounters,
      aogEvents,
      maintenanceTasks,
      workOrders,
      discrepancies,
      budgetPlans,
      actualSpend,
    };
  }


  private async seedAircraft(): Promise<AircraftDocument[]> {
    const createdAircraft: AircraftDocument[] = [];

    for (const aircraftData of DEMO_AIRCRAFT) {
      // Check if demo aircraft already exists
      const existing = await this.aircraftModel.findOne({ registration: aircraftData.registration });
      if (existing) {
        createdAircraft.push(existing);
        continue;
      }

      const newAircraft = await this.aircraftModel.create(aircraftData);
      createdAircraft.push(newAircraft);
    }

    return createdAircraft;
  }

  private async seedBudgetPlans(): Promise<void> {
    const fiscalYear = new Date().getFullYear();

    for (const group of DEMO_AIRCRAFT_GROUPS) {
      for (const clause of BUDGET_CLAUSES) {
        const existing = await this.budgetPlanModel.findOne({
          fiscalYear,
          clauseId: clause.clauseId,
          aircraftGroup: group,
          isDemo: true,
        });

        if (existing) continue;

        const plannedAmount = DEMO_BUDGET_AMOUNTS[group]?.[clause.clauseId] || 0;
        await this.budgetPlanModel.create({
          fiscalYear,
          clauseId: clause.clauseId,
          clauseDescription: clause.clauseDescription,
          aircraftGroup: group,
          plannedAmount,
          currency: 'USD',
          isDemo: true,
        });
      }
    }
  }

  private async seedDailyStatus(aircraft: AircraftDocument[], adminUserId: Types.ObjectId): Promise<void> {
    for (const ac of aircraft) {
      for (let day = 0; day < DEMO_CONFIG.daysOfData; day++) {
        const date = getDateDaysAgo(day);

        const existing = await this.dailyStatusModel.findOne({
          aircraftId: ac._id,
          date,
          isDemo: true,
        });
        if (existing) continue;

        const posHours = 24;
        let nmcmSHours = 0;
        let nmcmUHours = 0;

        // 15% chance of scheduled maintenance
        if (Math.random() < 0.15) {
          nmcmSHours = randomFloat(1, 4, 1);
        }

        // 8% chance of unscheduled maintenance
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
          updatedBy: adminUserId,
          isDemo: true,
        });
      }
    }
  }

  private async seedUtilizationCounters(aircraft: AircraftDocument[], adminUserId: Types.ObjectId): Promise<void> {
    for (const ac of aircraft) {
      // Use the earliest available date (manufactureDate, certificationDate, or inServiceDate)
      const referenceDate = ac.manufactureDate || ac.certificationDate || ac.inServiceDate || new Date('2010-01-01');
      const yearsOld = (new Date().getTime() - new Date(referenceDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      let baseHours = Math.max(0, yearsOld * 800 + randomInt(1000, 5000));
      let baseCycles = Math.max(0, yearsOld * 300 + randomInt(500, 2000));
      let engineHours = baseHours * 0.95;
      let engineCycles = baseCycles * 0.95;
      let apuHours = baseHours * 0.3;

      for (let day = DEMO_CONFIG.daysOfData - 1; day >= 0; day--) {
        const date = getDateDaysAgo(day);

        const existing = await this.dailyCounterModel.findOne({
          aircraftId: ac._id,
          date,
          isDemo: true,
        });
        if (existing) continue;

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
          updatedBy: adminUserId,
          isDemo: true,
        };

        if (ac.enginesCount === 4) {
          counterData.engine3Hours = parseFloat((engineHours * 0.98).toFixed(1));
          counterData.engine3Cycles = engineCycles;
          counterData.engine4Hours = parseFloat((engineHours * 0.97).toFixed(1));
          counterData.engine4Cycles = engineCycles;
        }

        await this.dailyCounterModel.create(counterData);
      }
    }
  }


  private async seedAOGEvents(aircraft: AircraftDocument[], adminUserId: Types.ObjectId): Promise<void> {
    const responsibleParties = Object.values(ResponsibleParty);

    for (const ac of aircraft) {
      const eventCount = randomInt(DEMO_CONFIG.aogEventsPerAircraft.min, DEMO_CONFIG.aogEventsPerAircraft.max);

      for (let i = 0; i < eventCount; i++) {
        const daysAgo = randomInt(1, DEMO_CONFIG.daysOfData - 1);
        const detectedAt = getDateDaysAgo(daysAgo);
        const durationHours = randomInt(4, 72);
        const clearedAt = new Date(detectedAt.getTime() + durationHours * 60 * 60 * 1000);

        const responsibleParty = randomElement(responsibleParties);
        const categories = Object.values(AOGCategory);

        await this.aogEventModel.create({
          aircraftId: ac._id,
          detectedAt,
          clearedAt: Math.random() < 0.9 ? clearedAt : undefined,
          category: randomElement(categories),
          reasonCode: randomElement(AOG_REASON_CODES),
          responsibleParty,
          actionTaken: `Resolved ${randomElement(AOG_REASON_CODES).toLowerCase()} issue`,
          manpowerCount: randomInt(2, 8),
          manHours: randomInt(8, 120),
          costLabor: randomInt(5000, 50000),
          costParts: randomInt(10000, 200000),
          costExternal: Math.random() < 0.3 ? randomInt(5000, 100000) : undefined,
          updatedBy: adminUserId,
          isDemo: true,
        });
      }
    }
  }

  private async seedWorkOrders(aircraft: AircraftDocument[], adminUserId: Types.ObjectId): Promise<WorkOrderDocument[]> {
    const createdWorkOrders: WorkOrderDocument[] = [];
    const statuses = Object.values(WorkOrderStatus);

    for (const ac of aircraft) {
      const woCount = randomInt(DEMO_CONFIG.workOrdersPerAircraft.min, DEMO_CONFIG.workOrdersPerAircraft.max);

      for (let i = 0; i < woCount; i++) {
        const woNumber = `DEMO-WO-${ac.registration}-${Date.now()}-${i}`;

        const existing = await this.workOrderModel.findOne({ woNumber });
        if (existing) continue;

        const daysAgo = randomInt(1, DEMO_CONFIG.daysOfData);
        const dateIn = getDateDaysAgo(daysAgo);
        const status = randomElement(statuses);

        let dateOut: Date | undefined;
        let dueDate: Date | undefined;

        if (status === WorkOrderStatus.Closed) {
          dateOut = new Date(dateIn.getTime() + randomInt(1, 30) * 24 * 60 * 60 * 1000);
        }

        if (Math.random() < 0.7) {
          const dueDaysFromIn = randomInt(-5, 45);
          dueDate = new Date(dateIn.getTime() + dueDaysFromIn * 24 * 60 * 60 * 1000);
        }

        const wo = await this.workOrderModel.create({
          woNumber,
          aircraftId: ac._id,
          description: randomElement(WORK_ORDER_DESCRIPTIONS),
          status,
          dateIn,
          dateOut,
          dueDate,
          crsNumber: status === WorkOrderStatus.Closed ? `DEMO-CRS-${randomInt(10000, 99999)}` : undefined,
          mrNumber: `DEMO-MR-${randomInt(1000, 9999)}`,
          updatedBy: adminUserId,
          isDemo: true,
        });
        createdWorkOrders.push(wo);
      }
    }

    return createdWorkOrders;
  }

  private async seedMaintenanceTasks(
    aircraft: AircraftDocument[],
    workOrders: WorkOrderDocument[],
    adminUserId: Types.ObjectId,
  ): Promise<void> {
    const shifts = [Shift.Morning, Shift.Evening, Shift.Night];
    const daysToSeed = randomInt(20, 40);

    for (let d = 0; d < daysToSeed; d++) {
      const date = getDateDaysAgo(randomInt(0, DEMO_CONFIG.daysOfData - 1));
      const tasksForDay = randomInt(DEMO_CONFIG.maintenanceTasksPerDay.min, DEMO_CONFIG.maintenanceTasksPerDay.max);

      for (let t = 0; t < tasksForDay; t++) {
        const ac = randomElement(aircraft);
        const shift = randomElement(shifts);
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
          updatedBy: adminUserId,
          isDemo: true,
        });
      }
    }
  }

  private async seedDiscrepancies(aircraft: AircraftDocument[], adminUserId: Types.ObjectId): Promise<void> {
    for (const ac of aircraft) {
      const discCount = randomInt(DEMO_CONFIG.discrepanciesPerAircraft.min, DEMO_CONFIG.discrepanciesPerAircraft.max);

      for (let i = 0; i < discCount; i++) {
        const daysAgo = randomInt(1, DEMO_CONFIG.daysOfData);
        const dateDetected = getDateDaysAgo(daysAgo);
        const ataChapter = randomElement(ATA_CHAPTERS);

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
          updatedBy: adminUserId,
          isDemo: true,
        });
      }
    }
  }

  private async seedActualSpend(adminUserId: Types.ObjectId): Promise<void> {
    const currentYear = new Date().getFullYear();

    for (const group of DEMO_AIRCRAFT_GROUPS) {
      for (let month = 1; month <= 12; month++) {
        const period = `${currentYear}-${String(month).padStart(2, '0')}`;

        for (const clause of BUDGET_CLAUSES) {
          const existing = await this.actualSpendModel.findOne({
            period,
            aircraftGroup: group,
            clauseId: clause.clauseId,
            isDemo: true,
          });
          if (existing) continue;

          const plannedAmount = DEMO_BUDGET_AMOUNTS[group]?.[clause.clauseId] || 0;
          if (plannedAmount === 0) continue;

          const monthlyBudget = plannedAmount / 12;

          const varianceType = Math.random();
          let spendMultiplier: number;
          if (varianceType < 0.6) {
            spendMultiplier = randomFloat(0.7, 0.95);
          } else if (varianceType < 0.9) {
            spendMultiplier = randomFloat(1.05, 1.25);
          } else {
            spendMultiplier = randomFloat(0.98, 1.02);
          }

          const amount = Math.round(monthlyBudget * spendMultiplier);

          await this.actualSpendModel.create({
            period,
            aircraftGroup: group,
            clauseId: clause.clauseId,
            amount,
            currency: 'USD',
            vendor: randomElement(VENDORS),
            notes: `Demo: ${clause.clauseDescription} expense for ${period}`,
            updatedBy: adminUserId,
            isDemo: true,
          });
        }
      }
    }
  }
}
