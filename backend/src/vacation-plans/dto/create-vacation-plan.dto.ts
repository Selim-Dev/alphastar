import { IsNumber, IsEnum, IsArray, ValidateNested, IsString, IsOptional, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VacationTeam } from '../schemas/vacation-plan.schema';

/**
 * DTO for creating/updating a vacation employee
 * Requirements: 15.1
 */
export class VacationEmployeeDto {
  @ApiProperty({ description: 'Employee name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Array of 48 weekly vacation values',
    type: [Number],
    example: new Array(48).fill(0),
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(48)
  @ArrayMaxSize(48)
  @IsNumber({}, { each: true })
  cells?: number[];
}

/**
 * DTO for creating a vacation plan
 * Requirements: 15.1
 */
export class CreateVacationPlanDto {
  @ApiProperty({ description: 'Year of the vacation plan', example: 2025 })
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({
    description: 'Team for the vacation plan',
    enum: VacationTeam,
    example: VacationTeam.Engineering,
  })
  @IsEnum(VacationTeam)
  team: VacationTeam;

  @ApiPropertyOptional({
    description: 'Array of employees with their vacation schedules',
    type: [VacationEmployeeDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VacationEmployeeDto)
  employees?: VacationEmployeeDto[];
}
