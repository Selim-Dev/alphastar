import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Matches,
  IsMongoId,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterBudgetPlanDto {
  @ApiPropertyOptional({ description: 'Filter by fiscal year', example: 2024 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: 'Filter by clause ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clauseId?: number;

  @ApiPropertyOptional({ description: 'Filter by aircraft group', example: 'A330' })
  @IsString()
  @IsOptional()
  aircraftGroup?: string;
}

export class FilterActualSpendDto {
  @ApiPropertyOptional({ description: 'Filter by period (YYYY-MM)', example: '2024-01' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Period must be in YYYY-MM format',
  })
  period?: string;

  @ApiPropertyOptional({ description: 'Filter by start period (YYYY-MM)', example: '2024-01' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Start period must be in YYYY-MM format',
  })
  startPeriod?: string;

  @ApiPropertyOptional({ description: 'Filter by end period (YYYY-MM)', example: '2024-12' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'End period must be in YYYY-MM format',
  })
  endPeriod?: string;

  @ApiPropertyOptional({ description: 'Filter by clause ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clauseId?: number;

  @ApiPropertyOptional({ description: 'Filter by aircraft group', example: 'A330' })
  @IsString()
  @IsOptional()
  aircraftGroup?: string;

  @ApiPropertyOptional({ description: 'Filter by aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;
}

export class BudgetAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Fiscal year for analysis', example: 2024 })
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: 'Filter by clause ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  clauseId?: number;

  @ApiPropertyOptional({ description: 'Filter by aircraft group', example: 'A330' })
  @IsString()
  @IsOptional()
  aircraftGroup?: string;
}

export class BurnRateQueryDto {
  @ApiPropertyOptional({ description: 'Fiscal year for burn rate calculation', example: 2024 })
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: 'Filter by aircraft group', example: 'A330' })
  @IsString()
  @IsOptional()
  aircraftGroup?: string;
}

export class CostEfficiencyQueryDto {
  @ApiPropertyOptional({ description: 'Start period (YYYY-MM)', example: '2024-01' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Start period must be in YYYY-MM format',
  })
  startPeriod?: string;

  @ApiPropertyOptional({ description: 'End period (YYYY-MM)', example: '2024-12' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'End period must be in YYYY-MM format',
  })
  endPeriod?: string;

  @ApiPropertyOptional({ description: 'Filter by aircraft group', example: 'A330' })
  @IsString()
  @IsOptional()
  aircraftGroup?: string;

  @ApiPropertyOptional({ description: 'Filter by aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;
}
