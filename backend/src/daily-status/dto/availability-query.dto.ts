import { IsOptional, IsDateString, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AggregationPeriod {
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

export class AvailabilityQueryDto {
  @ApiProperty({
    enum: AggregationPeriod,
    example: 'month',
    description: 'Aggregation period (day, month, or year)',
  })
  @IsEnum(AggregationPeriod, {
    message: 'Period must be one of: day, month, year',
  })
  period: AggregationPeriod;

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
}
