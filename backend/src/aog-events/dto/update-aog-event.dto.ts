import { IsString, IsOptional, IsDateString, ValidateIf } from 'class-validator';

export class UpdateAOGEventDto {
  @ValidateIf((o: UpdateAOGEventDto) => o.clearedAt !== null)
  @IsOptional()
  @IsDateString()
  clearedAt?: string | null;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
