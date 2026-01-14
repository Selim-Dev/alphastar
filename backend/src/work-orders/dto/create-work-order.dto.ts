import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '../schemas/work-order.schema';

export class CreateWorkOrderDto {
  @ApiProperty({ description: 'Unique work order number', example: 'WO-2024-001' })
  @IsString()
  @IsNotEmpty()
  woNumber: string;

  @ApiProperty({ description: 'Aircraft ID', example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  @IsNotEmpty()
  aircraftId: string;

  @ApiProperty({ description: 'Work order description', example: 'Engine inspection and maintenance' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ 
    description: 'Work order status', 
    enum: WorkOrderStatus, 
    default: WorkOrderStatus.Open,
    example: 'Open' 
  })
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus;

  @ApiProperty({ description: 'Date work order was opened', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  dateIn: string;

  @ApiPropertyOptional({ description: 'Date work order was closed', example: '2024-01-20' })
  @IsDateString()
  @IsOptional()
  dateOut?: string;

  @ApiPropertyOptional({ description: 'Due date for work order completion', example: '2024-01-25' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Certificate of Release to Service number', example: 'CRS-2024-001' })
  @IsString()
  @IsOptional()
  crsNumber?: string;

  @ApiPropertyOptional({ description: 'Material Request number', example: 'MR-2024-001' })
  @IsString()
  @IsOptional()
  mrNumber?: string;
}
