import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../auth/schemas/user.schema';
import { ExcelTemplateService } from './services/excel-template.service';
import { ImportService } from './services/import.service';
import { ExportService } from './services/export.service';
import type { ExportType } from './services/export.service';
import { ImportType } from './schemas/import-log.schema';
import { ConfirmImportDto, ImportPreviewResponseDto, ImportConfirmResponseDto } from './dto/import.dto';
import { ExportQueryDto, EXPORT_TYPES } from './dto/export.dto';

@ApiTags('Import/Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ImportExportController {
  constructor(
    private readonly templateService: ExcelTemplateService,
    private readonly importService: ImportService,
    private readonly exportService: ExportService,
  ) {}

  /**
   * Download Excel template for a specific import type
   * Requirements: 10.1
   */
  @Get('import/template/:type')
  @ApiOperation({ summary: 'Download Excel template for import' })
  @ApiParam({ name: 'type', enum: ImportType })
  @ApiResponse({ status: 200, description: 'Excel template file' })
  async downloadTemplate(
    @Param('type') type: ImportType,
    @Res() res: Response,
  ): Promise<void> {
    if (!Object.values(ImportType).includes(type)) {
      throw new BadRequestException(`Invalid import type: ${type}`);
    }

    const buffer = this.templateService.generateTemplate(type);
    const filename = this.templateService.getTemplateFilename(type);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }


  /**
   * Get available import types
   */
  @Get('import/types')
  @ApiOperation({ summary: 'Get available import types' })
  @ApiResponse({ status: 200, description: 'List of available import types' })
  getImportTypes(): { type: ImportType; name: string }[] {
    return this.templateService.getAvailableImportTypes();
  }

  /**
   * Upload and parse Excel file for preview
   * Requirements: 10.2, 10.3
   */
  @Post('import/upload')
  @Roles(UserRole.Admin, UserRole.Editor)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload Excel file for import preview' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        importType: { type: 'string', enum: Object.values(ImportType) },
      },
      required: ['file', 'importType'],
    },
  })
  @ApiResponse({ status: 200, type: ImportPreviewResponseDto })
  async uploadFile(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Body('importType') importType: ImportType,
  ): Promise<ImportPreviewResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!Object.values(ImportType).includes(importType)) {
      throw new BadRequestException(`Invalid import type: ${importType}`);
    }

    const preview = await this.importService.parseAndPreview(
      file.buffer,
      file.originalname,
      importType,
    );

    return {
      importType: preview.importType,
      filename: preview.filename,
      totalRows: preview.totalRows,
      validCount: preview.validCount,
      errorCount: preview.errorCount,
      validRows: preview.validRows.map((r) => ({
        rowNumber: r.rowNumber,
        data: r.data,
      })),
      errors: preview.errors,
      sessionId: preview.sessionId,
    };
  }

  /**
   * Confirm import of valid rows
   * Requirements: 10.4, 10.5
   */
  @Post('import/confirm')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Confirm import of valid rows' })
  @ApiResponse({ status: 200, type: ImportConfirmResponseDto })
  async confirmImport(
    @Body() dto: ConfirmImportDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ImportConfirmResponseDto> {
    // For now, use a placeholder S3 key - in production this would be the actual S3 upload
    const s3Key = `imports/${Date.now()}_${dto.sessionId}`;

    const result = await this.importService.confirmImport(
      dto.sessionId,
      user.userId,
      s3Key,
    );

    return {
      importLogId: result.importLogId,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors,
    };
  }

  /**
   * Get import history
   */
  @Get('import/history')
  @ApiOperation({ summary: 'Get import history' })
  @ApiResponse({ status: 200, description: 'List of import logs' })
  async getImportHistory(
    @Query('importType') importType?: ImportType,
    @CurrentUser() user?: { userId: string },
  ) {
    return this.importService.getImportHistory(user?.userId, importType);
  }

  /**
   * Get specific import log
   */
  @Get('import/log/:id')
  @ApiOperation({ summary: 'Get specific import log' })
  @ApiResponse({ status: 200, description: 'Import log details' })
  async getImportLog(@Param('id') id: string) {
    return this.importService.getImportLog(id);
  }


  /**
   * Get available export types
   */
  @Get('export/types')
  @ApiOperation({ summary: 'Get available export types' })
  @ApiResponse({ status: 200, description: 'List of available export types' })
  getExportTypes(): string[] {
    return EXPORT_TYPES;
  }

  /**
   * Export data to Excel
   * Requirements: 1.5, 8.5, 11.5
   */
  @Get('export/:type')
  @ApiOperation({ summary: 'Export data to Excel' })
  @ApiParam({ name: 'type', enum: EXPORT_TYPES })
  @ApiResponse({ status: 200, description: 'Excel file download' })
  async exportData(
    @Param('type') type: ExportType,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    if (!EXPORT_TYPES.includes(type)) {
      throw new BadRequestException(`Invalid export type: ${type}`);
    }

    const options = {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      aircraftId: query.aircraftId,
      fiscalYear: query.fiscalYear,
      fleetGroup: query.fleetGroup,
    };

    const { buffer, filename } = await this.exportService.exportToExcel(type, options);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
