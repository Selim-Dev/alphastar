import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateHandoffDto } from './create-handoff.dto';

export class CreateSubEventDto {
  @IsEnum(['aog', 'scheduled', 'unscheduled'])
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  reasonCode: string;

  @IsString()
  @IsNotEmpty()
  actionTaken: string;

  @IsDateString()
  @IsNotEmpty()
  detectedAt: string;

  @IsDateString()
  @IsOptional()
  clearedAt?: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  manpowerCount: number;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  manHours: number;

  @ValidateNested({ each: true })
  @Type(() => CreateHandoffDto)
  @IsArray()
  @IsOptional()
  departmentHandoffs?: CreateHandoffDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
