import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyStatusDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Aircraft ID (MongoDB ObjectId)',
  })
  @IsMongoId({ message: 'Aircraft ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Aircraft ID is required' })
  aircraftId: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Date of the status record (ISO 8601 format)',
  })
  @IsDateString({}, { message: 'Date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Date is required' })
  date: string;

  @ApiPropertyOptional({
    example: 24,
    description: 'Baseline hours (POS - Possessed hours). Defaults to 24.',
    minimum: 0,
    maximum: 24,
    default: 24,
  })
  @IsOptional()
  @IsNumber({}, { message: 'POS hours must be a number' })
  @Min(0, { message: 'POS hours cannot be negative' })
  @Max(24, { message: 'POS hours cannot exceed 24' })
  posHours?: number;

  @ApiPropertyOptional({
    example: 24,
    description: 'Fully Mission Capable hours (available for booking). Defaults to 24.',
    minimum: 0,
    maximum: 24,
    default: 24,
  })
  @IsOptional()
  @IsNumber({}, { message: 'FMC hours must be a number' })
  @Min(0, { message: 'FMC hours cannot be negative' })
  @Max(24, { message: 'FMC hours cannot exceed 24' })
  fmcHours?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Scheduled downtime hours (NMCM-S). Defaults to 0.',
    minimum: 0,
    maximum: 24,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'NMCM-S hours must be a number' })
  @Min(0, { message: 'NMCM-S hours cannot be negative' })
  @Max(24, { message: 'NMCM-S hours cannot exceed 24' })
  nmcmSHours?: number;


  @ApiPropertyOptional({
    example: 0,
    description: 'Unscheduled downtime hours (NMCM-U). Defaults to 0.',
    minimum: 0,
    maximum: 24,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'NMCM-U hours must be a number' })
  @Min(0, { message: 'NMCM-U hours cannot be negative' })
  @Max(24, { message: 'NMCM-U hours cannot exceed 24' })
  nmcmUHours?: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Supply downtime hours (NMCS)',
    minimum: 0,
    maximum: 24,
  })
  @IsOptional()
  @IsNumber({}, { message: 'NMCS hours must be a number' })
  @Min(0, { message: 'NMCS hours cannot be negative' })
  @Max(24, { message: 'NMCS hours cannot exceed 24' })
  nmcsHours?: number;

  @ApiPropertyOptional({
    example: 'Aircraft in scheduled maintenance',
    description: 'Additional notes about the status',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}
