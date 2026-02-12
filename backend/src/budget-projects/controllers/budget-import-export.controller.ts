import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { BudgetImportService } from '../services/budget-import.service';
import { BudgetExportService } from '../services/budget-export.service';

/**
 * Budget Import/Export Controller
 * 
 * Handles Excel file import and export for budget projects.
 * 
 * Requirements: 7.1, 7.2, 7.5
 */
@Controller('budget-import-export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetImportExportController {
  constructor(
    private readonly budgetImportService: BudgetImportService,
    private readonly budgetExportService: BudgetExportService,
  ) {}

  /**
   * Import Excel file for budget project
   * 
   * POST /api/budget-import-export/import
   * 
   * Requirements: 7.1, 7.2
   * 
   * @param file - Uploaded Excel file
   * @param body - Request body with projectId and templateType
   * @param user - Current user
   * @returns Import result
   */
  @Post('import')
  @Roles(UserRole.Editor, UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, callback) => {
        // Accept only Excel files
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls')
        ) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Only Excel files (.xlsx, .xls) are allowed'),
            false,
          );
        }
      },
    }),
  )
  async importExcel(
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
    @Body() body: { projectId: string; templateType: string },
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!body.projectId) {
      throw new BadRequestException('projectId is required');
    }

    if (!body.templateType) {
      throw new BadRequestException('templateType is required');
    }

    // Parse Excel file
    const excelData = await this.budgetImportService.parseExcelFile(
      file.buffer,
      body.templateType,
    );

    // Generate preview
    const preview = await this.budgetImportService.generatePreview(
      body.projectId,
      excelData,
    );

    // Import data
    const result = await this.budgetImportService.importData(
      body.projectId,
      preview,
      user.sub,
    );

    return {
      message: 'Excel file imported successfully',
      preview,
      result,
    };
  }

  /**
   * Validate Excel file without importing
   * 
   * POST /api/budget-import-export/validate
   * 
   * Requirements: 7.2
   * 
   * @param file - Uploaded Excel file
   * @param body - Request body with templateType
   * @returns Validation result with preview
   */
  @Post('validate')
  @Roles(UserRole.Editor, UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
      fileFilter: (req, file, callback) => {
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.originalname.endsWith('.xlsx') ||
          file.originalname.endsWith('.xls')
        ) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException('Only Excel files (.xlsx, .xls) are allowed'),
            false,
          );
        }
      },
    }),
  )
  async validateExcel(
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
    @Body() body: { projectId: string; templateType: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!body.templateType) {
      throw new BadRequestException('templateType is required');
    }

    // Parse Excel file
    const excelData = await this.budgetImportService.parseExcelFile(
      file.buffer,
      body.templateType,
    );

    // Generate preview if projectId provided
    let preview: any = null;
    if (body.projectId) {
      preview = await this.budgetImportService.generatePreview(
        body.projectId,
        excelData,
      );
    }

    return {
      message: 'Excel file is valid',
      isValid: true,
      preview,
      metadata: excelData.metadata,
    };
  }

  /**
   * Export budget project to Excel
   * 
   * GET /api/budget-import-export/export/:projectId
   * 
   * Requirements: 7.5
   * 
   * @param projectId - Budget project ID
   * @param res - Express response
   */
  @Get('export/:projectId')
  @Roles(UserRole.Viewer, UserRole.Editor, UserRole.Admin)
  async exportExcel(
    @Param('projectId') projectId: string,
    @Res() res: Response,
  ) {
    // Generate Excel file
    const buffer = await this.budgetExportService.exportToExcel(projectId);

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="budget-project-${projectId}.xlsx"`,
    );
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.send(buffer);
  }

  /**
   * Export budget project to Excel with filters
   * 
   * POST /api/budget-import-export/export/:projectId
   * 
   * Requirements: 7.5, 7.8
   * 
   * @param projectId - Budget project ID
   * @param body - Export filters
   * @param res - Express response
   */
  @Post('export/:projectId')
  @Roles(UserRole.Viewer, UserRole.Editor, UserRole.Admin)
  async exportExcelWithFilters(
    @Param('projectId') projectId: string,
    @Body() body: {
      aircraftTypes?: string[];
      termCategories?: string[];
      dateRange?: { start: string; end: string };
    },
    @Res() res: Response,
  ) {
    // Convert date strings to Date objects
    const filters = {
      ...body,
      dateRange: body.dateRange
        ? {
            start: new Date(body.dateRange.start),
            end: new Date(body.dateRange.end),
          }
        : undefined,
    };

    // Generate Excel file with filters
    const buffer = await this.budgetExportService.exportToExcel(projectId, filters);

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="budget-project-${projectId}-filtered.xlsx"`,
    );
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.send(buffer);
  }
}
