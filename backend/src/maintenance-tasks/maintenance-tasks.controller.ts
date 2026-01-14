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
import { MaintenanceTasksService } from './services/maintenance-tasks.service';
import { CreateMaintenanceTaskDto } from './dto/create-maintenance-task.dto';
import { UpdateMaintenanceTaskDto } from './dto/update-maintenance-task.dto';
import {
  FilterMaintenanceTaskDto,
  SummaryQueryDto,
  CostRankingQueryDto,
} from './dto/filter-maintenance-task.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Maintenance Tasks')
@Controller('maintenance-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MaintenanceTasksController {
  constructor(private readonly maintenanceTasksService: MaintenanceTasksService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new maintenance task' })
  @ApiResponse({ status: 201, description: 'Maintenance task created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() createDto: CreateMaintenanceTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenanceTasksService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all maintenance tasks with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of maintenance tasks' })
  async findAll(@Query() filter: FilterMaintenanceTaskDto) {
    return this.maintenanceTasksService.findAll({
      aircraftId: filter.aircraftId,
      shift: filter.shift,
      taskType: filter.taskType,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined,
    });
  }


  @Get('summary')
  @ApiOperation({ summary: 'Get maintenance summary aggregated by specified dimensions' })
  @ApiResponse({ status: 200, description: 'Returns aggregated maintenance summary' })
  async getSummary(@Query() query: SummaryQueryDto) {
    type GroupByField = 'date' | 'shift' | 'aircraftId' | 'taskType';
    const validFields: GroupByField[] = ['date', 'shift', 'aircraftId', 'taskType'];
    
    // Parse groupBy string into array
    const groupBy: GroupByField[] = query.groupBy
      ? query.groupBy
          .split(',')
          .map((g) => g.trim() as GroupByField)
          .filter((g) => validFields.includes(g))
      : ['date'];

    return this.maintenanceTasksService.getSummary(
      groupBy,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.aircraftId,
    );
  }

  @Get('top-cost-drivers')
  @ApiOperation({ summary: 'Get aircraft ranked by total maintenance cost' })
  @ApiResponse({ status: 200, description: 'Returns aircraft cost ranking' })
  async getTopCostDrivers(@Query() query: CostRankingQueryDto) {
    return this.maintenanceTasksService.getTopCostDrivers(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.limit,
    );
  }

  @Get('task-types')
  @ApiOperation({ summary: 'Get all distinct task types' })
  @ApiResponse({ status: 200, description: 'Returns list of task types' })
  async getTaskTypes() {
    const taskTypes = await this.maintenanceTasksService.getDistinctTaskTypes();
    return { taskTypes };
  }

  @Get('by-work-order/:workOrderId')
  @ApiOperation({ summary: 'Get maintenance tasks linked to a work order' })
  @ApiParam({ name: 'workOrderId', description: 'Work order ID' })
  @ApiResponse({ status: 200, description: 'Returns tasks linked to the work order' })
  async findByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.maintenanceTasksService.findByWorkOrder(workOrderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance task by ID' })
  @ApiParam({ name: 'id', description: 'Maintenance task ID' })
  @ApiResponse({ status: 200, description: 'Returns the maintenance task' })
  @ApiResponse({ status: 404, description: 'Maintenance task not found' })
  async findById(@Param('id') id: string) {
    return this.maintenanceTasksService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update maintenance task by ID' })
  @ApiParam({ name: 'id', description: 'Maintenance task ID' })
  @ApiResponse({ status: 200, description: 'Maintenance task updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Maintenance task not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceTaskDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.maintenanceTasksService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete maintenance task by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Maintenance task ID' })
  @ApiResponse({ status: 204, description: 'Maintenance task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Maintenance task not found' })
  async delete(@Param('id') id: string) {
    await this.maintenanceTasksService.delete(id);
  }
}
