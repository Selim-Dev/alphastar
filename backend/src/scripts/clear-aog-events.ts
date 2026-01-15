/**
 * Clear all AOG events from the database
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/clear-aog-events.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AOGEvent, AOGEventDocument, AOGEventSchema } from '../aog-events/schemas/aog-event.schema';

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
      { name: AOGEvent.name, schema: AOGEventSchema },
    ]),
  ],
})
class ClearAOGModule {}

async function bootstrap() {
  console.log('🗑️  Clearing all AOG events...\n');
  
  const app = await NestFactory.createApplicationContext(ClearAOGModule);
  const aogEventModel = app.get<Model<AOGEventDocument>>('AOGEventModel');

  try {
    const countBefore = await aogEventModel.countDocuments();
    console.log(`  Found ${countBefore} AOG events`);

    const result = await aogEventModel.deleteMany({});
    console.log(`  ✅ Deleted ${result.deletedCount} AOG events`);

    const countAfter = await aogEventModel.countDocuments();
    console.log(`  Remaining: ${countAfter} AOG events\n`);

    console.log('✨ AOG events cleared successfully!');
    console.log('   Run "npm run seed" to create new events with milestone timestamps\n');
  } catch (error) {
    console.error('❌ Failed to clear AOG events:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
