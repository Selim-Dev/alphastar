import { IsOptional, IsDateString, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class FilterDailyStatusDto {
  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'Filter by aircraft ID',
  })
  @IsOptional()
  @IsMongoId({ message: 'Aircraft ID must be a valid MongoDB ObjectId' })
  aircraftId?: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Start date for filtering (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date string' })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'End date for filtering (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date string' })
  endDate?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum number of records to return (for performance optimization)',
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(10000, { message: 'Limit cannot exceed 10000' })
  limit?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Number of records to skip (for pagination)',
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Skip must be an integer' })
  @Min(0, { message: 'Skip must be at least 0' })
  skip?: number;
}
