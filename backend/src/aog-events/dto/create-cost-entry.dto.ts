import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { CostDepartment } from '../schemas/aog-cost-entry.schema';
import { COST_DEPARTMENTS } from '../schemas/aog-cost-entry.schema';

export class CreateCostEntryDto {
  @IsEnum(COST_DEPARTMENTS)
  department: CostDepartment;

  @IsNumber()
  @Min(0)
  internalCost: number;

  @IsNumber()
  @Min(0)
  externalCost: number;

  @IsString()
  @IsOptional()
  note?: string;
}
