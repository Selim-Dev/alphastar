import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AnalyticsFiltersDto {
  @IsOptional()
  @IsDateString()
  startDate?: string; // YYYY-MM format

  @IsOptional()
  @IsDateString()
  endDate?: string; // YYYY-MM format

  @IsOptional()
  @IsString()
  aircraftType?: string;

  @IsOptional()
  @IsString()
  termSearch?: string; // Search term names
}
