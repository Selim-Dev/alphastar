/**
 * Seed 2025 Historical Data Script
 * Adds daily status and utilization records for 2025 to enable YoY comparison in 2026
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/seed-2025.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Aircraft, AircraftSchema, AircraftDocument } from '../aircraft/schemas/aircraft.schema';
import { User, UserSchema, UserDocument } from '../auth/schemas/user.schema';
import { DailyStatus, DailyStatusSchema, DailyStatusDocument } from '../daily-status/schemas/daily-status.schema';
import { DailyCounter, DailyCounterSchema, DailyCounterDocument } from '../utilization/schemas/daily-counter.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Aircraft.name, schema: AircraftSchema },
      { name: User.name, schema: UserSchema },
      { name: DailyStatus.name, schema: DailyStatusSchema },
      { name: DailyCounter.name, schema: DailyCounterSchema },
    ]),
  ],
})
class Seed2025Module {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(Seed2025Module);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aircraftModel = app.get<Model<AircraftDocument>>('AircraftModel');
  const dailyStatusModel = app.get<Model<DailyStatusDocument>>('DailyStatusModel');
  const dailyCounterModel = app.get<Model<DailyCounterDocument>>('DailyCounterModel');

  console.log('\n📅 Seeding 2025 historical data for YoY comparison...\n');

  // Get admin user for updatedBy field
  const adminUser = await userModel.findOne({ email: 'admin@alphastarav.com' });
  if (!adminUser) {
    console.error('❌ Admin user not found. Please run main seed script first.');
    await app.close();
    return;
  }

  // Get all aircraft
  const aircraft = await aircraftModel.find({ status: 'active' }).exec();
  if (aircraft.length === 0) {
    console.error('❌ No aircraft found. Please run main seed script first.');
    await app.close();
    return;
  }

  console.log(`Found ${aircraft.length} active aircraft\n`);

  // Seed data for the last 90 days of 2025 (to match current 2026 data)
  const DAYS_OF_DATA = 90;
  let statusCreated = 0;
  let counterCreated = 0;

  for (const ac of aircraft) {
    console.log(`Processing ${ac.registration}...`);

    for (let day = 0; day < DAYS_OF_DATA; day++) {
      // Calculate date for same period in 2025
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - day);
      const historicalDate = new Date(currentDate);
      historicalDate.setFullYear(2025);
      historicalDate.setHours(12, 0, 0, 0); // Noon to avoid timezone issues

      // Check if record already exists
      const existingStatus = await dailyStatusModel.findOne({
        aircraftId: ac._id,
        date: historicalDate,
      });

      if (!existingStatus) {
        // Generate realistic availability data (85-98% availability)
        const baseAvailability = 0.85 + Math.random() * 0.13;
        const posHours = 24;
        const fmcHours = Math.round(posHours * baseAvailability * 10) / 10;
        const nmcmSHours = Math.round((posHours - fmcHours) * 0.6 * 10) / 10;
        const nmcmUHours = Math.round((posHours - fmcHours - nmcmSHours) * 10) / 10;

        await dailyStatusModel.create({
          aircraftId: ac._id,
          date: historicalDate,
          posHours,
          fmcHours,
          nmcmSHours,
          nmcmUHours,
          nmcsHours: 0,
          notes: 'Historical data for YoY comparison',
          updatedBy: adminUser._id,
          isDemo: true,
        });
        statusCreated++;
      }

      // Seed Utilization Counters for 2025
      const existingCounter = await dailyCounterModel.findOne({
        aircraftId: ac._id,
        date: historicalDate,
      });

      if (!existingCounter) {
        // Generate realistic flight hours (2-12 hours per day)
        const dailyFlightHours = 2 + Math.random() * 10;
        const dailyCycles = Math.floor(dailyFlightHours / 2.5); // Average 2.5 hours per cycle

        // Calculate cumulative values (starting from a base)
        const baseHours = 10000 + Math.random() * 5000;
        const baseCycles = 5000 + Math.random() * 2000;
        const dayOffset = DAYS_OF_DATA - day;
        
        const airframeHoursTtsn = Math.round((baseHours + (dayOffset * dailyFlightHours)) * 100) / 100;
        const airframeCyclesTcsn = Math.floor(baseCycles + (dayOffset * dailyCycles));

        // Engine hours (slightly different from airframe)
        const engine1Hours = Math.round((airframeHoursTtsn + Math.random() * 100) * 100) / 100;
        const engine2Hours = Math.round((airframeHoursTtsn + Math.random() * 100) * 100) / 100;
        const engine1Cycles = airframeCyclesTcsn + Math.floor(Math.random() * 50);
        const engine2Cycles = airframeCyclesTcsn + Math.floor(Math.random() * 50);

        // APU hours (about 10% of airframe hours)
        const apuHours = Math.round((airframeHoursTtsn * 0.1) * 100) / 100;
        const apuCycles = Math.floor(airframeCyclesTcsn * 0.8);

        const counterData: any = {
          aircraftId: ac._id,
          date: historicalDate,
          airframeHoursTtsn,
          airframeCyclesTcsn,
          engine1Hours,
          engine1Cycles,
          engine2Hours,
          engine2Cycles,
          apuHours,
          apuCycles,
          lastFlightDate: historicalDate,
          updatedBy: adminUser._id,
          isDemo: true,
        };

        // Add engine 3/4 for 4-engine aircraft
        if (ac.enginesCount === 4) {
          counterData.engine3Hours = Math.round((airframeHoursTtsn + Math.random() * 100) * 100) / 100;
          counterData.engine3Cycles = airframeCyclesTcsn + Math.floor(Math.random() * 50);
          counterData.engine4Hours = Math.round((airframeHoursTtsn + Math.random() * 100) * 100) / 100;
          counterData.engine4Cycles = airframeCyclesTcsn + Math.floor(Math.random() * 50);
        }

        await dailyCounterModel.create(counterData);
        counterCreated++;
      }
    }
  }

  console.log(`\n✅ Created ${statusCreated} daily status records for 2025`);
  console.log(`✅ Created ${counterCreated} utilization counter records for 2025`);
  console.log('\n✨ 2025 historical data seeding completed!\n');

  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Error seeding 2025 data:', error);
  process.exit(1);
});
