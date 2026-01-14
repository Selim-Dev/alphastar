import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BudgetPlan, BudgetPlanSchema } from './schemas/budget-plan.schema';
import { ActualSpend, ActualSpendSchema } from './schemas/actual-spend.schema';
import { BudgetPlanRepository } from './repositories/budget-plan.repository';
import { ActualSpendRepository } from './repositories/actual-spend.repository';
import { BudgetService } from './services/budget.service';
import { BudgetController } from './budget.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BudgetPlan.name, schema: BudgetPlanSchema },
      { name: ActualSpend.name, schema: ActualSpendSchema },
    ]),
  ],
  controllers: [BudgetController],
  providers: [BudgetService, BudgetPlanRepository, ActualSpendRepository],
  exports: [BudgetService, BudgetPlanRepository, ActualSpendRepository],
})
export class BudgetModule {}
