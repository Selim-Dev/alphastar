import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  Min,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponsibleParty, AOGCategory } from '../schemas/aog-event.schema';

export class CreateAOGEventDto {
  @ApiProperty({ description: 'Aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  aircraftId: string;

  @ApiProperty({ description: 'Date/time when AOG was detected', example: '2024-01-15T08:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  detectedAt: string;

  @ApiPropertyOptional({ description: 'Date/time when AOG was cleared', example: '2024-01-15T16:00:00Z' })
  @IsDateString()
  @IsOptional()
  clearedAt?: string;

  @ApiProperty({ description: 'AOG category', enum: AOGCategory, example: 'aog' })
  @IsEnum(AOGCategory)
  @IsNotEmpty()
  category: AOGCategory;

  @ApiProperty({ description: 'Reason code for the AOG event', example: 'ENG-001' })
  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  @ApiPropertyOptional({ description: 'Location (ICAO airport code)', example: 'OERK' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Party responsible for the AOG', enum: ResponsibleParty, example: 'Internal' })
  @IsEnum(ResponsibleParty)
  @IsNotEmpty()
  responsibleParty: ResponsibleParty;

  @ApiProperty({ description: 'Action taken to resolve the AOG', example: 'Replaced faulty component' })
  @IsString()
  @IsOptional() // Made optional - defaults to "See defect description"
  actionTaken?: string;

  @ApiProperty({ description: 'Number of personnel involved', example: 3 })
  @IsNumber()
  @Min(0)
  @IsOptional() // Made optional - defaults to 0
  manpowerCount?: number;

  @ApiProperty({ description: 'Total man-hours spent', example: 12.5 })
  @IsNumber()
  @Min(0)
  @IsOptional() // Made optional - defaults to 0
  manHours?: number;

  @ApiPropertyOptional({ description: 'Labor cost', example: 1500.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costLabor?: number;

  @ApiPropertyOptional({ description: 'Parts cost', example: 5000.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costParts?: number;

  @ApiPropertyOptional({ description: 'External/vendor cost', example: 2000.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costExternal?: number;

  @ApiPropertyOptional({ description: 'S3 keys for attached files', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  // NEW: Milestone timestamp fields for simplified workflow
  @ApiPropertyOptional({ description: 'Timestamp when AOG was reported (defaults to detectedAt)', example: '2024-01-15T08:00:00Z' })
  @IsDateString()
  @IsOptional()
  reportedAt?: string;

  @ApiPropertyOptional({ description: 'Timestamp when procurement was requested', example: '2024-01-15T09:00:00Z' })
  @IsDateString()
  @IsOptional()
  procurementRequestedAt?: string;

  @ApiPropertyOptional({ description: 'Timestamp when parts became available at store', example: '2024-01-16T10:00:00Z' })
  @IsDateString()
  @IsOptional()
  availableAtStoreAt?: string;

  @ApiPropertyOptional({ description: 'Timestamp when parts were issued back to maintenance', example: '2024-01-16T11:00:00Z' })
  @IsDateString()
  @IsOptional()
  issuedBackAt?: string;

  @ApiPropertyOptional({ description: 'Timestamp when installation was completed', example: '2024-01-16T14:00:00Z' })
  @IsDateString()
  @IsOptional()
  installationCompleteAt?: string;

  @ApiPropertyOptional({ description: 'Timestamp when ops testing started', example: '2024-01-16T15:00:00Z' })
  @IsDateString()
  @IsOptional()
  testStartAt?: string;

  @ApiPropertyOptional({ description: 'Timestamp when aircraft was up and running (defaults to clearedAt)', example: '2024-01-16T16:00:00Z' })
  @IsDateString()
  @IsOptional()
  upAndRunningAt?: string;

  // NEW: Simplified cost fields
  @ApiPropertyOptional({ description: 'Internal cost (labor and man-hours)', example: 2000.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  internalCost?: number;

  @ApiPropertyOptional({ description: 'External cost (vendor and third-party services)', example: 5000.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  externalCost?: number;
}
