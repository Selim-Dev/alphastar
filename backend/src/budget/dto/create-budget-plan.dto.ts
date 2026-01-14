import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetPlanDto {
  @ApiProperty({ description: 'Fiscal year', example: 2024 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  fiscalYear: number;

  @ApiProperty({ description: 'Budget clause ID', example: 1 })
  @IsNumber()
  @Min(1)
  clauseId: number;

  @ApiProperty({ description: 'Description of the budget clause', example: 'Spare Parts' })
  @IsString()
  @IsNotEmpty()
  clauseDescription: string;

  @ApiProperty({ description: 'Aircraft group', example: 'A330' })
  @IsString()
  @IsNotEmpty()
  aircraftGroup: string;

  @ApiProperty({ description: 'Planned budget amount', example: 500000 })
  @IsNumber()
  @Min(0)
  plannedAmount: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;
}
