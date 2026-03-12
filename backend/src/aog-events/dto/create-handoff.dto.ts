import {
  IsEnum,
  IsNotEmpty,
  IsDateString,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateHandoffDto {
  @IsEnum(['QC', 'Engineering', 'Project Management', 'Procurement', 'Technical', 'MCC', 'Others'])
  @IsNotEmpty()
  department: string;

  @IsDateString()
  @IsNotEmpty()
  sentAt: string;

  @IsDateString()
  @IsOptional()
  returnedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
