import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDailyStatusDto } from './create-daily-status.dto';

export class UpdateDailyStatusDto extends PartialType(
  OmitType(CreateDailyStatusDto, ['aircraftId', 'date'] as const),
) {}
