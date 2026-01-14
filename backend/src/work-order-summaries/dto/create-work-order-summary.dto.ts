import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a work order summary
 * Requirements: 11.1, 11.2
 */
export class CreateWorkOrderSummaryDto {
  @ApiProperty({ description: 'Aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  aircraftId: string;

  @ApiProperty({ 
    description: 'Period in YYYY-MM format', 
    example: '2024-01',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Period must be in YYYY-MM format',
  })
  period: string;

  @ApiProperty({ 
    description: 'Number of work orders for the period', 
    example: 5,
    minimum: 0
  })
  @IsNumber()
  @Min(0, { message: 'Work order count must be >= 0' })
  workOrderCount: number;

  @ApiPropertyOptional({ 
    description: 'Total cost for the period', 
    example: 15000.50,
    minimum: 0
  })
  @IsNumber()
  @Min(0, { message: 'Total cost must be >= 0' })
  @IsOptional()
  totalCost?: number;

  @ApiPropertyOptional({ 
    description: 'Currency code', 
    example: 'USD',
    default: 'USD'
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes', 
    example: 'Includes scheduled maintenance'
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'Reference to external system', 
    example: 'EXT-WO-2024-001'
  })
  @IsString()
  @IsOptional()
  sourceRef?: string;
}
