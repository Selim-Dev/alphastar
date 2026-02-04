/**
 * Seed 2024 Historical Data Script
 * Adds daily status and utilization records for 2024 to enable YoY comparison
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/seed-2024.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Aircraft, AircraftDocument, AircraftSchema } from '../aircraft/schemas/aircraft.schema';
import { DailyStatus, DailyStatusDocument, DailyStatusSchema } from '../daily-status/schemas/daily-status.schema';
import { DailyCounter, DailyCounterDocument, DailyCounterSchema } from '../utilization/schemas/daily-counter.schema';
import { User, UserDocument, UserSchema, UserRole } from '../auth/schemas/user.schema';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
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
    ]),
  ],
})
class Seed2024Module {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(Seed2024Module);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aircraftModel = app.get<Model<AircraftDocument>>('AircraftModel');
  const dailyStatusModel = app.get<Model<DailyStatusDocument>>('DailyStatusModel');
  const dailyCounterModel = app.get<Model<DailyCounterDocument>>('DailyCounterModel');

  console.log('\n📅 Seeding 2024 historical data for YoY comparison...\n');

  // Get admin user for updatedBy field
  const admin = await userModel.findOne({ role: UserRole.Admin });
  if (!admin) {
    console.error('❌ No admin user found');
    process.exit(1);
  }
  const adminId = admin._id as Types.ObjectId;

  // Get all aircraft
  const aircraft = await aircraftModel.find({});
  console.log(`Found ${aircraft.length} aircraft\n`);

  const DAYS_OF_DATA = 90;
  let statusCreated = 0;
  let counterCreated = 0;

  // Bulk operations for faster insertion
  const statusDocs: Partial<DailyStatus>[] = [];
  const counterDocs: Partial<DailyCounter>[] = [];

  for (const ac of aircraft) {
    // Use the earliest available date (manufactureDate, certificationDate, or inServiceDate)
    const referenceDate = ac.manufactureDate || ac.certificationDate || ac.inServiceDate || new Date('2010-01-01');
    const yearsOld = (new Date().getTime() - new Date(referenceDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    let baseHours = Math.max(0, (yearsOld - 1) * 800 + randomInt(800, 4000));
    let baseCycles = Math.max(0, (yearsOld - 1) * 300 + randomInt(400, 1500));
    let engineHours = baseHours * 0.95;
    let engineCycles = baseCycles * 0.95;
    let apuHours = baseHours * 0.3;

    for (let day = 0; day < DAYS_OF_DATA; day++) {
      // Calculate date for same period in 2024
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - day);
      const historicalDate = new Date(currentDate);
      historicalDate.setFullYear(2024);
      historicalDate.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

      // Daily Status
      const posHours = 24;
      let nmcmSHours = 0;
      let nmcmUHours = 0;
      if (Math.random() < 0.18) nmcmSHours = randomFloat(1, 5, 1);
      if (Math.random() < 0.10) nmcmUHours = randomFloat(0.5, 3, 1);
      const fmcHours = Math.max(17, posHours - nmcmSHours - nmcmUHours);

      statusDocs.push({
        aircraftId: ac._id as Types.ObjectId,
        date: historicalDate,
        posHours,
        fmcHours,
        nmcmSHours,
        nmcmUHours,
        updatedBy: adminId,
      });

      // Utilization Counter
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
        updatedBy: adminId,
      };

      if (ac.enginesCount === 4) {
        counterData.engine3Hours = parseFloat((engineHours * 0.98).toFixed(1));
        counterData.engine3Cycles = engineCycles;
        counterData.engine4Hours = parseFloat((engineHours * 0.97).toFixed(1));
        counterData.engine4Cycles = engineCycles;
      }

      counterDocs.push(counterData);
    }
  }

  // Insert with ordered: false to skip duplicates
  console.log(`Inserting ${statusDocs.length} daily status records...`);
  try {
    const statusResult = await dailyStatusModel.insertMany(statusDocs, { ordered: false });
    statusCreated = statusResult.length;
  } catch (err: unknown) {
    const mongoErr = err as { insertedDocs?: unknown[] };
    if (mongoErr.insertedDocs) {
      statusCreated = mongoErr.insertedDocs.length;
    }
    console.log('  (Some duplicates skipped)');
  }

  console.log(`Inserting ${counterDocs.length} utilization counter records...`);
  try {
    const counterResult = await dailyCounterModel.insertMany(counterDocs, { ordered: false });
    counterCreated = counterResult.length;
  } catch (err: unknown) {
    const mongoErr = err as { insertedDocs?: unknown[] };
    if (mongoErr.insertedDocs) {
      counterCreated = mongoErr.insertedDocs.length;
    }
    console.log('  (Some duplicates skipped)');
  }

  console.log(`\n✅ Created ${statusCreated} daily status records for 2024`);
  console.log(`✅ Created ${counterCreated} utilization counter records for 2024`);
  console.log('\n✨ 2024 historical data seeding completed!\n');

  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
