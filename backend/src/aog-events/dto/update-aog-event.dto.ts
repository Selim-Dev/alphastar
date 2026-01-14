import { PartialType } from '@nestjs/swagger';
import { CreateAOGEventDto } from './create-aog-event.dto';

export class UpdateAOGEventDto extends PartialType(CreateAOGEventDto) {}
