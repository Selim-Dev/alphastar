import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsMongoId,
} from 'class-validator';

export class CreateAOGEventDto {
  @IsMongoId()
  @IsNotEmpty()
  aircraftId: string;

  @IsDateString()
  @IsNotEmpty()
  detectedAt: string;

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
