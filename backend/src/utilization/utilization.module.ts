import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyCounter, DailyCounterSchema } from './schemas/daily-counter.schema';
import { DailyCounterRepository } from './repositories/daily-counter.repository';
import { UtilizationService } from './services/utilization.service';
import { UtilizationController } from './utilization.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyCounter.name, schema: DailyCounterSchema },
    ]),
  ],
  controllers: [UtilizationController],
  providers: [UtilizationService, DailyCounterRepository],
  exports: [UtilizationService, DailyCounterRepository],
})
export class UtilizationModule {}
