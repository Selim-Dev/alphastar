/**
 * Historical Data Import Script
 * Imports historical data from Cessna workbook structure:
 * - ASH (Aircraft Status History) - Daily availability data
 * - PT (Performance/Utilization) - Monthly utilization data
 * - WO (Work Orders) - Work order records
 * - DCRP (Discrepancy Register) - Discrepancy records
 * - Fleet utilization snapshot
 *
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/import-historical.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

// Import schemas
import { User, UserDocument, UserSchema } from '../auth/schemas/user.schema';
import { Aircraft, AircraftDocument, AircraftSchema } from '../aircraft/schemas/aircraft.schema';
import { DailyStatus, DailyStatusDocument, DailyStatusSchema } from '../daily-status/schemas/daily-status.schema';
import { DailyCounter, DailyCounterDocument, DailyCounterSchema } from '../utilization/schemas/daily-counter.schema';
import { WorkOrder, WorkOrderDocument, WorkOrderStatus, WorkOrderSchema } from '../work-orders/schemas/work-order.schema';
import { Discrepancy, DiscrepancyDocument, ResponsibleParty, DiscrepancySchema } from '../discrepancies/schemas/discrepancy.schema';

// Sample historical data based on Cessna Files analysis

// ASH (Aircraft Status History) - Sample daily status data for Cessna fleet
// Based on the analysis: FMC, NMCM-S, NMCM-U, POS hours per day
const SAMPLE_ASH_DATA = [
  // HZ-133 - Sample months
  { registration: 'HZ-133', date: '2024-01-01', posHours: 24, fmcHours: 19.4, nmcmSHours: 2.6, nmcmUHours: 2.0 },
  { registration: 'HZ-133', date: '2024-01-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-133', date: '2024-01-03', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-133', date: '2024-01-04', posHours: 24, fmcHours: 20, nmcmSHours: 4, nmcmUHours: 0 },
  { registration: 'HZ-133', date: '2024-01-05', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-133', date: '2024-02-01', posHours: 24, fmcHours: 23.2, nmcmSHours: 0.8, nmcmUHours: 0 },
  { registration: 'HZ-133', date: '2024-02-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-133', date: '2024-03-01', posHours: 24, fmcHours: 16.5, nmcmSHours: 5.5, nmcmUHours: 2.0 },
  { registration: 'HZ-133', date: '2024-03-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  // HZ-134
  { registration: 'HZ-134', date: '2024-01-01', posHours: 24, fmcHours: 20.9, nmcmSHours: 1.1, nmcmUHours: 2.0 },
  { registration: 'HZ-134', date: '2024-01-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-134', date: '2024-01-03', posHours: 24, fmcHours: 18, nmcmSHours: 6, nmcmUHours: 0 },
  { registration: 'HZ-134', date: '2024-02-01', posHours: 24, fmcHours: 21.8, nmcmSHours: 2.2, nmcmUHours: 0 },
  { registration: 'HZ-134', date: '2024-02-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  // HZ-135
  { registration: 'HZ-135', date: '2024-01-01', posHours: 24, fmcHours: 23.8, nmcmSHours: 0.2, nmcmUHours: 0 },
  { registration: 'HZ-135', date: '2024-01-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-135', date: '2024-02-01', posHours: 24, fmcHours: 13.6, nmcmSHours: 8.4, nmcmUHours: 2.0 },
  { registration: 'HZ-135', date: '2024-02-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  // HZ-136
  { registration: 'HZ-136', date: '2024-01-01', posHours: 24, fmcHours: 22.2, nmcmSHours: 1.8, nmcmUHours: 0 },
  { registration: 'HZ-136', date: '2024-01-02', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-136', date: '2024-02-01', posHours: 24, fmcHours: 24, nmcmSHours: 0, nmcmUHours: 0 },
  { registration: 'HZ-136', date: '2024-02-02', posHours: 24, fmcHours: 23.5, nmcmSHours: 0.5, nmcmUHours: 0 },
];


// Fleet utilization snapshot data from the analysis
const FLEET_UTILIZATION_SNAPSHOT = [
  {
    registration: 'HZ-A42',
    date: '2025-11-01',
    airframeHoursTtsn: 1913.87,
    airframeCyclesTcsn: 551,
    engine1Hours: 1913.87, engine1Cycles: 551,
    engine2Hours: 1913.87, engine2Cycles: 551,
    engine3Hours: 1913.87, engine3Cycles: 551,
    engine4Hours: 1913.87, engine4Cycles: 551,
    apuHours: 4114, apuCycles: 2174,
  },
  {
    registration: 'HZ-SKY1',
    date: '2025-10-21',
    airframeHoursTtsn: 8864.03,
    airframeCyclesTcsn: 4177,
    engine1Hours: 8864.03, engine1Cycles: 4177,
    engine2Hours: 8864.03, engine2Cycles: 4177,
    engine3Hours: 8864.03, engine3Cycles: 4177,
    engine4Hours: 8864.03, engine4Cycles: 4177,
    apuHours: 12826, apuCycles: 6737,
  },
  {
    registration: 'HZ-SKY2',
    date: '2025-11-03',
    airframeHoursTtsn: 3715.33,
    airframeCyclesTcsn: 864,
    engine1Hours: 3715.33, engine1Cycles: 864,
    engine2Hours: 3715.33, engine2Cycles: 864,
    apuHours: 4208, apuCycles: 1893,
  },
  {
    registration: 'HZ-A3',
    date: '2025-11-09',
    airframeHoursTtsn: 33263.2,
    airframeCyclesTcsn: 15995,
    engine1Hours: 33263.2, engine1Cycles: 15995,
    engine2Hours: 33263.2, engine2Cycles: 15995,
    apuHours: 15348, apuCycles: 13717,
  },
  {
    registration: 'HZ-A4',
    date: '2025-11-07',
    airframeHoursTtsn: 23188.9,
    airframeCyclesTcsn: 14496,
    engine1Hours: 23188.9, engine1Cycles: 14496,
    engine2Hours: 23188.9, engine2Cycles: 14496,
    apuHours: 27519, apuCycles: 29476,
  },
  {
    registration: 'HZ-A5',
    date: '2025-11-05',
    airframeHoursTtsn: 12739.7,
    airframeCyclesTcsn: 4928,
    engine1Hours: 12739.7, engine1Cycles: 4928,
    engine2Hours: 12739.7, engine2Cycles: 4928,
    apuHours: 44711, apuCycles: 28421,
  },
  {
    registration: 'HZ-A15',
    date: '2025-11-09',
    airframeHoursTtsn: 34451.9,
    airframeCyclesTcsn: 23319,
    engine1Hours: 34451.9, engine1Cycles: 23319,
    engine2Hours: 34451.9, engine2Cycles: 23319,
    apuHours: 25757, apuCycles: 24963,
  },
  {
    registration: 'HZ-SKY4',
    date: '2025-11-09',
    airframeHoursTtsn: 5665.3,
    airframeCyclesTcsn: 2220,
    engine1Hours: 5665.3, engine1Cycles: 2220,
    engine2Hours: 5665.3, engine2Cycles: 2220,
    apuHours: 6477, apuCycles: 4411,
  },
  {
    registration: 'HZ-A8',
    date: '2025-11-08',
    airframeHoursTtsn: 7104.22,
    airframeCyclesTcsn: 5171,
    engine1Hours: 7104.22, engine1Cycles: 5171,
    engine2Hours: 7104.22, engine2Cycles: 5171,
    apuHours: 7325,
  },
  {
    registration: 'HZ-A9',
    date: '2025-11-09',
    airframeHoursTtsn: 6348.68,
    airframeCyclesTcsn: 4821,
    engine1Hours: 6348.68, engine1Cycles: 4821,
    engine2Hours: 6348.68, engine2Cycles: 4821,
    apuHours: 6794,
  },
];

// Sample Work Orders based on Cessna WO analysis
const SAMPLE_WORK_ORDERS = [
  { woNumber: 'WO-2024-001', registration: 'HZ-133', description: 'Scheduled 100-hour inspection', status: WorkOrderStatus.Closed, dateIn: '2024-01-05', dateOut: '2024-01-08', dueDate: '2024-01-10' },
  { woNumber: 'WO-2024-002', registration: 'HZ-133', description: 'Landing gear service', status: WorkOrderStatus.Closed, dateIn: '2024-01-15', dateOut: '2024-01-16', dueDate: '2024-01-20' },
  { woNumber: 'WO-2024-003', registration: 'HZ-134', description: 'Engine oil change', status: WorkOrderStatus.Closed, dateIn: '2024-01-10', dateOut: '2024-01-12', dueDate: '2024-01-15' },
  { woNumber: 'WO-2024-004', registration: 'HZ-134', description: 'Avionics software update', status: WorkOrderStatus.Closed, dateIn: '2024-02-01', dateOut: '2024-02-15', dueDate: '2024-02-10' },
  { woNumber: 'WO-2024-005', registration: 'HZ-135', description: 'Cabin interior repair', status: WorkOrderStatus.Closed, dateIn: '2024-01-20', dateOut: '2024-01-21', dueDate: '2024-01-25' },
  { woNumber: 'WO-2024-006', registration: 'HZ-135', description: 'APU inspection', status: WorkOrderStatus.InProgress, dateIn: '2024-03-01', dueDate: '2024-03-15' },
  { woNumber: 'WO-2024-007', registration: 'HZ-136', description: 'Wheel and brake assembly', status: WorkOrderStatus.Closed, dateIn: '2024-01-25', dateOut: '2024-01-26', dueDate: '2024-01-30' },
  { woNumber: 'WO-2024-008', registration: 'HZ-136', description: 'Annual inspection', status: WorkOrderStatus.Open, dateIn: '2024-03-10', dueDate: '2024-03-25' },
  { woNumber: 'WO-2024-009', registration: 'HZ-A3', description: 'A-Check maintenance', status: WorkOrderStatus.Closed, dateIn: '2024-02-01', dateOut: '2024-02-05', dueDate: '2024-02-10' },
  { woNumber: 'WO-2024-010', registration: 'HZ-A4', description: 'Engine borescope inspection', status: WorkOrderStatus.Deferred, dateIn: '2024-02-15', dueDate: '2024-03-01' },
];


// Sample Discrepancies based on Cessna DCRP analysis
// Top ATA chapters: 34 (Navigation), 05 (Time Limits), 32 (Landing Gear), 25 (Equipment), 33 (Lights)
const SAMPLE_DISCREPANCIES = [
  { registration: 'HZ-133', dateDetected: '2024-01-05', ataChapter: '34', discrepancyText: 'GPS signal intermittent during flight', dateCorrected: '2024-01-08', correctiveAction: 'Replaced GPS antenna', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-133', dateDetected: '2024-01-20', ataChapter: '32', discrepancyText: 'Nose wheel shimmy on landing', dateCorrected: '2024-01-22', correctiveAction: 'Balanced nose wheel assembly', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-133', dateDetected: '2024-02-10', ataChapter: '25', discrepancyText: 'Cabin seat track worn', dateCorrected: '2024-02-12', correctiveAction: 'Replaced seat track section', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-134', dateDetected: '2024-01-08', ataChapter: '34', discrepancyText: 'VOR receiver inoperative', dateCorrected: '2024-01-10', correctiveAction: 'Replaced VOR receiver unit', responsibility: ResponsibleParty.OEM },
  { registration: 'HZ-134', dateDetected: '2024-01-25', ataChapter: '33', discrepancyText: 'Landing light flickering', dateCorrected: '2024-01-26', correctiveAction: 'Replaced landing light bulb and connector', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-134', dateDetected: '2024-02-05', ataChapter: '05', discrepancyText: 'Engine oil analysis shows elevated metal particles', dateCorrected: '2024-02-15', correctiveAction: 'Performed engine inspection, replaced oil filter', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-135', dateDetected: '2024-01-12', ataChapter: '34', discrepancyText: 'Autopilot disconnect during cruise', dateCorrected: '2024-01-15', correctiveAction: 'Updated autopilot software', responsibility: ResponsibleParty.OEM },
  { registration: 'HZ-135', dateDetected: '2024-02-01', ataChapter: '32', discrepancyText: 'Main gear door actuator slow', dateCorrected: '2024-02-08', correctiveAction: 'Replaced hydraulic actuator', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-135', dateDetected: '2024-02-20', ataChapter: '21', discrepancyText: 'Cabin temperature control erratic', dateCorrected: '2024-02-22', correctiveAction: 'Replaced temperature sensor', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-136', dateDetected: '2024-01-15', ataChapter: '34', discrepancyText: 'Weather radar display blank', dateCorrected: '2024-01-16', correctiveAction: 'Reset radar system, replaced display cable', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-136', dateDetected: '2024-02-08', ataChapter: '24', discrepancyText: 'Generator output low', dateCorrected: '2024-02-10', correctiveAction: 'Replaced generator control unit', responsibility: ResponsibleParty.OEM },
  { registration: 'HZ-136', dateDetected: '2024-03-01', ataChapter: '05', discrepancyText: 'Airframe inspection due', correctiveAction: 'Scheduled for annual inspection', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-A3', dateDetected: '2024-01-18', ataChapter: '34', discrepancyText: 'FMS database outdated', dateCorrected: '2024-01-19', correctiveAction: 'Updated navigation database', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-A4', dateDetected: '2024-02-12', ataChapter: '27', discrepancyText: 'Flap asymmetry warning', dateCorrected: '2024-02-14', correctiveAction: 'Adjusted flap rigging', responsibility: ResponsibleParty.Internal },
  { registration: 'HZ-A5', dateDetected: '2024-02-25', ataChapter: '23', discrepancyText: 'VHF radio static on frequency 2', dateCorrected: '2024-02-26', correctiveAction: 'Replaced antenna connector', responsibility: ResponsibleParty.Internal },
];

// Create import module
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
      { name: DailyStatus.name, schema: DailyStatusSchema },
      { name: DailyCounter.name, schema: DailyCounterSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: Discrepancy.name, schema: DiscrepancySchema },
    ]),
  ],
})
class ImportModule {}


class HistoricalImporter {
  private adminUserId!: Types.ObjectId;
  private aircraftMap: Map<string, Types.ObjectId> = new Map();

  constructor(
    private userModel: Model<UserDocument>,
    private aircraftModel: Model<AircraftDocument>,
    private dailyStatusModel: Model<DailyStatusDocument>,
    private dailyCounterModel: Model<DailyCounterDocument>,
    private workOrderModel: Model<WorkOrderDocument>,
    private discrepancyModel: Model<DiscrepancyDocument>,
  ) {}

  async initialize(): Promise<void> {
    // Get admin user for updatedBy field
    const adminUser = await this.userModel.findOne({ email: 'admin@alphastarav.com' });
    if (!adminUser) {
      throw new Error('Admin user not found. Please run seed.ts first.');
    }
    this.adminUserId = adminUser._id as Types.ObjectId;

    // Build aircraft registration to ID map
    const aircraft = await this.aircraftModel.find();
    for (const ac of aircraft) {
      this.aircraftMap.set(ac.registration, ac._id as Types.ObjectId);
    }
    console.log(`📋 Loaded ${this.aircraftMap.size} aircraft registrations`);
  }

  async importDailyStatus(): Promise<void> {
    console.log('📊 Importing daily status (ASH) data...');
    let imported = 0;
    let skipped = 0;

    for (const record of SAMPLE_ASH_DATA) {
      const aircraftId = this.aircraftMap.get(record.registration);
      if (!aircraftId) {
        console.log(`  ⚠️  Aircraft ${record.registration} not found, skipping...`);
        skipped++;
        continue;
      }

      const date = new Date(record.date);
      const existing = await this.dailyStatusModel.findOne({ aircraftId, date });
      if (existing) {
        skipped++;
        continue;
      }

      await this.dailyStatusModel.create({
        aircraftId,
        date,
        posHours: record.posHours,
        fmcHours: record.fmcHours,
        nmcmSHours: record.nmcmSHours,
        nmcmUHours: record.nmcmUHours,
        updatedBy: this.adminUserId,
      });
      imported++;
    }

    console.log(`  ✅ Imported ${imported} daily status records (${skipped} skipped)`);
  }

  async importUtilizationSnapshot(): Promise<void> {
    console.log('⏱️  Importing fleet utilization snapshot...');
    let imported = 0;
    let skipped = 0;

    for (const record of FLEET_UTILIZATION_SNAPSHOT) {
      const aircraftId = this.aircraftMap.get(record.registration);
      if (!aircraftId) {
        console.log(`  ⚠️  Aircraft ${record.registration} not found, skipping...`);
        skipped++;
        continue;
      }

      const date = new Date(record.date);
      const existing = await this.dailyCounterModel.findOne({ aircraftId, date });
      if (existing) {
        skipped++;
        continue;
      }

      await this.dailyCounterModel.create({
        aircraftId,
        date,
        airframeHoursTtsn: record.airframeHoursTtsn,
        airframeCyclesTcsn: record.airframeCyclesTcsn,
        engine1Hours: record.engine1Hours,
        engine1Cycles: record.engine1Cycles,
        engine2Hours: record.engine2Hours,
        engine2Cycles: record.engine2Cycles,
        engine3Hours: record.engine3Hours,
        engine3Cycles: record.engine3Cycles,
        engine4Hours: record.engine4Hours,
        engine4Cycles: record.engine4Cycles,
        apuHours: record.apuHours,
        apuCycles: record.apuCycles,
        updatedBy: this.adminUserId,
      });
      imported++;
    }

    console.log(`  ✅ Imported ${imported} utilization records (${skipped} skipped)`);
  }

  async importWorkOrders(): Promise<void> {
    console.log('📝 Importing work orders...');
    let imported = 0;
    let skipped = 0;

    for (const record of SAMPLE_WORK_ORDERS) {
      const aircraftId = this.aircraftMap.get(record.registration);
      if (!aircraftId) {
        console.log(`  ⚠️  Aircraft ${record.registration} not found, skipping...`);
        skipped++;
        continue;
      }

      const existing = await this.workOrderModel.findOne({ woNumber: record.woNumber });
      if (existing) {
        skipped++;
        continue;
      }

      await this.workOrderModel.create({
        woNumber: record.woNumber,
        aircraftId,
        description: record.description,
        status: record.status,
        dateIn: new Date(record.dateIn),
        dateOut: record.dateOut ? new Date(record.dateOut) : undefined,
        dueDate: record.dueDate ? new Date(record.dueDate) : undefined,
        updatedBy: this.adminUserId,
      });
      imported++;
    }

    console.log(`  ✅ Imported ${imported} work orders (${skipped} skipped)`);
  }

  async importDiscrepancies(): Promise<void> {
    console.log('🔧 Importing discrepancies...');
    let imported = 0;
    let skipped = 0;

    for (const record of SAMPLE_DISCREPANCIES) {
      const aircraftId = this.aircraftMap.get(record.registration);
      if (!aircraftId) {
        console.log(`  ⚠️  Aircraft ${record.registration} not found, skipping...`);
        skipped++;
        continue;
      }

      // Check for duplicate by aircraft, date, and ATA chapter
      const dateDetected = new Date(record.dateDetected);
      const existing = await this.discrepancyModel.findOne({
        aircraftId,
        dateDetected,
        ataChapter: record.ataChapter,
        discrepancyText: record.discrepancyText,
      });
      if (existing) {
        skipped++;
        continue;
      }

      await this.discrepancyModel.create({
        aircraftId,
        dateDetected,
        ataChapter: record.ataChapter,
        discrepancyText: record.discrepancyText,
        dateCorrected: record.dateCorrected ? new Date(record.dateCorrected) : undefined,
        correctiveAction: record.correctiveAction,
        responsibility: record.responsibility,
        updatedBy: this.adminUserId,
      });
      imported++;
    }

    console.log(`  ✅ Imported ${imported} discrepancies (${skipped} skipped)`);
  }

  async run(): Promise<void> {
    console.log('\n🚀 Starting historical data import...\n');

    await this.initialize();
    console.log('');

    await this.importDailyStatus();
    console.log('');

    await this.importUtilizationSnapshot();
    console.log('');

    await this.importWorkOrders();
    console.log('');

    await this.importDiscrepancies();

    console.log('\n✨ Historical data import completed!\n');
  }
}


// Main execution
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ImportModule);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aircraftModel = app.get<Model<AircraftDocument>>('AircraftModel');
  const dailyStatusModel = app.get<Model<DailyStatusDocument>>('DailyStatusModel');
  const dailyCounterModel = app.get<Model<DailyCounterDocument>>('DailyCounterModel');
  const workOrderModel = app.get<Model<WorkOrderDocument>>('WorkOrderModel');
  const discrepancyModel = app.get<Model<DiscrepancyDocument>>('DiscrepancyModel');

  const importer = new HistoricalImporter(
    userModel,
    aircraftModel,
    dailyStatusModel,
    dailyCounterModel,
    workOrderModel,
    discrepancyModel,
  );

  try {
    await importer.run();
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
