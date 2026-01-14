import { IsOptional, IsEnum, IsDateString, IsMongoId, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ResponsibleParty, AOGCategory, AOGWorkflowStatus, BlockingReason } from '../schemas/aog-event.schema';

export class FilterAOGEventDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ description: 'Filter by responsible party', enum: ResponsibleParty })
  @IsEnum(ResponsibleParty)
  @IsOptional()
  responsibleParty?: ResponsibleParty;

  @ApiPropertyOptional({ description: 'Filter by category', enum: AOGCategory })
  @IsEnum(AOGCategory)
  @IsOptional()
  category?: AOGCategory;

  @ApiPropertyOptional({ description: 'Filter by workflow status', enum: AOGWorkflowStatus })
  @IsEnum(AOGWorkflowStatus)
  @IsOptional()
  currentStatus?: AOGWorkflowStatus;

  @ApiPropertyOptional({ description: 'Filter by blocking reason', enum: BlockingReason })
  @IsEnum(BlockingReason)
  @IsOptional()
  blockingReason?: BlockingReason;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class AnalyticsQueryDto {
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

/**
 * DTO for three-bucket analytics filter
 * Requirements: 5.1, 5.2, 5.3
 */
export class ThreeBucketAnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ description: 'Filter by fleet group (e.g., A340, A330, G650ER)' })
  @IsString()
  @IsOptional()
  fleetGroup?: string;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
