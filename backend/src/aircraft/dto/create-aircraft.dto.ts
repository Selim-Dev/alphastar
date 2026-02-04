import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AircraftStatus } from '../schemas/aircraft.schema';

export class CreateAircraftDto {
  @ApiProperty({
    example: 'HZ-A42',
    description: 'Unique aircraft registration (tail number)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Registration is required' })
  @Matches(/^[A-Z0-9-]+$/i, {
    message: 'Registration must contain only letters, numbers, and hyphens',
  })
  registration: string;

  @ApiProperty({
    example: 'A330',
    description: 'Fleet group classification',
  })
  @IsString()
  @IsNotEmpty({ message: 'Fleet group is required' })
  fleetGroup: string;

  @ApiProperty({
    example: 'A340-642',
    description: 'Specific aircraft type/model',
  })
  @IsString()
  @IsNotEmpty({ message: 'Aircraft type is required' })
  aircraftType: string;

  @ApiProperty({
    example: 'MSN-12345',
    description: 'Manufacturer Serial Number',
  })
  @IsString()
  @IsNotEmpty({ message: 'MSN is required' })
  msn: string;

  @ApiProperty({
    example: 'Alpha Star Aviation',
    description: 'Aircraft owner name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Owner is required' })
  owner: string;


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

  @ApiProperty({
    example: 2,
    description: 'Number of engines (1-4)',
    minimum: 1,
    maximum: 4,
  })
  @IsInt({ message: 'Engines count must be an integer' })
  @Min(1, { message: 'Engines count must be at least 1' })
  @Max(4, { message: 'Engines count must be at most 4' })
  enginesCount: number;

  @ApiPropertyOptional({
    enum: AircraftStatus,
    example: AircraftStatus.Active,
    description: 'Aircraft operational status',
    default: AircraftStatus.Active,
  })
  @IsOptional()
  @IsEnum(AircraftStatus, { message: 'Status must be active, parked, or leased' })
  status?: AircraftStatus;
}
