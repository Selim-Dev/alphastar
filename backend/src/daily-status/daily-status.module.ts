import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyStatus, DailyStatusSchema } from './schemas/daily-status.schema';
import { DailyStatusRepository } from './repositories/daily-status.repository';
import { DailyStatusService } from './services/daily-status.service';
import { DailyStatusController } from './daily-status.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyStatus.name, schema: DailyStatusSchema },
    ]),
  ],
  controllers: [DailyStatusController],
  providers: [DailyStatusService, DailyStatusRepository],
  exports: [DailyStatusService, DailyStatusRepository],
})
export class DailyStatusModule {}
