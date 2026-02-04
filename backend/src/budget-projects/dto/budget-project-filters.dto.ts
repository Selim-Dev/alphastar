import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class BudgetProjectFiltersDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsEnum(['draft', 'active', 'closed'])
  status?: string;

  @IsOptional()
  @IsString()
  templateType?: string;
}
