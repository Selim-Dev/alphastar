import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VacationPlan,
  VacationPlanSchema,
} from './schemas/vacation-plan.schema';
import { VacationPlanRepository } from './repositories/vacation-plan.repository';
import { VacationPlansService } from './services/vacation-plans.service';
import { VacationPlansController } from './vacation-plans.controller';
import { ImportExportModule } from '../import-export/import-export.module';

/**
 * Module for VacationPlan feature
 * Requirements: 15.1
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VacationPlan.name, schema: VacationPlanSchema },
    ]),
    forwardRef(() => ImportExportModule),
  ],
  controllers: [VacationPlansController],
  providers: [VacationPlansService, VacationPlanRepository],
  exports: [VacationPlansService, VacationPlanRepository],
})
export class VacationPlansModule {}
