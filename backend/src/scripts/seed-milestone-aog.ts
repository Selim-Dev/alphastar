/**
 * Seed AOG events with milestone timestamps for three-bucket analytics demo
 * Creates diverse scenarios: long procurement, immediate parts, no parts, with/without ops testing
 * 
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/seed-milestone-aog.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User, UserDocument, UserRole, UserSchema } from '../auth/schemas/user.schema';
import { Aircraft, AircraftDocument, AircraftSchema } from '../aircraft/schemas/aircraft.schema';
import { AOGEvent, AOGEventDocument, AOGEventSchema, ResponsibleParty, AOGCategory } from '../aog-events/schemas/aog-event.schema';

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
      { name: AOGEvent.name, schema: AOGEventSchema },
    ]),
  ],
})
class SeedModule {}

function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

class MilestoneSeeder {
  private adminUserId!: Types.ObjectId;

  constructor(
    private userModel: Model<UserDocument>,
    private aircraftModel: Model<AircraftDocument>,
    private aogEventModel: Model<AOGEventDocument>,
  ) {}

  async initialize(): Promise<void> {
    const admin = await this.userModel.findOne({ role: UserRole.Admin });
    if (!admin) {
      throw new Error('No admin user found. Run main seed script first.');
    }
    this.adminUserId = admin._id as Types.ObjectId;
  }

  async seedDiverseAOGEvents(): Promise<void> {
    console.log('🚨 Seeding diverse AOG events with milestone timestamps...\n');

    const aircraft = await this.aircraftModel.find({ status: 'active' }).limit(5);
    if (aircraft.length === 0) {
      throw new Error('No active aircraft found. Run main seed script first.');
    }

    const scenarios = [
      {
        name: 'Long Procurement Delay',
        description: 'Part takes 5 days to arrive',
        count: 3,
        create: (ac: AircraftDocument, daysAgo: number) => this.createLongProcurementEvent(ac, daysAgo),
      },
      {
        name: 'Immediate Part Availability',
        description: 'Part already in store',
        count: 3,
        create: (ac: AircraftDocument, daysAgo: number) => this.createImmediatePartEvent(ac, daysAgo),
      },
      {
        name: 'No Part Needed',
        description: 'Resolved without parts',
        count: 2,
        create: (ac: AircraftDocument, daysAgo: number) => this.createNoPartEvent(ac, daysAgo),
      },
      {
        name: 'With Ops Testing',
        description: 'Requires operational testing',
        count: 3,
        create: (ac: AircraftDocument, daysAgo: number) => this.createWithOpsTestEvent(ac, daysAgo),
      },
      {
        name: 'Without Ops Testing',
        description: 'No ops testing required',
        count: 2,
        create: (ac: AircraftDocument, daysAgo: number) => this.createWithoutOpsTestEvent(ac, daysAgo),
      },
    ];

    let totalCreated = 0;

    for (const scenario of scenarios) {
      console.log(`📦 Creating ${scenario.count} events: ${scenario.name}`);
      console.log(`   ${scenario.description}`);

      for (let i = 0; i < scenario.count; i++) {
        const ac = aircraft[i % aircraft.length];
        const daysAgo = randomInt(5, 60);
        await scenario.create(ac, daysAgo);
        totalCreated++;
      }
      console.log('');
    }

    console.log(`✅ Created ${totalCreated} diverse AOG events with milestone timestamps\n`);
  }

  private async createLongProcurementEvent(aircraft: AircraftDocument, daysAgo: number): Promise<void> {
    const reportedAt = getDateDaysAgo(daysAgo);
    let currentTime = reportedAt.getTime();

    // Troubleshooting: 4 hours
    currentTime += 4 * 60 * 60 * 1000;
    const procurementRequestedAt = new Date(currentTime);

    // Long procurement: 120 hours (5 days)
    currentTime += 120 * 60 * 60 * 1000;
    const availableAtStoreAt = new Date(currentTime);

    // Issue to maintenance: 1 hour
    currentTime += 1 * 60 * 60 * 1000;
    const issuedBackAt = new Date(currentTime);

    // Installation: 8 hours
    currentTime += 8 * 60 * 60 * 1000;
    const installationCompleteAt = new Date(currentTime);

    // Ops testing: 3 hours
    const testStartAt = new Date(currentTime);
    currentTime += 3 * 60 * 60 * 1000;
    const upAndRunningAt = new Date(currentTime);

    const technicalTimeHours = 4 + 8; // Troubleshooting + Installation
    const procurementTimeHours = 120; // 5 days
    const opsTimeHours = 3;
    const totalDowntimeHours = technicalTimeHours + procurementTimeHours + opsTimeHours;

    await this.aogEventModel.create({
      aircraftId: aircraft._id,
      detectedAt: reportedAt,
      clearedAt: upAndRunningAt,
      category: AOGCategory.Unscheduled,
      reasonCode: 'Hydraulic pump failure - long lead time part',
      responsibleParty: ResponsibleParty.OEM,
      actionTaken: 'Replaced hydraulic pump after extended procurement delay',
      manpowerCount: 3,
      manHours: Math.round(technicalTimeHours * 2),
      costLabor: 15000,
      costParts: 85000,
      reportedAt,
      procurementRequestedAt,
      availableAtStoreAt,
      issuedBackAt,
      installationCompleteAt,
      testStartAt,
      upAndRunningAt,
      technicalTimeHours,
      procurementTimeHours,
      opsTimeHours,
      totalDowntimeHours,
      internalCost: 15000,
      externalCost: 85000,
      updatedBy: this.adminUserId,
    });
  }

  private async createImmediatePartEvent(aircraft: AircraftDocument, daysAgo: number): Promise<void> {
    const reportedAt = getDateDaysAgo(daysAgo);
    let currentTime = reportedAt.getTime();

    // Troubleshooting: 2 hours
    currentTime += 2 * 60 * 60 * 1000;
    const procurementRequestedAt = new Date(currentTime);

    // Part in store: 0.5 hours
    currentTime += 0.5 * 60 * 60 * 1000;
    const availableAtStoreAt = new Date(currentTime);

    // Issue to maintenance: 0.5 hours
    currentTime += 0.5 * 60 * 60 * 1000;
    const issuedBackAt = new Date(currentTime);

    // Installation: 4 hours
    currentTime += 4 * 60 * 60 * 1000;
    const installationCompleteAt = new Date(currentTime);
    const upAndRunningAt = installationCompleteAt; // No ops test

    const technicalTimeHours = 2 + 4; // Troubleshooting + Installation
    const procurementTimeHours = 0.5; // Minimal
    const opsTimeHours = 0;
    const totalDowntimeHours = technicalTimeHours + procurementTimeHours;

    await this.aogEventModel.create({
      aircraftId: aircraft._id,
      detectedAt: reportedAt,
      clearedAt: upAndRunningAt,
      category: AOGCategory.Unscheduled,
      reasonCode: 'Avionics display failure - part in stock',
      responsibleParty: ResponsibleParty.Internal,
      actionTaken: 'Replaced display unit from local inventory',
      manpowerCount: 2,
      manHours: Math.round(technicalTimeHours * 1.5),
      costLabor: 8000,
      costParts: 25000,
      reportedAt,
      procurementRequestedAt,
      availableAtStoreAt,
      issuedBackAt,
      installationCompleteAt,
      upAndRunningAt,
      technicalTimeHours,
      procurementTimeHours,
      opsTimeHours,
      totalDowntimeHours,
      internalCost: 8000,
      externalCost: 25000,
      updatedBy: this.adminUserId,
    });
  }

  private async createNoPartEvent(aircraft: AircraftDocument, daysAgo: number): Promise<void> {
    const reportedAt = getDateDaysAgo(daysAgo);
    let currentTime = reportedAt.getTime();

    // Troubleshooting: 3 hours
    currentTime += 3 * 60 * 60 * 1000;

    // Repair without parts: 5 hours
    currentTime += 5 * 60 * 60 * 1000;
    const installationCompleteAt = new Date(currentTime);
    const upAndRunningAt = installationCompleteAt; // No ops test

    const technicalTimeHours = 3 + 5; // All technical
    const procurementTimeHours = 0;
    const opsTimeHours = 0;
    const totalDowntimeHours = technicalTimeHours;

    await this.aogEventModel.create({
      aircraftId: aircraft._id,
      detectedAt: reportedAt,
      clearedAt: upAndRunningAt,
      category: AOGCategory.Unscheduled,
      reasonCode: 'Loose electrical connection - no parts required',
      responsibleParty: ResponsibleParty.Internal,
      actionTaken: 'Tightened connections and tested system',
      manpowerCount: 2,
      manHours: Math.round(technicalTimeHours * 1.2),
      costLabor: 5000,
      costParts: 0,
      reportedAt,
      installationCompleteAt,
      upAndRunningAt,
      technicalTimeHours,
      procurementTimeHours,
      opsTimeHours,
      totalDowntimeHours,
      internalCost: 5000,
      externalCost: 0,
      updatedBy: this.adminUserId,
    });
  }

  private async createWithOpsTestEvent(aircraft: AircraftDocument, daysAgo: number): Promise<void> {
    const reportedAt = getDateDaysAgo(daysAgo);
    let currentTime = reportedAt.getTime();

    // Troubleshooting: 6 hours
    currentTime += 6 * 60 * 60 * 1000;
    const procurementRequestedAt = new Date(currentTime);

    // Standard procurement: 36 hours
    currentTime += 36 * 60 * 60 * 1000;
    const availableAtStoreAt = new Date(currentTime);

    // Issue to maintenance: 1 hour
    currentTime += 1 * 60 * 60 * 1000;
    const issuedBackAt = new Date(currentTime);

    // Installation: 12 hours
    currentTime += 12 * 60 * 60 * 1000;
    const installationCompleteAt = new Date(currentTime);

    // Ops testing: 6 hours
    const testStartAt = new Date(currentTime);
    currentTime += 6 * 60 * 60 * 1000;
    const upAndRunningAt = new Date(currentTime);

    const technicalTimeHours = 6 + 12; // Troubleshooting + Installation
    const procurementTimeHours = 36;
    const opsTimeHours = 6;
    const totalDowntimeHours = technicalTimeHours + procurementTimeHours + opsTimeHours;

    await this.aogEventModel.create({
      aircraftId: aircraft._id,
      detectedAt: reportedAt,
      clearedAt: upAndRunningAt,
      category: AOGCategory.Unscheduled,
      reasonCode: 'Engine control unit malfunction - requires ops validation',
      responsibleParty: ResponsibleParty.OEM,
      actionTaken: 'Replaced ECU and completed full engine run test',
      manpowerCount: 4,
      manHours: Math.round((technicalTimeHours + opsTimeHours) * 1.5),
      costLabor: 20000,
      costParts: 120000,
      reportedAt,
      procurementRequestedAt,
      availableAtStoreAt,
      issuedBackAt,
      installationCompleteAt,
      testStartAt,
      upAndRunningAt,
      technicalTimeHours,
      procurementTimeHours,
      opsTimeHours,
      totalDowntimeHours,
      internalCost: 20000,
      externalCost: 120000,
      updatedBy: this.adminUserId,
    });
  }

  private async createWithoutOpsTestEvent(aircraft: AircraftDocument, daysAgo: number): Promise<void> {
    const reportedAt = getDateDaysAgo(daysAgo);
    let currentTime = reportedAt.getTime();

    // Troubleshooting: 3 hours
    currentTime += 3 * 60 * 60 * 1000;
    const procurementRequestedAt = new Date(currentTime);

    // Standard procurement: 24 hours
    currentTime += 24 * 60 * 60 * 1000;
    const availableAtStoreAt = new Date(currentTime);

    // Issue to maintenance: 1 hour
    currentTime += 1 * 60 * 60 * 1000;
    const issuedBackAt = new Date(currentTime);

    // Installation: 6 hours
    currentTime += 6 * 60 * 60 * 1000;
    const installationCompleteAt = new Date(currentTime);
    const upAndRunningAt = installationCompleteAt; // No ops test

    const technicalTimeHours = 3 + 6; // Troubleshooting + Installation
    const procurementTimeHours = 24;
    const opsTimeHours = 0;
    const totalDowntimeHours = technicalTimeHours + procurementTimeHours;

    await this.aogEventModel.create({
      aircraftId: aircraft._id,
      detectedAt: reportedAt,
      clearedAt: upAndRunningAt,
      category: AOGCategory.Unscheduled,
      reasonCode: 'Landing gear actuator replacement - no ops test required',
      responsibleParty: ResponsibleParty.Internal,
      actionTaken: 'Replaced actuator and performed ground checks',
      manpowerCount: 3,
      manHours: Math.round(technicalTimeHours * 1.8),
      costLabor: 12000,
      costParts: 45000,
      reportedAt,
      procurementRequestedAt,
      availableAtStoreAt,
      issuedBackAt,
      installationCompleteAt,
      upAndRunningAt,
      technicalTimeHours,
      procurementTimeHours,
      opsTimeHours,
      totalDowntimeHours,
      internalCost: 12000,
      externalCost: 45000,
      updatedBy: this.adminUserId,
    });
  }

  async run(): Promise<void> {
    await this.initialize();
    await this.seedDiverseAOGEvents();
    
    console.log('✨ Milestone AOG seeding completed!\n');
    console.log('You can now test the three-bucket analytics at:');
    console.log('  GET /api/aog-events/analytics/buckets\n');
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aircraftModel = app.get<Model<AircraftDocument>>('AircraftModel');
  const aogEventModel = app.get<Model<AOGEventDocument>>('AOGEventModel');

  const seeder = new MilestoneSeeder(userModel, aircraftModel, aogEventModel);

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
