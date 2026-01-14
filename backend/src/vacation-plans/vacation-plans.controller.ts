import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { VacationPlansService } from './services/vacation-plans.service';
import { CreateVacationPlanDto } from './dto/create-vacation-plan.dto';
import { UpdateVacationPlanDto } from './dto/update-vacation-plan.dto';
import { FilterVacationPlanDto } from './dto/filter-vacation-plan.dto';
import { UpdateCellDto } from './dto/update-cell.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { ImportService } from '../import-export/services/import.service';
import { ExportService } from '../import-export/services/export.service';

/**
 * Controller for VacationPlan endpoints
 * Requirements: 18.1, 18.2
 */
@ApiTags('Vacation Plans')
@Controller('vacation-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VacationPlansController {
  constructor(
    private readonly vacationPlansService: VacationPlansService,
    private readonly importService: ImportService,
    private readonly exportService: ExportService,
  ) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new vacation plan' })
  @ApiResponse({ status: 201, description: 'Vacation plan created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Vacation plan for this year and team already exists' })
  async create(
    @Body() createDto: CreateVacationPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vacationPlansService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vacation plans with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of vacation plans' })
  async findAll(@Query() filter: FilterVacationPlanDto) {
    return this.vacationPlansService.findAll({
      year: filter.year,
      team: filter.team,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vacation plan by ID' })
  @ApiParam({ name: 'id', description: 'Vacation plan ID' })
  @ApiResponse({ status: 200, description: 'Returns the vacation plan' })
  @ApiResponse({ status: 404, description: 'Vacation plan not found' })
  async findById(@Param('id') id: string) {
    return this.vacationPlansService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update vacation plan by ID (bulk update)' })
  @ApiParam({ name: 'id', description: 'Vacation plan ID' })
  @ApiResponse({ status: 200, description: 'Vacation plan updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Vacation plan not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateVacationPlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vacationPlansService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vacation plan by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Vacation plan ID' })
  @ApiResponse({ status: 204, description: 'Vacation plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vacation plan not found' })
  async delete(@Param('id') id: string) {
    await this.vacationPlansService.delete(id);
  }

  @Patch(':id/cell')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update a single cell in a vacation plan' })
  @ApiParam({ name: 'id', description: 'Vacation plan ID' })
  @ApiResponse({ status: 200, description: 'Cell updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - non-numeric value or invalid week index' })
  @ApiResponse({ status: 404, description: 'Vacation plan or employee not found' })
  async updateCell(
    @Param('id') id: string,
    @Body() updateCellDto: UpdateCellDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vacationPlansService.updateCell(id, updateCellDto, user.id);
  }

  @Post(':id/employees')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Add a new employee to a vacation plan' })
  @ApiParam({ name: 'id', description: 'Vacation plan ID' })
  @ApiResponse({ status: 201, description: 'Employee added successfully' })
  @ApiResponse({ status: 400, description: 'Employee already exists' })
  @ApiResponse({ status: 404, description: 'Vacation plan not found' })
  async addEmployee(
    @Param('id') id: string,
    @Body('name') employeeName: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vacationPlansService.addEmployee(id, employeeName, user.id);
  }

  @Delete(':id/employees/:employeeName')
  @Roles(UserRole.Admin, UserRole.Editor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an employee from a vacation plan' })
  @ApiParam({ name: 'id', description: 'Vacation plan ID' })
  @ApiParam({ name: 'employeeName', description: 'Employee name to remove' })
  @ApiResponse({ status: 200, description: 'Employee removed successfully' })
  @ApiResponse({ status: 404, description: 'Vacation plan or employee not found' })
  async removeEmployee(
    @Param('id') id: string,
    @Param('employeeName') employeeName: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.vacationPlansService.removeEmployee(id, employeeName, user.id);
  }

  /**
   * Export a vacation plan to Excel
   * Requirements: 18.4
   */
  @Get(':id/export')
  @ApiOperation({ summary: 'Export vacation plan to Excel' })
  @ApiParam({ name: 'id', description: 'Vacation plan ID' })
  @ApiResponse({ status: 200, description: 'Excel file download' })
  @ApiResponse({ status: 404, description: 'Vacation plan not found' })
  async exportPlan(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.exportService.exportVacationPlan(id);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * Export all vacation plans for a year to Excel
   * Requirements: 18.4
   */
  @Get('export/year/:year')
  @ApiOperation({ summary: 'Export all vacation plans for a year to Excel' })
  @ApiParam({ name: 'year', description: 'Year to export' })
  @ApiResponse({ status: 200, description: 'Excel file download' })
  @ApiResponse({ status: 404, description: 'No vacation plans found for year' })
  async exportByYear(
    @Param('year') year: string,
    @Res() res: Response,
  ): Promise<void> {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      throw new BadRequestException('Invalid year parameter');
    }

    const { buffer, filename } = await this.exportService.exportVacationPlansByYear(yearNum);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  /**
   * Import vacation plans from Excel
   * Requirements: 18.5
   */
  @Post('import')
  @Roles(UserRole.Admin, UserRole.Editor)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import vacation plans from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        year: { type: 'number', description: 'Year for the vacation plans' },
      },
      required: ['file', 'year'],
    },
  })
  @ApiResponse({ status: 200, description: 'Import result' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async importPlans(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Body('year') year: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      throw new BadRequestException('Invalid year parameter. Must be between 2000 and 2100');
    }

    return this.importService.importVacationPlan(
      file.buffer,
      file.originalname,
      yearNum,
      user.id,
    );
  }
}
