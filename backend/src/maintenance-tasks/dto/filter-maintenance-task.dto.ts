import { IsOptional, IsEnum, IsDateString, IsMongoId, IsString, IsNumber, IsArray, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Shift } from '../schemas/maintenance-task.schema';

export class FilterMaintenanceTaskDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ description: 'Filter by shift', enum: Shift })
  @IsEnum(Shift)
  @IsOptional()
  shift?: Shift;

  @ApiPropertyOptional({ description: 'Filter by task type' })
  @IsString()
  @IsOptional()
  taskType?: string;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class SummaryQueryDto {
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

  @ApiPropertyOptional({
    description: 'Group by dimensions (comma-separated: date,shift,aircraftId,taskType)',
    example: 'date,aircraftId',
  })
  @IsString()
  @IsOptional()
  groupBy?: string;
}

export class CostRankingQueryDto {
  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limit number of results', example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number;
}
