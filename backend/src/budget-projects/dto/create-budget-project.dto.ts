import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, ValidateNested, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class DateRangeDto {
  @IsDateString()
  @IsNotEmpty()
  start: string;

  @IsDateString()
  @IsNotEmpty()
  end: string;
}

class AircraftScopeDto {
  @IsEnum(['individual', 'type', 'group'])
  @IsNotEmpty()
  type: 'individual' | 'type' | 'group';

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  aircraftIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aircraftTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fleetGroups?: string[];
}

export class CreateBudgetProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  templateType: string;

  @ValidateNested()
  @Type(() => DateRangeDto)
  @IsNotEmpty()
  dateRange: DateRangeDto;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @ValidateNested()
  @Type(() => AircraftScopeDto)
  @IsNotEmpty()
  aircraftScope: AircraftScopeDto;

  @IsOptional()
  @IsEnum(['draft', 'active', 'closed'])
  status?: string;
}
