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
import { DailyStatusService } from './services/daily-status.service';
import { CreateDailyStatusDto } from './dto/create-daily-status.dto';
import { UpdateDailyStatusDto } from './dto/update-daily-status.dto';
import { FilterDailyStatusDto } from './dto/filter-daily-status.dto';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Daily Status')
@Controller('daily-status')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DailyStatusController {
  constructor(private readonly dailyStatusService: DailyStatusService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new daily status record' })
  @ApiResponse({ status: 201, description: 'Daily status created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Status already exists for this date' })
  async create(
    @Body() createDto: CreateDailyStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dailyStatusService.create({
      ...createDto,
      date: new Date(createDto.date),
      updatedBy: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all daily status records with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of daily status records' })
  async findAll(@Query() filter: FilterDailyStatusDto) {
    return this.dailyStatusService.findAll({
      aircraftId: filter.aircraftId,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined,
      limit: filter.limit,
      skip: filter.skip,
    });
  }


  @Get('availability')
  @ApiOperation({ summary: 'Get availability metrics for a date range' })
  @ApiResponse({ status: 200, description: 'Returns availability metrics' })
  async getAvailability(@Query() filter: FilterDailyStatusDto) {
    return this.dailyStatusService.computeAvailability(
      filter.aircraftId,
      filter.startDate ? new Date(filter.startDate) : undefined,
      filter.endDate ? new Date(filter.endDate) : undefined,
    );
  }

  @Get('availability/aggregations')
  @ApiOperation({ summary: 'Get aggregated availability by period' })
  @ApiResponse({ status: 200, description: 'Returns aggregated availability data' })
  async getAggregatedAvailability(@Query() query: AvailabilityQueryDto) {
    return this.dailyStatusService.getAggregatedAvailability({
      period: query.period,
      aircraftId: query.aircraftId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  @Get('availability/fleet')
  @ApiOperation({ summary: 'Get fleet-wide availability metrics' })
  @ApiResponse({ status: 200, description: 'Returns fleet availability by aircraft' })
  async getFleetAvailability(@Query() filter: FilterDailyStatusDto) {
    return this.dailyStatusService.getFleetAvailability(
      filter.startDate ? new Date(filter.startDate) : undefined,
      filter.endDate ? new Date(filter.endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get daily status by ID' })
  @ApiParam({ name: 'id', description: 'Daily status ID' })
  @ApiResponse({ status: 200, description: 'Returns the daily status' })
  @ApiResponse({ status: 404, description: 'Daily status not found' })
  async findById(@Param('id') id: string) {
    return this.dailyStatusService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update daily status by ID' })
  @ApiParam({ name: 'id', description: 'Daily status ID' })
  @ApiResponse({ status: 200, description: 'Daily status updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Daily status not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDailyStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.dailyStatusService.update(id, {
      ...updateDto,
      updatedBy: user.id,
    });
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete daily status by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Daily status ID' })
  @ApiResponse({ status: 204, description: 'Daily status deleted successfully' })
  @ApiResponse({ status: 404, description: 'Daily status not found' })
  async delete(@Param('id') id: string) {
    await this.dailyStatusService.delete(id);
  }
}
