import { IsOptional, IsMongoId, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for filtering work order summaries
 * Requirements: 11.4
 */
export class FilterWorkOrderSummaryDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by fleet group (e.g., A330, G650ER)',
    example: 'A330'
  })
  @IsString()
  @IsOptional()
  fleetGroup?: string;

  @ApiPropertyOptional({ 
    description: 'Start period in YYYY-MM format',
    example: '2024-01'
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Start period must be in YYYY-MM format',
  })
  @IsOptional()
  startPeriod?: string;

  @ApiPropertyOptional({ 
    description: 'End period in YYYY-MM format',
    example: '2024-12'
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'End period must be in YYYY-MM format',
  })
  @IsOptional()
  endPeriod?: string;
}

/**
 * DTO for trend query parameters
 * Requirements: 14.2
 */
export class TrendQueryDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by fleet group',
    example: 'A330'
  })
  @IsString()
  @IsOptional()
  fleetGroup?: string;

  @ApiPropertyOptional({ 
    description: 'Start period in YYYY-MM format',
    example: '2024-01'
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Start period must be in YYYY-MM format',
  })
  @IsOptional()
  startPeriod?: string;

  @ApiPropertyOptional({ 
    description: 'End period in YYYY-MM format',
    example: '2024-12'
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'End period must be in YYYY-MM format',
  })
  @IsOptional()
  endPeriod?: string;
}
