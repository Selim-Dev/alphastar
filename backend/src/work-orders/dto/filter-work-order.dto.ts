import { IsOptional, IsEnum, IsDateString, IsMongoId, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { WorkOrderStatus } from '../schemas/work-order.schema';

export class FilterWorkOrderDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: WorkOrderStatus })
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @ApiPropertyOptional({ description: 'Filter by start date (dateIn)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (dateIn)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter only overdue work orders' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  overdue?: boolean;
}

export class WorkOrderAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
