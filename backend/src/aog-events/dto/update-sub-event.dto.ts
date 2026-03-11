import { PartialType } from '@nestjs/swagger';
import { CreateSubEventDto } from './create-sub-event.dto';

export class UpdateSubEventDto extends PartialType(CreateSubEventDto) {}
