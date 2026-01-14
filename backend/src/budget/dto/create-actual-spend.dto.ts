import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Matches,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateActualSpendDto {
  @ApiProperty({ description: 'Period in YYYY-MM format', example: '2024-01' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Period must be in YYYY-MM format',
  })
  period: string;

  @ApiPropertyOptional({ description: 'Aircraft group', example: 'A330' })
  @IsString()
  @IsOptional()
  aircraftGroup?: string;

  @ApiPropertyOptional({ description: 'Specific aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiProperty({ description: 'Budget clause ID', example: 1 })
  @IsNumber()
  @Min(1)
  clauseId: number;

  @ApiProperty({ description: 'Actual spend amount', example: 25000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Airbus' })
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Emergency repair parts' })
  @IsString()
  @IsOptional()
  notes?: string;
}
