import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsMongoId,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AOGWorkflowStatus, BlockingReason } from '../schemas/aog-event.schema';

/**
 * Metadata for status transitions
 * Contains optional references to related entities
 */
export class TransitionMetadataDto {
  @ApiPropertyOptional({
    description: 'Part request ID related to this transition',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsOptional()
  partRequestId?: string;

  @ApiPropertyOptional({
    description: 'Finance reference number',
    example: 'FIN-2025-001',
  })
  @IsString()
  @IsOptional()
  financeRef?: string;

  @ApiPropertyOptional({
    description: 'Shipping reference/tracking number',
    example: 'SHIP-2025-001',
  })
  @IsString()
  @IsOptional()
  shippingRef?: string;

  @ApiPropertyOptional({
    description: 'Operations run reference',
    example: 'OPS-RUN-2025-001',
  })
  @IsString()
  @IsOptional()
  opsRunRef?: string;
}

/**
 * DTO for creating a status transition on an AOG event
 * Requirements: 7.1
 */
export class CreateTransitionDto {
  @ApiProperty({
    description: 'Target workflow status',
    enum: AOGWorkflowStatus,
    example: AOGWorkflowStatus.TROUBLESHOOTING,
  })
  @IsEnum(AOGWorkflowStatus)
  @IsNotEmpty()
  toStatus: AOGWorkflowStatus;

  @ApiPropertyOptional({
    description: 'Notes about this transition',
    example: 'Started troubleshooting the hydraulic system',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Blocking reason (required for certain statuses)',
    enum: BlockingReason,
    example: BlockingReason.Finance,
  })
  @IsEnum(BlockingReason)
  @IsOptional()
  blockingReason?: BlockingReason;

  @ApiPropertyOptional({
    description: 'Additional metadata for the transition',
    type: TransitionMetadataDto,
  })
  @ValidateNested()
  @Type(() => TransitionMetadataDto)
  @IsOptional()
  metadata?: TransitionMetadataDto;
}
