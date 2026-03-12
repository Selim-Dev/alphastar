import { IsString, IsOptional, IsDateString, Allow } from 'class-validator';

export class UpdateAOGEventDto {
  @IsOptional()
  @IsDateString()
  @Allow(null)
  clearedAt?: string | null;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
