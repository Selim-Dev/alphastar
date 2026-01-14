import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportLog, ImportLogSchema } from './schemas/import-log.schema';
import { ImportLogRepository } from './repositories/import-log.repository';
import { ExcelTemplateService } from './services/excel-template.service';
import { ExcelParserService } from './services/excel-parser.service';
import { ImportService } from './services/import.service';
import { ExportService } from './services/export.service';
import { ImportExportController } from './import-export.controller';
import { AircraftModule } from '../aircraft/aircraft.module';
import { UtilizationModule } from '../utilization/utilization.module';
import { MaintenanceTasksModule } from '../maintenance-tasks/maintenance-tasks.module';
import { AOGEventsModule } from '../aog-events/aog-events.module';
import { BudgetModule } from '../budget/budget.module';
import { DailyStatusModule } from '../daily-status/daily-status.module';
import { WorkOrdersModule } from '../work-orders/work-orders.module';
import { DiscrepanciesModule } from '../discrepancies/discrepancies.module';
import { WorkOrderSummariesModule } from '../work-order-summaries/work-order-summaries.module';
import { VacationPlansModule } from '../vacation-plans/vacation-plans.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ImportLog.name, schema: ImportLogSchema },
    ]),
    AircraftModule,
    UtilizationModule,
    MaintenanceTasksModule,
    AOGEventsModule,
    BudgetModule,
    DailyStatusModule,
    WorkOrdersModule,
    DiscrepanciesModule,
    WorkOrderSummariesModule,
    forwardRef(() => VacationPlansModule),
  ],
  controllers: [ImportExportController],
  providers: [
    ImportLogRepository,
    ExcelTemplateService,
    ExcelParserService,
    ImportService,
    ExportService,
  ],
  exports: [
    ImportLogRepository,
    ExcelTemplateService,
    ExcelParserService,
    ImportService,
    ExportService,
  ],
})
export class ImportExportModule {}
