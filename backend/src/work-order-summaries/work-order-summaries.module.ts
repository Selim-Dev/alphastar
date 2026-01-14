import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  WorkOrderSummary,
  WorkOrderSummarySchema,
} from './schemas/work-order-summary.schema';
import { WorkOrderSummaryRepository } from './repositories/work-order-summary.repository';
import { WorkOrderSummariesService } from './services/work-order-summaries.service';
import { WorkOrderSummariesController } from './work-order-summaries.controller';
import { AircraftModule } from '../aircraft/aircraft.module';

/**
 * Module for WorkOrderSummary feature
 * Requirements: 11.1
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkOrderSummary.name, schema: WorkOrderSummarySchema },
    ]),
    AircraftModule, // For fleet group filtering
  ],
  controllers: [WorkOrderSummariesController],
  providers: [WorkOrderSummariesService, WorkOrderSummaryRepository],
  exports: [WorkOrderSummariesService, WorkOrderSummaryRepository],
})
export class WorkOrderSummariesModule {}
