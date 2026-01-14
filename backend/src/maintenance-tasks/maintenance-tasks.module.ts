import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaintenanceTask, MaintenanceTaskSchema } from './schemas/maintenance-task.schema';
import { MaintenanceTaskRepository } from './repositories/maintenance-task.repository';
import { MaintenanceTasksService } from './services/maintenance-tasks.service';
import { MaintenanceTasksController } from './maintenance-tasks.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MaintenanceTask.name, schema: MaintenanceTaskSchema },
    ]),
  ],
  controllers: [MaintenanceTasksController],
  providers: [MaintenanceTasksService, MaintenanceTaskRepository],
  exports: [MaintenanceTasksService, MaintenanceTaskRepository],
})
export class MaintenanceTasksModule {}
