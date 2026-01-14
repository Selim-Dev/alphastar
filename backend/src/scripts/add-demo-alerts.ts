/**
 * Add Demo Alerts Script
 * Creates a few active AOG events and overdue work orders for dashboard alerts
 * Run with: npx ts-node -r tsconfig-paths/register src/scripts/add-demo-alerts.ts
 */

import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Aircraft, AircraftDocument, AircraftSchema } from '../aircraft/schemas/aircraft.schema';
import { AOGEvent, AOGEventDocument, AOGEventSchema, ResponsibleParty, AOGCategory } from '../aog-events/schemas/aog-event.schema';
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
      { name: Aircraft.name, schema: AircraftSchema },
      { name: AOGEvent.name, schema: AOGEventSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
    ]),
  ],
})
class AddAlertsModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AddAlertsModule);

  const userModel = app.get<Model<UserDocument>>('UserModel');
  const aircraftModel = app.get<Model<AircraftDocument>>('AircraftModel');
  const aogEventModel = app.get<Model<AOGEventDocument>>('AOGEventModel');
  const workOrderModel = app.get<Model<WorkOrderDocument>>('WorkOrderModel');

  console.log('\n🚨 Adding demo alerts for dashboard...\n');

  const admin = await userModel.findOne({ role: UserRole.Admin });
  if (!admin) {
    console.error('❌ No admin user found');
    process.exit(1);
  }

  // Get some aircraft for the alerts
  const aircraft = await aircraftModel.find({}).limit(5);
  if (aircraft.length < 3) {
    console.error('❌ Not enough aircraft found');
    process.exit(1);
  }

  // First, clear existing active AOG events to start fresh
  console.log('📌 Clearing existing active AOG events...');
  await aogEventModel.updateMany(
    { clearedAt: null },
    { $set: { clearedAt: new Date(), actionTaken: 'Resolved - system cleanup' } }
  );

  // Create 3 active AOG events with different responsible parties (Critical alerts)
  console.log('📌 Creating active AOG events (Critical alerts)...');
  
  const aogEvents = [
    {
      aircraftId: aircraft[0]._id,
      detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      category: AOGCategory.AOG,
      reasonCode: 'Engine failure - Fan blade damage',
      responsibleParty: ResponsibleParty.OEM,
      actionTaken: 'Awaiting OEM technical support and replacement parts',
      manpowerCount: 4,
      manHours: 16,
      costLabor: 8000,
      costParts: 45000,
      updatedBy: admin._id,
    },
    {
      aircraftId: aircraft[1]._id,
      detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      category: AOGCategory.Unscheduled,
      reasonCode: 'Hydraulic system leak - Main gear',
      responsibleParty: ResponsibleParty.Internal,
      actionTaken: 'Maintenance team investigating, parts ordered',
      manpowerCount: 3,
      manHours: 24,
      costLabor: 6000,
      costParts: 12000,
      updatedBy: admin._id,
    },
    {
      aircraftId: aircraft[2]._id,
      detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      category: AOGCategory.AOG,
      reasonCode: 'Avionics malfunction - Navigation system',
      responsibleParty: ResponsibleParty.Customs,
      actionTaken: 'Replacement unit held at customs, expediting clearance',
      manpowerCount: 2,
      manHours: 8,
      costLabor: 4000,
      costParts: 28000,
      costExternal: 5000,
      updatedBy: admin._id,
    },
  ];

  for (const event of aogEvents) {
    await aogEventModel.create(event);
    const ac = aircraft.find(a => a._id.equals(event.aircraftId));
    console.log(`  ✅ Created AOG: ${ac?.registration} - ${event.responsibleParty} - ${event.reasonCode.substring(0, 30)}...`);
  }

  // Create 2 overdue work orders (Warning alerts)
  console.log('\n📋 Creating overdue work orders (Warning alerts)...');
  
  const now = new Date();
  const overdueWOs = [
    {
      woNumber: `WO-DEMO-${Date.now()}-1`,
      aircraftId: aircraft[3]._id,
      description: 'Scheduled C-Check inspection - overdue',
      status: WorkOrderStatus.InProgress,
      dateIn: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days overdue
      mrNumber: 'MR-DEMO-001',
      updatedBy: admin._id,
    },
    {
      woNumber: `WO-DEMO-${Date.now()}-2`,
      aircraftId: aircraft[4]._id,
      description: 'Landing gear service - overdue',
      status: WorkOrderStatus.Open,
      dateIn: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day overdue
      mrNumber: 'MR-DEMO-002',
      updatedBy: admin._id,
    },
  ];

  for (const wo of overdueWOs) {
    await workOrderModel.create(wo);
    const ac = aircraft.find(a => a._id.equals(wo.aircraftId));
    console.log(`  ✅ Created overdue WO: ${ac?.registration} - ${wo.description.substring(0, 40)}...`);
  }

  // Summary
  const activeAOGCount = await aogEventModel.countDocuments({ clearedAt: null });
  const overdueCount = await workOrderModel.countDocuments({
    dueDate: { $lt: now },
    status: { $ne: WorkOrderStatus.Closed }
  });

  console.log('\n📊 Alert Summary:');
  console.log(`  🔴 Critical (Active AOG): ${activeAOGCount}`);
  console.log(`  🟡 Warning (Overdue WO): ${overdueCount}`);
  console.log(`  🔵 Info: Upcoming maintenance (auto-generated)`);

  console.log('\n✨ Demo alerts added successfully!\n');

  await app.close();
}

bootstrap().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
