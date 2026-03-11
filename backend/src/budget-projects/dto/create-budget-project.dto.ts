import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class DateRangeDto {
  @IsDateString()
  @IsNotEmpty()
  start: string;

  @IsDateString()
  @IsNotEmpty()
  end: string;
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

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  columnNames: string[];

  @IsOptional()
  @IsEnum(['draft', 'active', 'closed'])
  status?: string;
}
