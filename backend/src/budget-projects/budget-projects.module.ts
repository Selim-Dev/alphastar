import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { BudgetProject, BudgetProjectSchema } from './schemas/budget-project.schema';
import { BudgetPlanRow, BudgetPlanRowSchema } from './schemas/budget-plan-row.schema';
import { BudgetActual, BudgetActualSchema } from './schemas/budget-actual.schema';
import { BudgetAuditLog, BudgetAuditLogSchema } from './schemas/budget-audit-log.schema';

// Repositories
import { BudgetProjectRepository } from './repositories/budget-project.repository';
import { BudgetPlanRowRepository } from './repositories/budget-plan-row.repository';
import { BudgetActualRepository } from './repositories/budget-actual.repository';
import { BudgetAuditLogRepository } from './repositories/budget-audit-log.repository';

// Services
import { BudgetProjectsService } from './services/budget-projects.service';
import { BudgetTemplatesService } from './services/budget-templates.service';
import { BudgetAnalyticsService } from './services/budget-analytics.service';
import { BudgetImportService } from './services/budget-import.service';
import { BudgetExportService } from './services/budget-export.service';

// Controllers
import { BudgetProjectsController } from './controllers/budget-projects.controller';
import { BudgetTemplatesController } from './controllers/budget-templates.controller';
import { BudgetAnalyticsController } from './controllers/budget-analytics.controller';
import { BudgetAuditController } from './controllers/budget-audit.controller';
import { BudgetImportExportController } from './controllers/budget-import-export.controller';

// External modules
import { AircraftModule } from '../aircraft/aircraft.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BudgetProject.name, schema: BudgetProjectSchema },
      { name: BudgetPlanRow.name, schema: BudgetPlanRowSchema },
      { name: BudgetActual.name, schema: BudgetActualSchema },
      { name: BudgetAuditLog.name, schema: BudgetAuditLogSchema },
    ]),
    AircraftModule,
  ],
  controllers: [
    BudgetProjectsController,
    BudgetTemplatesController,
    BudgetAnalyticsController,
    BudgetAuditController,
    BudgetImportExportController,
  ],
  providers: [
    // Repositories
    BudgetProjectRepository,
    BudgetPlanRowRepository,
    BudgetActualRepository,
    BudgetAuditLogRepository,
    // Services
    BudgetProjectsService,
    BudgetTemplatesService,
    BudgetAnalyticsService,
    BudgetImportService,
    BudgetExportService,
  ],
  exports: [
    BudgetProjectsService,
    BudgetTemplatesService,
    BudgetAnalyticsService,
    BudgetImportService,
    BudgetExportService,
    BudgetProjectRepository,
    BudgetPlanRowRepository,
    BudgetActualRepository,
    BudgetAuditLogRepository,
  ],
})
export class BudgetProjectsModule {}
