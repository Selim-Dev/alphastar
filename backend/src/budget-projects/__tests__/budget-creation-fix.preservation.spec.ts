/**
 * Preservation Property Tests - Budget Table Data and Calculations
 *
 * These tests capture the CURRENT correct behavior of getTableData()
 * for valid inputs (projects with proper aircraft scope). They verify
 * that the baseline behavior is preserved after the bugfix.
 *
 * All tests should PASS on UNFIXED code — they confirm baseline behavior.
 *
 * **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { BudgetProjectsService } from '../services/budget-projects.service';
import { BudgetProjectRepository } from '../repositories/budget-project.repository';
import { BudgetPlanRowRepository } from '../repositories/budget-plan-row.repository';
import { BudgetActualRepository } from '../repositories/budget-actual.repository';
import { BudgetAuditLogRepository } from '../repositories/budget-audit-log.repository';
import { BudgetTemplatesService } from '../services/budget-templates.service';
import { AircraftService } from '../../aircraft/services/aircraft.service';
import fc from 'fast-check';

describe('Budget Creation Fix - Preservation Properties', () => {
  let service: BudgetProjectsService;
  let projectRepository: jest.Mocked<BudgetProjectRepository>;
  let planRowRepository: jest.Mocked<BudgetPlanRowRepository>;
  let actualRepository: jest.Mocked<BudgetActualRepository>;
  let auditLogRepository: jest.Mocked<BudgetAuditLogRepository>;
  let aircraftService: jest.Mocked<AircraftService>;

  const mockProjectId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId();

  /**
   * Helper: build a mock project document
   */
  function buildMockProject(startDate: Date, endDate: Date) {
    return {
      _id: new Types.ObjectId(mockProjectId),
      name: 'Test Budget Project',
      templateType: 'RSAF',
      dateRange: { start: startDate, end: endDate },
      currency: 'USD',
      aircraftScope: {
        type: 'individual' as const,
        aircraftIds: [new Types.ObjectId()],
      },
      status: 'active',
      createdBy: mockUserId,
    };
  }

  /**
   * Helper: build mock plan rows with given planned amounts
   */
  function buildMockPlanRows(
    amounts: number[],
    aircraftId?: Types.ObjectId,
  ) {
    return amounts.map((amount, i) => ({
      _id: new Types.ObjectId(),
      projectId: new Types.ObjectId(mockProjectId),
      termId: `term-${i}`,
      termName: `Term ${i}`,
      termCategory: `Category ${Math.floor(i / 3)}`,
      aircraftId: aircraftId,
      aircraftType: aircraftId ? 'A330' : undefined,
      plannedAmount: amount,
      toString: () => `term-${i}`,
    }));
  }

  /**
   * Helper: build mock actuals for given plan rows and periods
   */
  function buildMockActuals(
    termIds: string[],
    periods: string[],
    amountsMatrix: number[][],
    aircraftId?: Types.ObjectId,
  ) {
    const actuals: Array<{
      _id: Types.ObjectId;
      projectId: Types.ObjectId;
      termId: string;
      period: string;
      aircraftId?: Types.ObjectId;
      amount: number;
    }> = [];

    for (let t = 0; t < termIds.length; t++) {
      for (let p = 0; p < periods.length; p++) {
        const amount = amountsMatrix[t]?.[p] ?? 0;
        if (amount > 0) {
          actuals.push({
            _id: new Types.ObjectId(),
            projectId: new Types.ObjectId(mockProjectId),
            termId: termIds[t],
            period: periods[p],
            aircraftId: aircraftId,
            amount,
          });
        }
      }
    }

    return actuals;
  }

  beforeEach(async () => {
    projectRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      delete: jest.fn(),
      existsByName: jest.fn().mockResolvedValue(false),
      existsByNameExcludingId: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<BudgetProjectRepository>;

    planRowRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      findByProjectId: jest.fn().mockResolvedValue([]),
      findByProjectAndTerm: jest.fn(),
      update: jest.fn(),
      deleteByProjectId: jest.fn(),
      getTotalPlannedByProject: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<BudgetPlanRowRepository>;

    actualRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProjectId: jest.fn().mockResolvedValue([]),
      findByProjectAndPeriod: jest.fn().mockResolvedValue([]),
      findByProjectTermAndPeriod: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      deleteByProjectId: jest.fn(),
      getTotalSpentByProject: jest.fn().mockResolvedValue(0),
      getDistinctPeriodsByProject: jest.fn().mockResolvedValue([]),
      getActualsByTermAndPeriod: jest.fn().mockResolvedValue(new Map()),
    } as unknown as jest.Mocked<BudgetActualRepository>;

    auditLogRepository = {
      create: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      getSummary: jest.fn(),
      findByEntity: jest.fn().mockResolvedValue([]),
      deleteByProjectId: jest.fn(),
    } as unknown as jest.Mocked<BudgetAuditLogRepository>;

    aircraftService = {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn(),
      create: jest.fn(),
      findByRegistration: jest.fn(),
      update: jest.fn(),
      updateRegistration: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AircraftService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetProjectsService,
        { provide: BudgetProjectRepository, useValue: projectRepository },
        { provide: BudgetPlanRowRepository, useValue: planRowRepository },
        { provide: BudgetActualRepository, useValue: actualRepository },
        { provide: BudgetAuditLogRepository, useValue: auditLogRepository },
        { provide: BudgetTemplatesService, useValue: new BudgetTemplatesService() },
        { provide: AircraftService, useValue: aircraftService },
      ],
    }).compile();

    service = module.get<BudgetProjectsService>(BudgetProjectsService);
  });

  /**
   * Property 2.1: For any budget project with N plan rows,
   * getTableData() returns exactly N rows.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('should return exactly N rows for a project with N plan rows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }),
        async (rowCount) => {
          const project = buildMockProject(
            new Date('2025-01-01'),
            new Date('2025-06-30'),
          );
          projectRepository.findById.mockResolvedValue(project as never);

          const amounts = Array.from({ length: rowCount }, () =>
            Math.floor(Math.random() * 100000),
          );
          const planRows = buildMockPlanRows(amounts);
          planRowRepository.findByProjectId.mockResolvedValue(planRows as never);
          actualRepository.findByProjectId.mockResolvedValue([]);

          const result = await service.getTableData(mockProjectId);

          expect(result.rows).toHaveLength(rowCount);
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * Property 2.2: For any plan row, remaining = plannedAmount - totalSpent
   * and variance = remaining.
   *
   * **Validates: Requirements 3.2, 3.4**
   */
  it('should compute remaining = plannedAmount - totalSpent and variance = remaining for each row', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.nat({ max: 500000 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.nat({ max: 50000 }), { minLength: 1, maxLength: 10 }),
        async (plannedAmounts, spentPerRow) => {
          const rowCount = plannedAmounts.length;
          const project = buildMockProject(
            new Date('2025-01-01'),
            new Date('2025-03-31'),
          );
          projectRepository.findById.mockResolvedValue(project as never);

          const planRows = buildMockPlanRows(plannedAmounts);
          planRowRepository.findByProjectId.mockResolvedValue(planRows as never);

          // Create one actual per row in a single period
          const actuals = planRows.map((row, i) => ({
            _id: new Types.ObjectId(),
            projectId: new Types.ObjectId(mockProjectId),
            termId: row.termId,
            period: '2025-01',
            aircraftId: undefined,
            amount: spentPerRow[i % spentPerRow.length],
          }));
          actualRepository.findByProjectId.mockResolvedValue(actuals as never);

          const result = await service.getTableData(mockProjectId);

          for (let i = 0; i < rowCount; i++) {
            const row = result.rows[i];
            const expectedRemaining = row.plannedAmount - row.totalSpent;
            expect(row.remaining).toBe(expectedRemaining);
            expect(row.variance).toBe(row.remaining);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * Property 2.3: For any plan row, variancePercent = (variance / plannedAmount) * 100
   * when plannedAmount > 0.
   *
   * **Validates: Requirements 3.2, 3.4**
   */
  it('should compute variancePercent = (variance / plannedAmount) * 100 when plannedAmount > 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 1, max: 500000 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.nat({ max: 50000 }), { minLength: 1, maxLength: 10 }),
        async (plannedAmounts, spentPerRow) => {
          // All plannedAmounts > 0 guaranteed by min: 1
          const rowCount = plannedAmounts.length;
          const project = buildMockProject(
            new Date('2025-01-01'),
            new Date('2025-03-31'),
          );
          projectRepository.findById.mockResolvedValue(project as never);

          const planRows = buildMockPlanRows(plannedAmounts);
          planRowRepository.findByProjectId.mockResolvedValue(planRows as never);

          const actuals = planRows.map((row, i) => ({
            _id: new Types.ObjectId(),
            projectId: new Types.ObjectId(mockProjectId),
            termId: row.termId,
            period: '2025-01',
            aircraftId: undefined,
            amount: spentPerRow[i % spentPerRow.length],
          }));
          actualRepository.findByProjectId.mockResolvedValue(actuals as never);

          const result = await service.getTableData(mockProjectId);

          for (let i = 0; i < rowCount; i++) {
            const row = result.rows[i];
            const expectedVariancePercent =
              (row.variance / row.plannedAmount) * 100;
            expect(row.variancePercent).toBeCloseTo(expectedVariancePercent, 5);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * Property 2.4: Grand total budgeted = sum(plannedAmount),
   * spent = sum(totalSpent), remaining = budgeted - spent.
   *
   * **Validates: Requirements 3.2, 3.5**
   */
  it('should compute grand totals: budgeted = sum(planned), spent = sum(totalSpent), remaining = budgeted - spent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.nat({ max: 500000 }), { minLength: 1, maxLength: 15 }),
        fc.array(fc.nat({ max: 50000 }), { minLength: 1, maxLength: 15 }),
        async (plannedAmounts, spentPerRow) => {
          const project = buildMockProject(
            new Date('2025-01-01'),
            new Date('2025-03-31'),
          );
          projectRepository.findById.mockResolvedValue(project as never);

          const planRows = buildMockPlanRows(plannedAmounts);
          planRowRepository.findByProjectId.mockResolvedValue(planRows as never);

          const actuals = planRows.map((row, i) => ({
            _id: new Types.ObjectId(),
            projectId: new Types.ObjectId(mockProjectId),
            termId: row.termId,
            period: '2025-02',
            aircraftId: undefined,
            amount: spentPerRow[i % spentPerRow.length],
          }));
          actualRepository.findByProjectId.mockResolvedValue(actuals as never);

          const result = await service.getTableData(mockProjectId);

          const expectedBudgeted = plannedAmounts.reduce((s, a) => s + a, 0);
          const expectedSpent = result.rows.reduce(
            (s: number, r: { totalSpent: number }) => s + r.totalSpent,
            0,
          );
          const expectedRemaining = expectedBudgeted - expectedSpent;

          expect(result.grandTotal.budgeted).toBe(expectedBudgeted);
          expect(result.grandTotal.spent).toBe(expectedSpent);
          expect(result.grandTotal.remaining).toBe(expectedRemaining);
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * Property 2.5: columnTotals[period] = sum(row.actuals[period]) for all rows.
   *
   * **Validates: Requirements 3.2, 3.5**
   */
  it('should compute columnTotals[period] = sum of all row actuals for that period', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 6 }),
        async (rowCount, periodCount) => {
          // Build a project with enough months
          const startDate = new Date('2025-01-01');
          const endDate = new Date(2025, periodCount, 0); // end of periodCount-th month
          const project = buildMockProject(startDate, endDate);
          projectRepository.findById.mockResolvedValue(project as never);

          const plannedAmounts = Array.from({ length: rowCount }, () => 100000);
          const planRows = buildMockPlanRows(plannedAmounts);
          planRowRepository.findByProjectId.mockResolvedValue(planRows as never);

          // Generate periods
          const periods: string[] = [];
          for (let m = 0; m < periodCount; m++) {
            const month = String(m + 1).padStart(2, '0');
            periods.push(`2025-${month}`);
          }

          // Build random actuals across rows and periods
          const allActuals: Array<{
            _id: Types.ObjectId;
            projectId: Types.ObjectId;
            termId: string;
            period: string;
            aircraftId: undefined;
            amount: number;
          }> = [];

          for (const row of planRows) {
            for (const period of periods) {
              const amount = Math.floor(Math.random() * 5000);
              if (amount > 0) {
                allActuals.push({
                  _id: new Types.ObjectId(),
                  projectId: new Types.ObjectId(mockProjectId),
                  termId: row.termId,
                  period,
                  aircraftId: undefined,
                  amount,
                });
              }
            }
          }
          actualRepository.findByProjectId.mockResolvedValue(allActuals as never);

          const result = await service.getTableData(mockProjectId);

          // Verify columnTotals for each period
          for (const period of periods) {
            const expectedTotal = result.rows.reduce(
              (sum: number, row: { actuals: Record<string, number> }) =>
                sum + (row.actuals[period] || 0),
              0,
            );
            expect(result.columnTotals[period]).toBe(expectedTotal);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  /**
   * Edge case: variancePercent = 0 when plannedAmount = 0
   *
   * **Validates: Requirements 3.2**
   */
  it('should return variancePercent = 0 when plannedAmount is 0', async () => {
    const project = buildMockProject(
      new Date('2025-01-01'),
      new Date('2025-03-31'),
    );
    projectRepository.findById.mockResolvedValue(project as never);

    const planRows = buildMockPlanRows([0, 0, 0]);
    planRowRepository.findByProjectId.mockResolvedValue(planRows as never);
    actualRepository.findByProjectId.mockResolvedValue([]);

    const result = await service.getTableData(mockProjectId);

    for (const row of result.rows) {
      expect(row.variancePercent).toBe(0);
    }
  });
});
