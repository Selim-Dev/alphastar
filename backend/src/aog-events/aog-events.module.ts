import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AOGEvent, AOGEventSchema } from './schemas/aog-event.schema';
import { AOGEventRepository } from './repositories/aog-event.repository';
import { AOGEventsService } from './services/aog-events.service';
import { AOGEventsController } from './aog-events.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AOGEvent.name, schema: AOGEventSchema },
    ]),
  ],
  controllers: [AOGEventsController],
  providers: [AOGEventsService, AOGEventRepository],
  exports: [AOGEventsService, AOGEventRepository],
})
export class AOGEventsModule {}
