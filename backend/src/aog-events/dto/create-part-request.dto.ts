import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
} from 'class-validator';
import { PartRequestStatus } from '../schemas/aog-event.schema';

export class CreatePartRequestDto {
  @ApiProperty({ description: 'Part number' })
  @IsString()
  partNumber: string;

  @ApiProperty({ description: 'Part description' })
  @IsString()
  partDescription: string;

  @ApiProperty({ description: 'Quantity required', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiProperty({ description: 'Requested date (ISO string)' })
  @IsDateString()
  requestedDate: string;
}

export class UpdatePartRequestDto {
  @ApiPropertyOptional({ description: 'Part number' })
  @IsString()
  @IsOptional()
  partNumber?: string;

  @ApiPropertyOptional({ description: 'Part description' })
  @IsString()
  @IsOptional()
  partDescription?: string;

  @ApiPropertyOptional({ description: 'Quantity required', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Actual cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualCost?: number;

  @ApiPropertyOptional({ description: 'Vendor name' })
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiPropertyOptional({ description: 'Part request status', enum: PartRequestStatus })
  @IsEnum(PartRequestStatus)
  @IsOptional()
  status?: PartRequestStatus;

  @ApiPropertyOptional({ description: 'Invoice reference' })
  @IsString()
  @IsOptional()
  invoiceRef?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Estimated time of arrival (ISO string)' })
  @IsDateString()
  @IsOptional()
  eta?: string;

  @ApiPropertyOptional({ description: 'Received date (ISO string)' })
  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @ApiPropertyOptional({ description: 'Issued date (ISO string)' })
  @IsDateString()
  @IsOptional()
  issuedDate?: string;
}
