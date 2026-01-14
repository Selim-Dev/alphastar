import { IsDateString, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

// Import ExportType from export.service.ts to avoid duplication
import type { ExportType } from '../services/export.service';
export type { ExportType };

export class ExportQueryDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Aircraft ID for filtering' })
  @IsOptional()
  @IsString()
  aircraftId?: string;

  @ApiPropertyOptional({ description: 'Fiscal year for budget exports' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  fiscalYear?: number;

  @ApiPropertyOptional({ description: 'Fleet group for filtering (e.g., A330, G650ER)' })
  @IsOptional()
  @IsString()
  fleetGroup?: string;
}

export const EXPORT_TYPES: ExportType[] = [
  'aircraft',
  'utilization',
  'daily-status',
  'aog-events',
  'maintenance-tasks',
  'work-orders',
  'work-order-summaries',
  'discrepancies',
  'budget-plans',
  'actual-spend',
  'dashboard',
  'aircraft-detail',
  'vacation-plan',
];
