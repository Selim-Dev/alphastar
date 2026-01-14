import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DiscrepanciesService } from './services/discrepancies.service';
import { CreateDiscrepancyDto } from './dto/create-discrepancy.dto';
import { UpdateDiscrepancyDto } from './dto/update-discrepancy.dto';
import { FilterDiscrepancyDto, DiscrepancyAnalyticsQueryDto } from './dto/filter-discrepancy.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Discrepancies')
@Controller('discrepancies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DiscrepanciesController {
  constructor(private readonly discrepanciesService: DiscrepanciesService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new discrepancy' })
  @ApiResponse({ status: 201, description: 'Discrepancy created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() createDto: CreateDiscrepancyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discrepanciesService.create(createDto, user.id);
  }


  @Get()
  @ApiOperation({ summary: 'Get all discrepancies with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of discrepancies' })
  async findAll(@Query() filter: FilterDiscrepancyDto) {
    return this.discrepanciesService.findAll({
      aircraftId: filter.aircraftId,
      ataChapter: filter.ataChapter,
      responsibility: filter.responsibility,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined,
      corrected: filter.corrected,
    });
  }

  @Get('analytics/ata-chapters')
  @ApiOperation({ summary: 'Get discrepancy counts grouped by ATA chapter' })
  @ApiResponse({ status: 200, description: 'Returns ATA chapter analytics' })
  async getATAChapterAnalytics(@Query() query: DiscrepancyAnalyticsQueryDto) {
    return this.discrepanciesService.getATAChapterAnalytics(
      query.aircraftId,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  @Get('analytics/top-ata-chapters')
  @ApiOperation({ summary: 'Get top ATA chapters by discrepancy count' })
  @ApiResponse({ status: 200, description: 'Returns top ATA chapters' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top chapters to return' })
  async getTopATAChapters(
    @Query() query: DiscrepancyAnalyticsQueryDto,
    @Query('limit') limit?: number,
  ) {
    return this.discrepanciesService.getTopATAChapters(
      limit || 10,
      query.aircraftId,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  @Get('uncorrected/count')
  @ApiOperation({ summary: 'Get count of uncorrected discrepancies' })
  @ApiResponse({ status: 200, description: 'Returns count of uncorrected discrepancies' })
  async getUncorrectedCount(@Query('aircraftId') aircraftId?: string) {
    const count = await this.discrepanciesService.countUncorrected(aircraftId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discrepancy by ID' })
  @ApiParam({ name: 'id', description: 'Discrepancy ID' })
  @ApiResponse({ status: 200, description: 'Returns the discrepancy' })
  @ApiResponse({ status: 404, description: 'Discrepancy not found' })
  async findById(@Param('id') id: string) {
    return this.discrepanciesService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update discrepancy by ID' })
  @ApiParam({ name: 'id', description: 'Discrepancy ID' })
  @ApiResponse({ status: 200, description: 'Discrepancy updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Discrepancy not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDiscrepancyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.discrepanciesService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete discrepancy by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Discrepancy ID' })
  @ApiResponse({ status: 204, description: 'Discrepancy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discrepancy not found' })
  async delete(@Param('id') id: string) {
    await this.discrepanciesService.delete(id);
  }
}
