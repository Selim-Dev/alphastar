import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponsibleParty, DiscrepancyType } from '../schemas/discrepancy.schema';

export class CreateDiscrepancyDto {
  @ApiProperty({ description: 'Aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  aircraftId: string;

  @ApiProperty({ description: 'Date discrepancy was detected', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  dateDetected: string;

  @ApiProperty({ description: 'ATA chapter code', example: '21' })
  @IsString()
  @IsNotEmpty()
  ataChapter: string;

  @ApiProperty({ description: 'Description of the discrepancy', example: 'Air conditioning system malfunction' })
  @IsString()
  @IsNotEmpty()
  discrepancyText: string;

  @ApiPropertyOptional({ description: 'Date discrepancy was corrected', example: '2024-01-20' })
  @IsDateString()
  @IsOptional()
  dateCorrected?: string;

  @ApiPropertyOptional({ description: 'Corrective action taken', example: 'Replaced faulty valve' })
  @IsString()
  @IsOptional()
  correctiveAction?: string;

  @ApiPropertyOptional({
    description: 'Responsible party for the discrepancy',
    enum: ResponsibleParty,
    example: 'Internal',
  })
  @IsEnum(ResponsibleParty)
  @IsOptional()
  responsibility?: ResponsibleParty;

  @ApiPropertyOptional({
    description: 'Type of discrepancy',
    enum: DiscrepancyType,
    example: 'AOG',
  })
  @IsEnum(DiscrepancyType)
  @IsOptional()
  type?: DiscrepancyType;

  @ApiPropertyOptional({ description: 'Downtime hours caused by discrepancy', example: 8.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  downtimeHours?: number;
}
