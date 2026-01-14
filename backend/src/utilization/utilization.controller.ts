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
import { UtilizationService } from './services/utilization.service';
import { CreateDailyCounterDto } from './dto/create-daily-counter.dto';
import { UpdateDailyCounterDto } from './dto/update-daily-counter.dto';
import { FilterDailyCounterDto } from './dto/filter-daily-counter.dto';
import { AggregationQueryDto } from './dto/aggregation-query.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Utilization')
@Controller('utilization')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UtilizationController {
  constructor(private readonly utilizationService: UtilizationService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new daily counter reading' })
  @ApiResponse({ status: 201, description: 'Daily counter created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Counter already exists for this date' })
  @ApiResponse({ status: 422, description: 'Monotonic validation error' })
  async create(
    @Body() createDto: CreateDailyCounterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.utilizationService.create({
      ...createDto,
      date: new Date(createDto.date),
      lastFlightDate: createDto.lastFlightDate
        ? new Date(createDto.lastFlightDate)
        : undefined,
      updatedBy: user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all daily counters with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of daily counters' })
  async findAll(@Query() filter: FilterDailyCounterDto) {
    return this.utilizationService.findAll({
      aircraftId: filter.aircraftId,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined,
    });
  }

  @Get('aggregations')
  @ApiOperation({ summary: 'Get aggregated utilization by period' })
  @ApiResponse({ status: 200, description: 'Returns aggregated utilization data' })
  async getAggregations(@Query() query: AggregationQueryDto) {
    return this.utilizationService.getAggregatedUtilization({
      period: query.period,
      aircraftId: query.aircraftId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }

  @Get('deltas/:aircraftId')
  @ApiOperation({ summary: 'Get daily flight hour deltas for an aircraft' })
  @ApiParam({ name: 'aircraftId', description: 'Aircraft ID' })
  @ApiResponse({ status: 200, description: 'Returns daily deltas' })
  async getDailyDeltas(
    @Param('aircraftId') aircraftId: string,
    @Query() filter: FilterDailyCounterDto,
  ) {
    return this.utilizationService.getDailyDeltas(
      aircraftId,
      filter.startDate ? new Date(filter.startDate) : undefined,
      filter.endDate ? new Date(filter.endDate) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get daily counter by ID' })
  @ApiParam({ name: 'id', description: 'Daily counter ID' })
  @ApiResponse({ status: 200, description: 'Returns the daily counter' })
  @ApiResponse({ status: 404, description: 'Daily counter not found' })
  async findById(@Param('id') id: string) {
    return this.utilizationService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update daily counter by ID' })
  @ApiParam({ name: 'id', description: 'Daily counter ID' })
  @ApiResponse({ status: 200, description: 'Daily counter updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Daily counter not found' })
  @ApiResponse({ status: 422, description: 'Monotonic validation error' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDailyCounterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.utilizationService.update(id, {
      ...updateDto,
      lastFlightDate: updateDto.lastFlightDate
        ? new Date(updateDto.lastFlightDate)
        : undefined,
      updatedBy: user.id,
    });
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete daily counter by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Daily counter ID' })
  @ApiResponse({ status: 204, description: 'Daily counter deleted successfully' })
  @ApiResponse({ status: 404, description: 'Daily counter not found' })
  async delete(@Param('id') id: string) {
    await this.utilizationService.delete(id);
  }
}
