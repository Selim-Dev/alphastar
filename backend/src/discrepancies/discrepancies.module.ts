import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Discrepancy, DiscrepancySchema } from './schemas/discrepancy.schema';
import { DiscrepancyRepository } from './repositories/discrepancy.repository';
import { DiscrepanciesService } from './services/discrepancies.service';
import { DiscrepanciesController } from './discrepancies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Discrepancy.name, schema: DiscrepancySchema },
    ]),
  ],
  controllers: [DiscrepanciesController],
  providers: [DiscrepanciesService, DiscrepancyRepository],
  exports: [DiscrepanciesService, DiscrepancyRepository],
})
export class DiscrepanciesModule {}
