import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDailyCounterDto } from './create-daily-counter.dto';

export class UpdateDailyCounterDto extends PartialType(
  OmitType(CreateDailyCounterDto, ['aircraftId', 'date'] as const),
) {}
