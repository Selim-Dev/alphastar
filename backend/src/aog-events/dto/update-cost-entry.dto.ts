import { PartialType } from '@nestjs/mapped-types';
import { CreateCostEntryDto } from './create-cost-entry.dto';

export class UpdateCostEntryDto extends PartialType(CreateCostEntryDto) {}
