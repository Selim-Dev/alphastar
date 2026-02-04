import { IsString, IsNumber, Min, IsOptional, IsMongoId } from 'class-validator';

export class UpdateActualDto {
  @IsString()
  termId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsMongoId()
  aircraftId?: string;

  @IsOptional()
  @IsString()
  aircraftType?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
