import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TrendQueryDto extends DashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Aggregation period',
    enum: ['day', 'month', 'year'],
    default: 'day',
  })
  @IsOptional()
  period?: 'day' | 'month' | 'year';
}
