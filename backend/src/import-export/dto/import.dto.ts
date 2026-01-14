import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ImportType } from '../schemas/import-log.schema';

export class UploadFileDto {
  @ApiProperty({ enum: ImportType, description: 'Type of data being imported' })
  @IsEnum(ImportType)
  @IsNotEmpty()
  importType: ImportType;
}

export class ConfirmImportDto {
  @ApiProperty({ description: 'Session ID from the upload preview' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class ImportPreviewResponseDto {
  @ApiProperty({ enum: ImportType })
  importType: ImportType;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  totalRows: number;

  @ApiProperty()
  validCount: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty({ type: [Object] })
  validRows: { rowNumber: number; data: Record<string, unknown> }[];

  @ApiProperty({ type: [Object] })
  errors: { row: number; message: string }[];

  @ApiProperty()
  sessionId: string;
}

export class ImportConfirmResponseDto {
  @ApiProperty()
  importLogId: string;

  @ApiProperty()
  successCount: number;

  @ApiProperty()
  errorCount: number;

  @ApiProperty({ type: [Object] })
  errors: { row: number; message: string }[];
}
