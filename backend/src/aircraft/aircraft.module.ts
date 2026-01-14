import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Aircraft, AircraftSchema } from './schemas/aircraft.schema';
import { AircraftRepository } from './repositories/aircraft.repository';
import { AircraftService } from './services/aircraft.service';
import { AircraftController } from './aircraft.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Aircraft.name, schema: AircraftSchema }]),
  ],
  controllers: [AircraftController],
  providers: [AircraftService, AircraftRepository],
  exports: [AircraftService, AircraftRepository],
})
export class AircraftModule {}
