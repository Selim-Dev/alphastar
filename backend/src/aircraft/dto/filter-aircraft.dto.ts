import { IsString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AircraftStatus } from '../schemas/aircraft.schema';

export class FilterAircraftDto {
  @ApiPropertyOptional({
    example: 'A330',
    description: 'Filter by fleet group',
  })
  @IsOptional()
  @IsString()
  fleetGroup?: string;

  @ApiPropertyOptional({
    example: 'A340-642',
    description: 'Filter by aircraft type',
  })
  @IsOptional()
  @IsString()
  aircraftType?: string;

  @ApiPropertyOptional({
    enum: AircraftStatus,
    example: AircraftStatus.Active,
    description: 'Filter by operational status',
  })
  @IsOptional()
  @IsEnum(AircraftStatus, { message: 'Status must be active, parked, or leased' })
  status?: AircraftStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (1-based)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
