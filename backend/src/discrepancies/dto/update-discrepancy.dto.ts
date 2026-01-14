import { PartialType } from '@nestjs/swagger';
import { CreateDiscrepancyDto } from './create-discrepancy.dto';

export class UpdateDiscrepancyDto extends PartialType(CreateDiscrepancyDto) {}
