import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database';
import { AuthModule } from './auth';
import { AircraftModule } from './aircraft';
import { UtilizationModule } from './utilization';
import { DailyStatusModule } from './daily-status/daily-status.module';
import { AOGEventsModule } from './aog-events/aog-events.module';
import { MaintenanceTasksModule } from './maintenance-tasks/maintenance-tasks.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';
import { WorkOrderSummariesModule } from './work-order-summaries/work-order-summaries.module';
import { DiscrepanciesModule } from './discrepancies/discrepancies.module';
import { BudgetModule } from './budget/budget.module';
import { BudgetProjectsModule } from './budget-projects/budget-projects.module';
import { ImportExportModule } from './import-export/import-export.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DemoModule } from './demo/demo.module';
import { VacationPlansModule } from './vacation-plans/vacation-plans.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    AircraftModule,
    UtilizationModule,
    DailyStatusModule,
    AOGEventsModule,
    MaintenanceTasksModule,
    WorkOrdersModule,
    WorkOrderSummariesModule,
    DiscrepanciesModule,
    BudgetModule,
    BudgetProjectsModule,
    ImportExportModule,
    DashboardModule,
    DemoModule,
    VacationPlansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
