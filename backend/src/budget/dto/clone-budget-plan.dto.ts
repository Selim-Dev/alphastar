import {
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloneBudgetPlanDto {
  @ApiProperty({ description: 'Source fiscal year to clone from', example: 2024 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  sourceYear: number;

  @ApiProperty({ description: 'Target fiscal year to clone to', example: 2025 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  targetYear: number;

  @ApiPropertyOptional({
    description: 'Optional adjustment percentage (e.g., 5 for 5% increase, -10 for 10% decrease)',
    example: 5,
    default: 0,
  })
  @IsNumber()
  @Min(-100)
  @Max(1000)
  @IsOptional()
  adjustmentPercentage?: number;
}

export class CloneBudgetPlanResponseDto {
  @ApiProperty({ description: 'Number of budget plans cloned' })
  clonedCount: number;

  @ApiProperty({ description: 'Number of plans skipped (already exist)' })
  skippedCount: number;

  @ApiProperty({ description: 'Source fiscal year' })
  sourceYear: number;

  @ApiProperty({ description: 'Target fiscal year' })
  targetYear: number;

  @ApiProperty({ description: 'Adjustment percentage applied' })
  adjustmentPercentage: number;
}
