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
  NotFoundException,
} from '@nestjs/common';
import { AOGEventsService } from './services/aog-events.service';
import { AOGSubEventsService } from './services/aog-sub-events.service';
import { CreateAOGEventDto } from './dto/create-aog-event.dto';
import { UpdateAOGEventDto } from './dto/update-aog-event.dto';
import { FilterAOGEventDto } from './dto/filter-aog-event.dto';
import { CreateSubEventDto } from './dto/create-sub-event.dto';
import { UpdateSubEventDto } from './dto/update-sub-event.dto';
import { CreateHandoffDto } from './dto/create-handoff.dto';
import { UpdateHandoffDto } from './dto/update-handoff.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('aog-events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AOGEventsController {
  constructor(
    private readonly aogEventsService: AOGEventsService,
    private readonly aogSubEventsService: AOGSubEventsService,
  ) {}

  // ─── Parent Event Routes ───────────────────────────────────────────

  @Post()
  @Roles(UserRole.Admin, UserRole.Editor)
  async create(
    @Body() dto: CreateAOGEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.create(dto, user.id);
  }

  @Get()
  async findAll(@Query() filter: FilterAOGEventDto) {
    return this.aogEventsService.findAll(filter);
  }

  @Get('active')
  async getActiveEvents() {
    return this.aogEventsService.getActiveAOGEvents();
  }

  @Get('active/count')
  async getActiveEventsCount() {
    const count = await this.aogEventsService.countActiveAOGEvents();
    return { count };
  }

  @Get('analytics/summary')
  async getAnalyticsSummary(@Query() filter: FilterAOGEventDto) {
    return this.aogEventsService.getAnalyticsSummary(filter);
  }

  @Get('analytics/category-breakdown')
  async getCategoryBreakdown(@Query() filter: FilterAOGEventDto) {
    return this.aogEventsService.getCategoryBreakdown(filter);
  }

  @Get('analytics/time-breakdown')
  async getTimeBreakdown(@Query() filter: FilterAOGEventDto) {
    return this.aogEventsService.getTimeBreakdown(filter);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const event = await this.aogEventsService.findById(id);
    if (!event) {
      throw new NotFoundException(`AOG event with ID ${id} not found`);
    }
    return event;
  }

  @Put(':id')
  @Roles(UserRole.Admin, UserRole.Editor)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAOGEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogEventsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.aogEventsService.delete(id);
  }

  // ─── Sub-Event Routes ─────────────────────────────────────────────

  @Post(':parentId/sub-events')
  @Roles(UserRole.Admin, UserRole.Editor)
  async createSubEvent(
    @Param('parentId') parentId: string,
    @Body() dto: CreateSubEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogSubEventsService.create(parentId, dto, user.id);
  }

  @Get(':parentId/sub-events')
  async listSubEvents(@Param('parentId') parentId: string) {
    return this.aogSubEventsService.findByParentId(parentId);
  }

  @Get(':parentId/sub-events/:subId')
  async getSubEvent(
    @Param('parentId') parentId: string,
    @Param('subId') subId: string,
  ) {
    const subEvent = await this.aogSubEventsService.findById(parentId, subId);
    if (!subEvent) {
      throw new NotFoundException(
        `Sub-event with ID ${subId} not found under parent ${parentId}`,
      );
    }
    return subEvent;
  }

  @Put(':parentId/sub-events/:subId')
  @Roles(UserRole.Admin, UserRole.Editor)
  async updateSubEvent(
    @Param('parentId') parentId: string,
    @Param('subId') subId: string,
    @Body() dto: UpdateSubEventDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogSubEventsService.update(parentId, subId, dto, user.id);
  }

  @Delete(':parentId/sub-events/:subId')
  @Roles(UserRole.Admin, UserRole.Editor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubEvent(
    @Param('parentId') parentId: string,
    @Param('subId') subId: string,
  ) {
    await this.aogSubEventsService.delete(parentId, subId);
  }

  // ─── Department Handoff Routes ────────────────────────────────────

  @Post(':parentId/sub-events/:subId/handoffs')
  @Roles(UserRole.Admin, UserRole.Editor)
  async addHandoff(
    @Param('parentId') parentId: string,
    @Param('subId') subId: string,
    @Body() dto: CreateHandoffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogSubEventsService.addHandoff(parentId, subId, dto, user.id);
  }

  @Put(':parentId/sub-events/:subId/handoffs/:handoffId')
  @Roles(UserRole.Admin, UserRole.Editor)
  async updateHandoff(
    @Param('parentId') parentId: string,
    @Param('subId') subId: string,
    @Param('handoffId') handoffId: string,
    @Body() dto: UpdateHandoffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.aogSubEventsService.updateHandoff(
      parentId,
      subId,
      handoffId,
      dto,
      user.id,
    );
  }

  @Delete(':parentId/sub-events/:subId/handoffs/:handoffId')
  @Roles(UserRole.Admin, UserRole.Editor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeHandoff(
    @Param('parentId') parentId: string,
    @Param('subId') subId: string,
    @Param('handoffId') handoffId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.aogSubEventsService.removeHandoff(
      parentId,
      subId,
      handoffId,
      user.id,
    );
  }
}
