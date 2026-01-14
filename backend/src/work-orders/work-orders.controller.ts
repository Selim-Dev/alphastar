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
import { WorkOrdersService } from './services/work-orders.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { FilterWorkOrderDto, WorkOrderAnalyticsQueryDto } from './dto/filter-work-order.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Work Orders')
@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new work order' })
  @ApiResponse({ status: 201, description: 'Work order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Work order number already exists' })
  async create(
    @Body() createDto: CreateWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrdersService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work orders with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of work orders' })
  async findAll(@Query() filter: FilterWorkOrderDto) {
    return this.workOrdersService.findAll({
      aircraftId: filter.aircraftId,
      status: filter.status,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined,
      overdue: filter.overdue,
    });
  }


  @Get('analytics/status-distribution')
  @ApiOperation({ summary: 'Get work order status distribution' })
  @ApiResponse({ status: 200, description: 'Returns status distribution counts' })
  async getStatusDistribution(@Query() query: WorkOrderAnalyticsQueryDto) {
    return this.workOrdersService.getStatusDistribution(
      query.aircraftId,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  @Get('analytics/turnaround')
  @ApiOperation({ summary: 'Get turnaround time statistics for closed work orders' })
  @ApiResponse({ status: 200, description: 'Returns turnaround time statistics' })
  async getTurnaroundStats(@Query() query: WorkOrderAnalyticsQueryDto) {
    return this.workOrdersService.getTurnaroundStats(
      query.aircraftId,
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
    );
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue work orders' })
  @ApiResponse({ status: 200, description: 'Returns list of overdue work orders' })
  async getOverdueWorkOrders(@Query('aircraftId') aircraftId?: string) {
    return this.workOrdersService.getOverdueWorkOrders(aircraftId);
  }

  @Get('overdue/count')
  @ApiOperation({ summary: 'Get count of overdue work orders' })
  @ApiResponse({ status: 200, description: 'Returns count of overdue work orders' })
  async getOverdueCount(@Query('aircraftId') aircraftId?: string) {
    const count = await this.workOrdersService.countOverdueWorkOrders(aircraftId);
    return { count };
  }

  @Get('by-number/:woNumber')
  @ApiOperation({ summary: 'Get work order by work order number' })
  @ApiParam({ name: 'woNumber', description: 'Work order number' })
  @ApiResponse({ status: 200, description: 'Returns the work order' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async findByWoNumber(@Param('woNumber') woNumber: string) {
    return this.workOrdersService.findByWoNumber(woNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get work order by ID' })
  @ApiParam({ name: 'id', description: 'Work order ID' })
  @ApiResponse({ status: 200, description: 'Returns the work order' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async findById(@Param('id') id: string) {
    return this.workOrdersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update work order by ID' })
  @ApiParam({ name: 'id', description: 'Work order ID' })
  @ApiResponse({ status: 200, description: 'Work order updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  @ApiResponse({ status: 409, description: 'Work order number already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.workOrdersService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete work order by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Work order ID' })
  @ApiResponse({ status: 204, description: 'Work order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Work order not found' })
  async delete(@Param('id') id: string) {
    await this.workOrdersService.delete(id);
  }

  @Get('validate/:woNumber')
  @ApiOperation({ summary: 'Validate that a work order exists by number' })
  @ApiParam({ name: 'woNumber', description: 'Work order number to validate' })
  @ApiResponse({ status: 200, description: 'Returns validation result' })
  async validateWorkOrder(@Param('woNumber') woNumber: string) {
    const exists = await this.workOrdersService.validateWorkOrderExists(woNumber);
    return { exists };
  }
}
