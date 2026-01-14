import { IsOptional, IsEnum, IsDateString, IsMongoId, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ResponsibleParty } from '../schemas/discrepancy.schema';

export class FilterDiscrepancyDto {
  @ApiPropertyOptional({ description: 'Filter by aircraft ID' })
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @ApiPropertyOptional({ description: 'Filter by ATA chapter' })
  @IsString()
  @IsOptional()
  ataChapter?: string;

  @ApiPropertyOptional({ description: 'Filter by responsible party', enum: ResponsibleParty })
  @IsEnum(ResponsibleParty)
  @IsOptional()
  responsibility?: ResponsibleParty;

  @ApiPropertyOptional({ description: 'Filter by start date (dateDetected)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (dateDetected)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by corrected status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  corrected?: boolean;
}

export class DiscrepancyAnalyticsQueryDto {
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
