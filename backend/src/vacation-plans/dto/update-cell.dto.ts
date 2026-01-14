import { IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating a single cell in a vacation plan
 * Requirements: 15.2, 16.5, 18.3
 */
export class UpdateCellDto {
  @ApiProperty({ description: 'Employee name', example: 'John Doe' })
  @IsString()
  employeeName: string;

  @ApiProperty({
    description: 'Week index (0-47)',
    example: 0,
    minimum: 0,
    maximum: 47,
  })
  @IsNumber()
  @Min(0)
  @Max(47)
  weekIndex: number;

  @ApiProperty({
    description: 'Numeric value for the cell (vacation days/portions)',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  value: number;
}
