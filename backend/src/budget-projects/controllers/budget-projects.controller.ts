import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/schemas/user.schema';
import { BudgetProjectsService } from '../services/budget-projects.service';
import { CreateBudgetProjectDto } from '../dto/create-budget-project.dto';
import { UpdateBudgetProjectDto } from '../dto/update-budget-project.dto';
import { BudgetProjectFiltersDto } from '../dto/budget-project-filters.dto';
import { UpdatePlanRowDto } from '../dto/update-plan-row.dto';
import { UpdateActualDto } from '../dto/update-actual.dto';

@Controller('budget-projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetProjectsController {
  constructor(private readonly budgetProjectsService: BudgetProjectsService) {}

  @Post()
  @Roles(UserRole.Editor, UserRole.Admin)
  async create(@Body() dto: CreateBudgetProjectDto, @Request() req: any) {
    return this.budgetProjectsService.create(dto, req.user.sub);
  }

  @Get()
  async findAll(@Query() filters: BudgetProjectFiltersDto) {
    return this.budgetProjectsService.findAll(filters);
  }

  @Get(':id/table-data')
  async getTableData(@Param('id') id: string) {
    return this.budgetProjectsService.getTableData(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.budgetProjectsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.Editor, UserRole.Admin)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetProjectDto,
    @Request() req: any,
  ) {
    return this.budgetProjectsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.budgetProjectsService.delete(id, req.user.sub);
    return { message: 'Project deleted successfully' };
  }

  @Patch(':id/plan-row/:rowId')
  @Roles(UserRole.Editor, UserRole.Admin)
  async updatePlanRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdatePlanRowDto,
    @Request() req: any,
  ) {
    await this.budgetProjectsService.updatePlanRow(id, rowId, dto, req.user.sub);
    return { message: 'Plan row updated successfully' };
  }

  @Patch(':id/actual/:period')
  @Roles(UserRole.Editor, UserRole.Admin)
  async updateActual(
    @Param('id') id: string,
    @Param('period') period: string,
    @Body() dto: UpdateActualDto,
    @Request() req: any,
  ) {
    await this.budgetProjectsService.updateActual(id, period, dto, req.user.sub);
    return { message: 'Actual updated successfully' };
  }
}
