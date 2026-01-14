import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkOrder, WorkOrderSchema } from './schemas/work-order.schema';
import { WorkOrderRepository } from './repositories/work-order.repository';
import { WorkOrdersService } from './services/work-orders.service';
import { WorkOrdersController } from './work-orders.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkOrder.name, schema: WorkOrderSchema },
    ]),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, WorkOrderRepository],
  exports: [WorkOrdersService, WorkOrderRepository],
})
export class WorkOrdersModule {}
