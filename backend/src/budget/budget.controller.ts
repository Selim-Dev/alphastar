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
import { BudgetService } from './services/budget.service';
import { CreateBudgetPlanDto } from './dto/create-budget-plan.dto';
import { UpdateBudgetPlanDto } from './dto/update-budget-plan.dto';
import { CreateActualSpendDto } from './dto/create-actual-spend.dto';
import { UpdateActualSpendDto } from './dto/update-actual-spend.dto';
import { CloneBudgetPlanDto, CloneBudgetPlanResponseDto } from './dto/clone-budget-plan.dto';
import {
  FilterBudgetPlanDto,
  FilterActualSpendDto,
  BudgetAnalyticsQueryDto,
  BurnRateQueryDto,
} from './dto/filter-budget.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth';
import { UserRole } from '../auth/schemas/user.schema';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@ApiTags('Budget')
@Controller('budget')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // ==================== Budget Plan Endpoints ====================

  @Post('plans')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Create a new budget plan' })
  @ApiResponse({ status: 201, description: 'Budget plan created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Budget plan already exists' })
  async createBudgetPlan(@Body() createDto: CreateBudgetPlanDto) {
    return this.budgetService.createBudgetPlan(createDto);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all budget plans with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of budget plans' })
  async findAllBudgetPlans(@Query() filter: FilterBudgetPlanDto) {
    return this.budgetService.findAllBudgetPlans(filter);
  }

  @Get('plans/clauses')
  @ApiOperation({ summary: 'Get distinct budget clauses' })
  @ApiResponse({ status: 200, description: 'Returns list of distinct clauses' })
  async getDistinctClauses(@Query('fiscalYear') fiscalYear?: number) {
    const clauses = await this.budgetService.getDistinctClauses(fiscalYear);
    return { clauses };
  }

  @Get('plans/aircraft-groups')
  @ApiOperation({ summary: 'Get distinct aircraft groups from budget plans' })
  @ApiResponse({ status: 200, description: 'Returns list of aircraft groups' })
  async getDistinctAircraftGroups(@Query('fiscalYear') fiscalYear?: number) {
    const aircraftGroups = await this.budgetService.getDistinctAircraftGroups(fiscalYear);
    return { aircraftGroups };
  }

  @Get('plans/available-years')
  @ApiOperation({ summary: 'Get fiscal years that have budget plans' })
  @ApiResponse({ status: 200, description: 'Returns list of available fiscal years' })
  async getAvailableYears() {
    const years = await this.budgetService.getAvailableYears();
    return { years };
  }

  @Post('plans/clone')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Clone budget plans from one fiscal year to another' })
  @ApiResponse({ status: 201, description: 'Budget plans cloned successfully', type: CloneBudgetPlanResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or no source plans found' })
  async cloneBudgetPlans(@Body() cloneDto: CloneBudgetPlanDto): Promise<CloneBudgetPlanResponseDto> {
    return this.budgetService.cloneBudgetPlans(
      cloneDto.sourceYear,
      cloneDto.targetYear,
      cloneDto.adjustmentPercentage ?? 0,
    );
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get budget plan by ID' })
  @ApiParam({ name: 'id', description: 'Budget plan ID' })
  @ApiResponse({ status: 200, description: 'Returns the budget plan' })
  @ApiResponse({ status: 404, description: 'Budget plan not found' })
  async findBudgetPlanById(@Param('id') id: string) {
    return this.budgetService.findBudgetPlanById(id);
  }

  @Put('plans/:id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update budget plan by ID' })
  @ApiParam({ name: 'id', description: 'Budget plan ID' })
  @ApiResponse({ status: 200, description: 'Budget plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Budget plan not found' })
  async updateBudgetPlan(
    @Param('id') id: string,
    @Body() updateDto: UpdateBudgetPlanDto,
  ) {
    return this.budgetService.updateBudgetPlan(id, updateDto);
  }

  @Delete('plans/:id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete budget plan by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Budget plan ID' })
  @ApiResponse({ status: 204, description: 'Budget plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Budget plan not found' })
  async deleteBudgetPlan(@Param('id') id: string) {
    await this.budgetService.deleteBudgetPlan(id);
  }

  // ==================== Actual Spend Endpoints ====================

  @Post('actual-spend')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Record actual spend' })
  @ApiResponse({ status: 201, description: 'Actual spend recorded successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createActualSpend(
    @Body() createDto: CreateActualSpendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.budgetService.createActualSpend(createDto, user.id);
  }

  @Get('actual-spend')
  @ApiOperation({ summary: 'Get all actual spend records with optional filtering' })
  @ApiResponse({ status: 200, description: 'Returns list of actual spend records' })
  async findAllActualSpend(@Query() filter: FilterActualSpendDto) {
    return this.budgetService.findAllActualSpend(filter);
  }

  @Get('actual-spend/:id')
  @ApiOperation({ summary: 'Get actual spend by ID' })
  @ApiParam({ name: 'id', description: 'Actual spend ID' })
  @ApiResponse({ status: 200, description: 'Returns the actual spend record' })
  @ApiResponse({ status: 404, description: 'Actual spend not found' })
  async findActualSpendById(@Param('id') id: string) {
    return this.budgetService.findActualSpendById(id);
  }

  @Put('actual-spend/:id')
  @Roles(UserRole.Admin, UserRole.Editor)
  @ApiOperation({ summary: 'Update actual spend by ID' })
  @ApiParam({ name: 'id', description: 'Actual spend ID' })
  @ApiResponse({ status: 200, description: 'Actual spend updated successfully' })
  @ApiResponse({ status: 404, description: 'Actual spend not found' })
  async updateActualSpend(
    @Param('id') id: string,
    @Body() updateDto: UpdateActualSpendDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.budgetService.updateActualSpend(id, updateDto, user.id);
  }

  @Delete('actual-spend/:id')
  @Roles(UserRole.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete actual spend by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Actual spend ID' })
  @ApiResponse({ status: 204, description: 'Actual spend deleted successfully' })
  @ApiResponse({ status: 404, description: 'Actual spend not found' })
  async deleteActualSpend(@Param('id') id: string) {
    await this.budgetService.deleteActualSpend(id);
  }

  // ==================== Analytics Endpoints ====================

  @Get('analytics/variance')
  @ApiOperation({ summary: 'Get budget variance (planned vs actual)' })
  @ApiResponse({ status: 200, description: 'Returns budget variance analysis' })
  async getBudgetVariance(@Query() query: BudgetAnalyticsQueryDto) {
    const fiscalYear = query.fiscalYear || new Date().getFullYear();
    return this.budgetService.getBudgetVariance(
      fiscalYear,
      query.clauseId,
      query.aircraftGroup,
    );
  }

  @Get('analytics/burn-rate')
  @ApiOperation({ summary: 'Get budget burn rate and projections' })
  @ApiResponse({ status: 200, description: 'Returns burn rate analysis' })
  async getBurnRate(@Query() query: BurnRateQueryDto) {
    const fiscalYear = query.fiscalYear || new Date().getFullYear();
    return this.budgetService.getBurnRate(fiscalYear, query.aircraftGroup);
  }

  @Get('analytics/spend-by-period')
  @ApiOperation({ summary: 'Get spend breakdown by period' })
  @ApiResponse({ status: 200, description: 'Returns spend by period' })
  async getSpendByPeriod(@Query() query: FilterActualSpendDto) {
    return this.budgetService.getSpendByPeriod(
      query.startPeriod,
      query.endPeriod,
      query.aircraftGroup,
    );
  }

  @Get('analytics/spend-by-group')
  @ApiOperation({ summary: 'Get spend breakdown by aircraft group' })
  @ApiResponse({ status: 200, description: 'Returns spend by aircraft group' })
  async getSpendByAircraftGroup(@Query() query: BudgetAnalyticsQueryDto) {
    return this.budgetService.getSpendByAircraftGroup(
      query.fiscalYear,
      undefined,
      undefined,
    );
  }
}
