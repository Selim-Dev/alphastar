import { IsOptional, IsDateString, IsMongoId, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AggregationQueryDto {
  @ApiProperty({
    example: 'month',
    description: 'Aggregation period',
    enum: ['day', 'month', 'year'],
  })
  @IsIn(['day', 'month', 'year'], { message: 'Period must be day, month, or year' })
  period: 'day' | 'month' | 'year';

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
