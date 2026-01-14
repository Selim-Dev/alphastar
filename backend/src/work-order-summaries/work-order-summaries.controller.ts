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
} from '@nestjs/swagger';
import { WorkOrderSummariesService } from './services/work-order-summaries.service';
import { CreateWorkOrderSummaryDto } from './dto/create-work-order-summary.dto';
import { UpdateWorkOrderSummaryDto } from './dto/update-work-order-summary.dto';
import {
  FilterWorkOrderSummaryDto,
  TrendQueryDto,
} from './dto/filter-work-order-summary.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { AircraftService } from '../aircraft/services/aircraft.service';

/**
 * Controller for WorkOrderSummary endpoints
 * Requirements: 11.1, 11.4
 */
@ApiTags('Work Order Summaries')
@Controller('work-order-summaries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkOrderSummariesController {
  constructor(
    private readonly workOrderSummariesService: WorkOrderSummariesService,
    private readonly aircraftService: AircraftService,
  ) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create or update a work order summary (upsert by aircraftId + period)' })
  @ApiResponse({ status: 201, description: 'Work order summary created/updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() createDto: CreateWorkOrderSummaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrderSummariesService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work order summaries with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of work order summaries' })
  async findAll(@Query() filter: FilterWorkOrderSummaryDto) {
    // If fleetGroup is provided, get aircraft IDs for that fleet group
    let aircraftIds: string[] | undefined;
    if (filter.fleetGroup) {
      const result = await this.aircraftService.findAll({
        fleetGroup: filter.fleetGroup,
      });
      aircraftIds = result.data.map((a) => a._id?.toString()).filter((id): id is string => !!id);
    }

    return this.workOrderSummariesService.findAll({
      aircraftId: filter.aircraftId,
      aircraftIds,
      startPeriod: filter.startPeriod,
      endPeriod: filter.endPeriod,
    });
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get work order count trends by period' })
  @ApiResponse({ status: 200, description: 'Returns trend data aggregated by period' })
  async getTrends(@Query() query: TrendQueryDto) {
    // If fleetGroup is provided, get aircraft IDs for that fleet group
    let aircraftIds: string[] | undefined;
    if (query.fleetGroup) {
      const result = await this.aircraftService.findAll({
        fleetGroup: query.fleetGroup,
      });
      aircraftIds = result.data.map((a) => a._id?.toString()).filter((id): id is string => !!id);
    }

    return this.workOrderSummariesService.getTrends({
      aircraftId: query.aircraftId,
      aircraftIds,
      startPeriod: query.startPeriod,
      endPeriod: query.endPeriod,
    });
  }

  @Get('total')
  @ApiOperation({ summary: 'Get total work order count for a period range' })
  @ApiResponse({ status: 200, description: 'Returns total work order count' })
  async getTotalCount(@Query() query: TrendQueryDto) {
    // If fleetGroup is provided, get aircraft IDs for that fleet group
    let aircraftIds: string[] | undefined;
    if (query.fleetGroup) {
      const result = await this.aircraftService.findAll({
        fleetGroup: query.fleetGroup,
      });
      aircraftIds = result.data.map((a) => a._id?.toString()).filter((id): id is string => !!id);
    }

    const total = await this.workOrderSummariesService.getTotalCount({
      aircraftId: query.aircraftId,
      aircraftIds,
      startPeriod: query.startPeriod,
      endPeriod: query.endPeriod,
    });

    return { total };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order summary by ID' })
  @ApiParam({ name: 'id', description: 'Work order summary ID' })
  @ApiResponse({ status: 200, description: 'Returns the work order summary' })
  @ApiResponse({ status: 404, description: 'Work order summary not found' })
  async findById(@Param('id') id: string) {
    return this.workOrderSummariesService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update work order summary by ID' })
  @ApiParam({ name: 'id', description: 'Work order summary ID' })
  @ApiResponse({ status: 200, description: 'Work order summary updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Work order summary not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkOrderSummaryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrderSummariesService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete work order summary by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Work order summary ID' })
  @ApiResponse({ status: 204, description: 'Work order summary deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work order summary not found' })
  async delete(@Param('id') id: string) {
    await this.workOrderSummariesService.delete(id);
  }
}
