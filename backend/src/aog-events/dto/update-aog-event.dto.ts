import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateAOGEventDto {
  @IsDateString()
  @IsOptional()
  clearedAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
