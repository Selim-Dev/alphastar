import { IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VacationTeam } from '../schemas/vacation-plan.schema';

/**
 * DTO for filtering vacation plans
 * Requirements: 18.1
 */
export class FilterVacationPlanDto {
  @ApiPropertyOptional({ description: 'Filter by year', example: 2025 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter by team',
    enum: VacationTeam,
    example: VacationTeam.Engineering,
  })
  @IsOptional()
  @IsEnum(VacationTeam)
  team?: VacationTeam;
}
