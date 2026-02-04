import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AircraftStatus } from '../schemas/aircraft.schema';

export class UpdateAircraftDto {
  @ApiPropertyOptional({
    example: 'A330',
    description: 'Fleet group classification',
  })
  @IsOptional()
  @IsString()
  fleetGroup?: string;

  @ApiPropertyOptional({
    example: 'A340-642',
    description: 'Specific aircraft type/model',
  })
  @IsOptional()
  @IsString()
  aircraftType?: string;

  @ApiPropertyOptional({
    example: 'MSN-12345',
    description: 'Manufacturer Serial Number',
  })
  @IsOptional()
  @IsString()
  msn?: string;

  @ApiPropertyOptional({
    example: 'Alpha Star Aviation',
    description: 'Aircraft owner name',
  })
  @IsOptional()
  @IsString()
  owner?: string;

  @ApiPropertyOptional({
    example: '2015-06-15',
    description: 'Aircraft manufacture date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Manufacture date must be a valid ISO 8601 date string' })
  manufactureDate?: string;

  @ApiPropertyOptional({
    example: '2015-08-20',
    description: 'Aircraft certification date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Certification date must be a valid ISO 8601 date string' })
  certificationDate?: string;

  @ApiPropertyOptional({
    example: '2015-09-01',
    description: 'Aircraft in-service date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'In-service date must be a valid ISO 8601 date string' })
  inServiceDate?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Number of engines (1-4)',
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsInt({ message: 'Engines count must be an integer' })
  @Min(1, { message: 'Engines count must be at least 1' })
  @Max(4, { message: 'Engines count must be at most 4' })
  enginesCount?: number;

  @ApiPropertyOptional({
    enum: AircraftStatus,
    example: AircraftStatus.Active,
    description: 'Aircraft operational status',
  })
  @IsOptional()
  @IsEnum(AircraftStatus, { message: 'Status must be active, parked, or leased' })
  status?: AircraftStatus;
}
