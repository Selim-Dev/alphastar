import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AOGEvent, AOGEventSchema } from './schemas/aog-event.schema';
import {
  AOGSubEvent,
  AOGSubEventSchema,
} from './schemas/aog-sub-event.schema';
import {
  AOGCostEntry,
  AOGCostEntrySchema,
} from './schemas/aog-cost-entry.schema';
import {
  Aircraft,
  AircraftSchema,
} from '../aircraft/schemas/aircraft.schema';
import { AOGEventRepository } from './repositories/aog-event.repository';
import { AOGSubEventRepository } from './repositories/aog-sub-event.repository';
import { AOGCostEntryRepository } from './repositories/aog-cost-entry.repository';
import { AOGEventsService } from './services/aog-events.service';
import { AOGSubEventsService } from './services/aog-sub-events.service';
import { AOGCostEntriesService } from './services/aog-cost-entries.service';
import { AOGEventsController } from './aog-events.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AOGEvent.name, schema: AOGEventSchema },
      { name: AOGSubEvent.name, schema: AOGSubEventSchema },
      { name: AOGCostEntry.name, schema: AOGCostEntrySchema },
      { name: Aircraft.name, schema: AircraftSchema },
    ]),
  ],
  controllers: [AOGEventsController],
  providers: [
    AOGEventsService,
    AOGSubEventsService,
    AOGCostEntriesService,
    AOGEventRepository,
    AOGSubEventRepository,
    AOGCostEntryRepository,
  ],
  exports: [AOGEventsService, AOGEventRepository],
})
export class AOGEventsModule {}
