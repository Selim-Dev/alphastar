/**
 * Check 2024 Data Script
 * Verifies that 2024 historical data exists for YoY comparison
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { DailyStatus, DailyStatusDocument, DailyStatusSchema } from '../daily-status/schemas/daily-status.schema';
import { DailyCounter, DailyCounterDocument, DailyCounterSchema } from '../utilization/schemas/daily-counter.schema';

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
      { name: DailyStatus.name, schema: DailyStatusSchema },
      { name: DailyCounter.name, schema: DailyCounterSchema },
    ]),
  ],
})
class CheckDataModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(CheckDataModule);

  const dailyStatusModel = app.get<Model<DailyStatusDocument>>('DailyStatusModel');
  const dailyCounterModel = app.get<Model<DailyCounterDocument>>('DailyCounterModel');

  console.log('\n📊 Checking 2024 historical data...\n');

  // Check date range for YoY comparison (Nov 20, 2024 to Dec 20, 2024)
  const startDate = new Date('2024-11-20');
  const endDate = new Date('2024-12-20');

  console.log(`Looking for data between ${startDate.toISOString()} and ${endDate.toISOString()}\n`);

  // Check daily status
  const statusCount = await dailyStatusModel.countDocuments({
    date: { $gte: startDate, $lte: endDate }
  });
  console.log(`Daily Status records in range: ${statusCount}`);

  // Check utilization counters
  const counterCount = await dailyCounterModel.countDocuments({
    date: { $gte: startDate, $lte: endDate }
  });
  console.log(`Utilization Counter records in range: ${counterCount}`);

  // Get sample dates
  const sampleStatus = await dailyStatusModel.find({
    date: { $gte: startDate, $lte: endDate }
  }).limit(5).select('date aircraftId');
  
  console.log('\nSample Daily Status dates:');
  sampleStatus.forEach(s => console.log(`  ${s.date.toISOString()}`));

  // Check all 2024 data
  const all2024Start = new Date('2024-01-01');
  const all2024End = new Date('2024-12-31');
  
  const total2024Status = await dailyStatusModel.countDocuments({
    date: { $gte: all2024Start, $lte: all2024End }
  });
  const total2024Counters = await dailyCounterModel.countDocuments({
    date: { $gte: all2024Start, $lte: all2024End }
  });

  console.log(`\nTotal 2024 Daily Status records: ${total2024Status}`);
  console.log(`Total 2024 Utilization Counter records: ${total2024Counters}`);

  // Get date range of 2024 data
  const minDate = await dailyStatusModel.findOne({ 
    date: { $gte: all2024Start, $lte: all2024End } 
  }).sort({ date: 1 }).select('date');
  const maxDate = await dailyStatusModel.findOne({ 
    date: { $gte: all2024Start, $lte: all2024End } 
  }).sort({ date: -1 }).select('date');

  if (minDate && maxDate) {
    console.log(`\n2024 data date range: ${minDate.date.toISOString()} to ${maxDate.date.toISOString()}`);
  }

  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Check failed:', err);
  process.exit(1);
});
