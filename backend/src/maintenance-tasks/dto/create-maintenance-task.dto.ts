import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Shift } from '../schemas/maintenance-task.schema';

export class CreateMaintenanceTaskDto {
  @ApiProperty({ description: 'Aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  aircraftId: string;

  @ApiProperty({ description: 'Date of the maintenance task', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ description: 'Shift when task was performed', enum: Shift, example: 'Morning' })
  @IsEnum(Shift)
  @IsNotEmpty()
  shift: Shift;

  @ApiProperty({ description: 'Type of maintenance task', example: 'Inspection' })
  @IsString()
  @IsNotEmpty()
  taskType: string;

  @ApiProperty({ description: 'Description of the task performed', example: 'Pre-flight inspection completed' })
  @IsString()
  @IsNotEmpty()
  taskDescription: string;

  @ApiProperty({ description: 'Number of personnel involved', example: 2 })
  @IsNumber()
  @Min(0)
  manpowerCount: number;

  @ApiProperty({ description: 'Total man-hours spent', example: 4.5 })
  @IsNumber()
  @Min(0)
  manHours: number;

  @ApiPropertyOptional({ description: 'Cost of the maintenance task', example: 500.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ description: 'Reference to associated work order', example: '507f1f77bcf86cd799439012' })
  @IsMongoId()
  @IsOptional()
  workOrderRef?: string;
}
