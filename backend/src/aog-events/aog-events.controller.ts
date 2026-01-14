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
import { AOGEventsService } from './services/aog-events.service';
import { CreateAOGEventDto } from './dto/create-aog-event.dto';
import { UpdateAOGEventDto } from './dto/update-aog-event.dto';
import { FilterAOGEventDto, AnalyticsQueryDto, ThreeBucketAnalyticsQueryDto } from './dto/filter-aog-event.dto';
import { CreateTransitionDto } from './dto/create-transition.dto';
import { CreatePartRequestDto, UpdatePartRequestDto } from './dto/create-part-request.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('AOG Events')
@Controller('aog-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AOGEventsController {
  constructor(private readonly aogEventsService: AOGEventsService) {}

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new AOG event' })
  @ApiResponse({ status: 201, description: 'AOG event created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 422, description: 'Timestamp validation error' })
  async create(
    @Body() createDto: CreateAOGEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all AOG events with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of AOG events' })
  async findAll(@Query() filter: FilterAOGEventDto) {
    // Adjust endDate to end of day (23:59:59.999) to include all events on that day
    let endDate: Date | undefined;
    if (filter.endDate) {
      endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    return this.aogEventsService.findAll({
      aircraftId: filter.aircraftId,
      responsibleParty: filter.responsibleParty,
      category: filter.category,
      currentStatus: filter.currentStatus,
      blockingReason: filter.blockingReason,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate,
    });
  }

  @Get('analytics/downtime-by-responsibility')
  @ApiOperation({ summary: 'Get total downtime hours grouped by responsible party' })
  @ApiResponse({ status: 200, description: 'Returns downtime analytics by responsibility' })
  async getDowntimeByResponsibility(@Query() query: AnalyticsQueryDto) {
    return this.aogEventsService.getDowntimeByResponsibility(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.aircraftId,
    );
  }

  @Get('analytics/stages')
  @ApiOperation({ summary: 'Get AOG events count by workflow status and blocking reason' })
  @ApiResponse({ status: 200, description: 'Returns stage breakdown analytics' })
  async getStageBreakdown(@Query() query: AnalyticsQueryDto) {
    return this.aogEventsService.getStageBreakdown(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.aircraftId,
    );
  }

  @Get('analytics/bottlenecks')
  @ApiOperation({ summary: 'Get average time in each status and blocking states' })
  @ApiResponse({ status: 200, description: 'Returns bottleneck analytics' })
  async getBottleneckAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.aogEventsService.getBottleneckAnalytics(
      query.startDate ? new Date(query.startDate) : undefined,
      query.endDate ? new Date(query.endDate) : undefined,
      query.aircraftId,
    );
  }

  @Get('analytics/buckets')
  @ApiOperation({ summary: 'Get three-bucket downtime analytics (Technical, Procurement, Ops)' })
  @ApiResponse({ status: 200, description: 'Returns three-bucket analytics with summary and per-aircraft breakdown' })
  async getThreeBucketAnalytics(@Query() query: ThreeBucketAnalyticsQueryDto) {
    // Adjust endDate to end of day (23:59:59.999) to include all events on that day
    let endDate: Date | undefined;
    if (query.endDate) {
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    return this.aogEventsService.getThreeBucketAnalytics({
      aircraftId: query.aircraftId,
      fleetGroup: query.fleetGroup,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate,
    });
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active AOG events (not yet cleared)' })
  @ApiResponse({ status: 200, description: 'Returns list of active AOG events' })
  async getActiveEvents(@Query('aircraftId') aircraftId?: string) {
    return this.aogEventsService.getActiveAOGEvents(aircraftId);
  }

  @Get('active/count')
  @ApiOperation({ summary: 'Get count of active AOG events' })
  @ApiResponse({ status: 200, description: 'Returns count of active AOG events' })
  async getActiveEventsCount(@Query('aircraftId') aircraftId?: string) {
    const count = await this.aogEventsService.countActiveAOGEvents(aircraftId);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AOG event by ID' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiResponse({ status: 200, description: 'Returns the AOG event' })
  @ApiResponse({ status: 404, description: 'AOG event not found' })
  async findById(@Param('id') id: string) {
    return this.aogEventsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update AOG event by ID' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiResponse({ status: 200, description: 'AOG event updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 404, description: 'AOG event not found' })
  @ApiResponse({ status: 422, description: 'Timestamp validation error' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAOGEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete AOG event by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiResponse({ status: 204, description: 'AOG event deleted successfully' })
  @ApiResponse({ status: 404, description: 'AOG event not found' })
  async delete(@Param('id') id: string) {
    await this.aogEventsService.delete(id);
  }

  @Post(':id/transitions')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Transition AOG event to a new workflow status' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiResponse({ status: 200, description: 'Status transitioned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transition or validation error' })
  @ApiResponse({ status: 404, description: 'AOG event not found' })
  async transitionStatus(
    @Param('id') id: string,
    @Body() transitionDto: CreateTransitionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.transitionStatus(
      id,
      {
        toStatus: transitionDto.toStatus,
        notes: transitionDto.notes,
        blockingReason: transitionDto.blockingReason,
        actorRole: user.role,
        metadata: transitionDto.metadata,
      },
      user.id,
    );
  }

  @Post(':id/attachments')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Add attachment to AOG event' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiResponse({ status: 200, description: 'Attachment added successfully' })
  @ApiResponse({ status: 404, description: 'AOG event not found' })
  async addAttachment(
    @Param('id') id: string,
    @Body('s3Key') s3Key: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.addAttachment(id, s3Key, user.id);
  }

  @Delete(':id/attachments/:s3Key')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Remove attachment from AOG event' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiParam({ name: 's3Key', description: 'S3 key of the attachment' })
  @ApiResponse({ status: 200, description: 'Attachment removed successfully' })
  @ApiResponse({ status: 404, description: 'AOG event not found' })
  async removeAttachment(
    @Param('id') id: string,
    @Param('s3Key') s3Key: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.removeAttachment(id, s3Key, user.id);
  }

  @Post(':id/parts')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Add a part request to an AOG event' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiResponse({ status: 201, description: 'Part request added successfully' })
  @ApiResponse({ status: 404, description: 'AOG event not found' })
  async addPartRequest(
    @Param('id') id: string,
    @Body() createPartRequestDto: CreatePartRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.addPartRequest(
      id,
      {
        partNumber: createPartRequestDto.partNumber,
        partDescription: createPartRequestDto.partDescription,
        quantity: createPartRequestDto.quantity,
        estimatedCost: createPartRequestDto.estimatedCost,
        vendor: createPartRequestDto.vendor,
        requestedDate: new Date(createPartRequestDto.requestedDate),
      },
      user.id,
    );
  }

  @Put(':id/parts/:partId')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update a part request within an AOG event' })
  @ApiParam({ name: 'id', description: 'AOG event ID' })
  @ApiParam({ name: 'partId', description: 'Part request ID' })
  @ApiResponse({ status: 200, description: 'Part request updated successfully' })
  @ApiResponse({ status: 404, description: 'AOG event or part request not found' })
  async updatePartRequest(
    @Param('id') id: string,
    @Param('partId') partId: string,
    @Body() updatePartRequestDto: UpdatePartRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updates: Record<string, unknown> = {};
    
    if (updatePartRequestDto.partNumber !== undefined) {
      updates.partNumber = updatePartRequestDto.partNumber;
    }
    if (updatePartRequestDto.partDescription !== undefined) {
      updates.partDescription = updatePartRequestDto.partDescription;
    }
    if (updatePartRequestDto.quantity !== undefined) {
      updates.quantity = updatePartRequestDto.quantity;
    }
    if (updatePartRequestDto.estimatedCost !== undefined) {
      updates.estimatedCost = updatePartRequestDto.estimatedCost;
    }
    if (updatePartRequestDto.actualCost !== undefined) {
      updates.actualCost = updatePartRequestDto.actualCost;
    }
    if (updatePartRequestDto.vendor !== undefined) {
      updates.vendor = updatePartRequestDto.vendor;
    }
    if (updatePartRequestDto.status !== undefined) {
      updates.status = updatePartRequestDto.status;
    }
    if (updatePartRequestDto.invoiceRef !== undefined) {
      updates.invoiceRef = updatePartRequestDto.invoiceRef;
    }
    if (updatePartRequestDto.trackingNumber !== undefined) {
      updates.trackingNumber = updatePartRequestDto.trackingNumber;
    }
    if (updatePartRequestDto.eta !== undefined) {
      updates.eta = new Date(updatePartRequestDto.eta);
    }
    if (updatePartRequestDto.receivedDate !== undefined) {
      updates.receivedDate = new Date(updatePartRequestDto.receivedDate);
    }
    if (updatePartRequestDto.issuedDate !== undefined) {
      updates.issuedDate = new Date(updatePartRequestDto.issuedDate);
    }

    return this.aogEventsService.updatePartRequest(id, partId, updates, user.id);
  }
}
