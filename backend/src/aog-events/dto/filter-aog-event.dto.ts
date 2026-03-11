import { IsOptional, IsEnum, IsDateString, IsMongoId, IsString } from 'class-validator';

export class FilterAOGEventDto {
  @IsMongoId()
  @IsOptional()
  aircraftId?: string;

  @IsString()
  @IsOptional()
  fleetGroup?: string;

  @IsEnum(['active', 'completed'])
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(['aog', 'scheduled', 'unscheduled'])
  @IsOptional()
  category?: string;
}
