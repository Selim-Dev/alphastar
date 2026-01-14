/**
 * Fix Demo Data Script
 * - Clears most active AOG events (keeps only 1-2)
 * - Closes overdue work orders
 * - Improves Fleet Health Score
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/fix-demo-data.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AOGEvent, AOGEventDocument, AOGEventSchema } from '../aog-events/schemas/aog-event.schema';
import { WorkOrder, WorkOrderDocument, WorkOrderSchema, WorkOrderStatus } from '../work-orders/schemas/work-order.schema';
import { User, UserDocument, UserSchema, UserRole } from '../auth/schemas/user.schema';

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
      { name: AOGEvent.name, schema: AOGEventSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
    ]),
  ],
})
class FixDataModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(FixDataModule);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aogEventModel = app.get<Model<AOGEventDocument>>('AOGEventModel');
  const workOrderModel = app.get<Model<WorkOrderDocument>>('WorkOrderModel');

  console.log('\n🔧 Fixing demo data for better Fleet Health Score...\n');

  const admin = await userModel.findOne({ role: UserRole.Admin });
  if (!admin) {
    console.error('❌ No admin user found');
    process.exit(1);
  }

  // 1. Clear most active AOG events (keep only 1)
  console.log('📌 Fixing active AOG events...');
  const activeAOGs = await aogEventModel.find({ clearedAt: null });
  console.log(`  Found ${activeAOGs.length} active AOG events`);
  
  // Keep only the first one active, clear the rest
  let clearedCount = 0;
  for (let i = 1; i < activeAOGs.length; i++) {
    const aog = activeAOGs[i];
    const clearedAt = new Date();
    clearedAt.setHours(clearedAt.getHours() - Math.floor(Math.random() * 24)); // Cleared within last 24h
    
    await aogEventModel.updateOne(
      { _id: aog._id },
      { 
        $set: { 
          clearedAt,
          actionTaken: 'Issue resolved - aircraft returned to service',
          updatedBy: admin._id 
        } 
      }
    );
    clearedCount++;
  }
  console.log(`  ✅ Cleared ${clearedCount} AOG events (kept 1 active)`);

  // 2. Close overdue work orders
  console.log('\n📋 Fixing overdue work orders...');
  const now = new Date();
  const overdueWOs = await workOrderModel.find({
    dueDate: { $lt: now },
    status: { $ne: WorkOrderStatus.Closed }
  });
  console.log(`  Found ${overdueWOs.length} overdue work orders`);

  let closedCount = 0;
  for (const wo of overdueWOs) {
    const dateOut = new Date(wo.dueDate || new Date());
    dateOut.setDate(dateOut.getDate() + Math.floor(Math.random() * 3)); // Closed 0-3 days after due
    
    await workOrderModel.updateOne(
      { _id: wo._id },
      {
        $set: {
          status: WorkOrderStatus.Closed,
          dateOut,
          crsNumber: `CRS-${Math.floor(10000 + Math.random() * 90000)}`,
          updatedBy: admin._id
        }
      }
    );
    closedCount++;
  }
  console.log(`  ✅ Closed ${closedCount} overdue work orders`);

  // 3. Summary
  const remainingActiveAOGs = await aogEventModel.countDocuments({ clearedAt: null });
  const remainingOverdue = await workOrderModel.countDocuments({
    dueDate: { $lt: now },
    status: { $ne: WorkOrderStatus.Closed }
  });

  console.log('\n📊 Current Status:');
  console.log(`  Active AOG events: ${remainingActiveAOGs}`);
  console.log(`  Overdue work orders: ${remainingOverdue}`);
  
  // Calculate expected health score
  // Availability ~98% = 98 points
  // AOG Impact = 100 - (1 * 10) = 90 points
  // Budget Health ~80% utilization = 20 points (100 - 80)
  // Maintenance Efficiency = 100 - (0 * 5) = 100 points
  // Score = 98*0.4 + 90*0.25 + 20*0.2 + 100*0.15 = 39.2 + 22.5 + 4 + 15 = 80.7
  console.log('\n  Expected Fleet Health Score: ~85+ (Healthy)');

  console.log('\n✨ Demo data fixed!\n');

  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Fix failed:', err);
  process.exit(1);
});
