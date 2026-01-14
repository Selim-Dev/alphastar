import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Aircraft, AircraftSchema } from '../aircraft/schemas/aircraft.schema';
import { DailyStatus, DailyStatusSchema } from '../daily-status/schemas/daily-status.schema';
import { DailyCounter, DailyCounterSchema } from '../utilization/schemas/daily-counter.schema';
import { AOGEvent, AOGEventSchema } from '../aog-events/schemas/aog-event.schema';
import { MaintenanceTask, MaintenanceTaskSchema } from '../maintenance-tasks/schemas/maintenance-task.schema';
import { WorkOrder, WorkOrderSchema } from '../work-orders/schemas/work-order.schema';
import { Discrepancy, DiscrepancySchema } from '../discrepancies/schemas/discrepancy.schema';
import { BudgetPlan, BudgetPlanSchema } from '../budget/schemas/budget-plan.schema';
import { ActualSpend, ActualSpendSchema } from '../budget/schemas/actual-spend.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Aircraft.name, schema: AircraftSchema },
      { name: DailyStatus.name, schema: DailyStatusSchema },
      { name: DailyCounter.name, schema: DailyCounterSchema },
      { name: AOGEvent.name, schema: AOGEventSchema },
      { name: MaintenanceTask.name, schema: MaintenanceTaskSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: Discrepancy.name, schema: DiscrepancySchema },
      { name: BudgetPlan.name, schema: BudgetPlanSchema },
      { name: ActualSpend.name, schema: ActualSpendSchema },
    ]),
  ],
  controllers: [DemoController],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
