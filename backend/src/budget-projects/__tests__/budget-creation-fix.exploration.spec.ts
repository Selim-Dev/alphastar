/**
 * Bug Condition Exploration Test
 *
 * This test demonstrates the bug where budget project creation fails
 * when column names are not aircraft in the master data (e.g., "PMO",
 * "G650ER-1", "G650ER-2").
 *
 * The current code uses:
 * - @IsMongoId() validation on aircraftIds in AircraftScopeDto
 * - resolveAircraftScope() which queries the aircraft collection
 * - generatePlanRows() which depends on resolved aircraft IDs
 *
 * These tests encode the EXPECTED (fixed) behavior. They WILL FAIL on
 * unfixed code, confirming the bug exists.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
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
import { RSAF_SPENDING_TERMS } from '../templates/spending-terms.registry';

describe('Budget Creation Fix - Bug Condition Exploration', () => {
  let service: BudgetProjectsService;
  let projectRepository: jest.Mocked<BudgetProjectRepository>;
  let planRowRepository: jest.Mocked<BudgetPlanRowRepository>;
  let actualRepository: jest.Mocked<BudgetActualRepository>;
  let auditLogRepository: jest.Mocked<BudgetAuditLogRepository>;
  let templatesService: BudgetTemplatesService;
  let aircraftService: jest.Mocked<AircraftService>;

  const mockUserId = new Types.ObjectId().toString();
  const mockProjectId = new Types.ObjectId();
  const RSAF_TERM_COUNT = RSAF_SPENDING_TERMS.length; // 65 terms

  beforeEach(async () => {
    const mockProjectDoc = {
      _id: mockProjectId,
      name: 'RSAF FY2025 Budget',
      templateType: 'RSAF',
      dateRange: {
        start: new Date('2025-04-01'),
        end: new Date('2028-03-31'),
      },
      currency: 'USD',
      status: 'draft',
      createdBy: new Types.ObjectId(mockUserId),
    };

    projectRepository = {
      create: jest.fn().mockResolvedValue(mockProjectDoc),
      findById: jest.fn().mockResolvedValue(null),
      findByName: jest.fn().mockResolvedValue(null),
      findAll: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(null),
      existsByName: jest.fn().mockResolvedValue(false),
      existsByNameExcludingId: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<BudgetProjectRepository>;

    const createdRows: unknown[] = [];
    planRowRepository = {
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockImplementation((rows: unknown[]) => {
        createdRows.push(...rows);
        return Promise.resolve(rows);
      }),
      findById: jest.fn().mockResolvedValue(null),
      findByProjectId: jest.fn().mockResolvedValue([]),
      findByProjectAndTerm: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      deleteByProjectId: jest.fn().mockResolvedValue(undefined),
      getTotalPlannedByProject: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<BudgetPlanRowRepository>;

    actualRepository = {
      create: jest.fn().mockResolvedValue({}),
      findById: jest.fn().mockResolvedValue(null),
      findByProjectId: jest.fn().mockResolvedValue([]),
      findByProjectAndPeriod: jest.fn().mockResolvedValue([]),
      findByProjectTermAndPeriod: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
      deleteByProjectId: jest.fn().mockResolvedValue(undefined),
      getTotalSpentByProject: jest.fn().mockResolvedValue(0),
      getDistinctPeriodsByProject: jest.fn().mockResolvedValue([]),
      getActualsByTermAndPeriod: jest.fn().mockResolvedValue(new Map()),
    } as unknown as jest.Mocked<BudgetActualRepository>;

    auditLogRepository = {
      create: jest.fn().mockResolvedValue({}),
      findAll: jest.fn().mockResolvedValue([]),
      getSummary: jest.fn().mockResolvedValue({}),
      findByEntity: jest.fn().mockResolvedValue([]),
      deleteByProjectId: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<BudgetAuditLogRepository>;

    // Use the real templates service — it has no DB dependencies
    templatesService = new BudgetTemplatesService();

    // Aircraft service mock — returns empty results for non-aircraft queries
    aircraftService = {
      findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      findById: jest.fn().mockRejectedValue(
        new Error('Aircraft not found'),
      ),
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
        { provide: BudgetTemplatesService, useValue: templatesService },
        { provide: AircraftService, useValue: aircraftService },
      ],
    }).compile();

    service = module.get<BudgetProjectsService>(BudgetProjectsService);
  });

  /**
   * Test Case 1: PMO is not an aircraft type
   *
   * Bug: aircraftScope type "type" with aircraftTypes ["PMO"] resolves to
   * zero aircraft because "PMO" is not in the aircraft collection.
   * generatePlanRows then creates a flat structure (65 rows) instead of
   * 65 × 1 = 65 column-associated rows.
   *
   * Expected (fixed): The system should accept "PMO" as a column name
   * and create 65 plan rows with columnName="PMO".
   *
   * On UNFIXED code: This test FAILS because resolveAircraftScope returns
   * empty array for "PMO", and plan rows are created without column association.
   */
  it('should create a project with non-aircraft column name "PMO" and generate correct plan rows', async () => {
    const dto = {
      name: 'PMO Budget Test',
      templateType: 'RSAF',
      dateRange: { start: '2025-04-01', end: '2028-03-31' },
      currency: 'USD',
      // Fixed: using columnNames instead of aircraftScope
      columnNames: ['PMO'],
    };

    const result = await service.create(dto, mockUserId);

    // Verify project was created
    expect(result).toBeDefined();
    expect(projectRepository.create).toHaveBeenCalled();

    // EXPECTED BEHAVIOR: 65 terms × 1 column = 65 plan rows WITH column association
    expect(planRowRepository.createMany).toHaveBeenCalledTimes(1);
    const createdRows = planRowRepository.createMany.mock.calls[0][0];

    // The key assertion: we expect 65 rows, each associated with the "PMO" column
    expect(createdRows).toHaveLength(RSAF_TERM_COUNT);

    // Each row should have a column identifier (columnName or aircraftType)
    // On unfixed code: rows are created WITHOUT any column association because
    // resolveAircraftScope returns [] for "PMO", so generatePlanRows creates
    // flat rows without aircraftId/aircraftType
    const rowsWithColumnAssociation = createdRows.filter(
      (row: Record<string, unknown>) =>
        row.columnName === 'PMO' || row.aircraftType === 'PMO',
    );
    expect(rowsWithColumnAssociation).toHaveLength(RSAF_TERM_COUNT);
  });

  /**
   * Test Case 2: Custom labels "G650ER-1" and "G650ER-2" are not aircraft types
   *
   * Bug: aircraftScope type "type" with aircraftTypes ["G650ER-1", "G650ER-2"]
   * resolves to zero aircraft because these custom labels don't match any
   * aircraftType in the master data (the actual type is "Gulfstream G650ER").
   *
   * Expected (fixed): The system should accept these as column names and
   * create 65 × 2 = 130 plan rows, each associated with the correct column.
   *
   * On UNFIXED code: This test FAILS because resolveAircraftScope returns
   * empty array, and plan rows are created as flat structure (65 rows, no columns).
   */
  it('should create a project with custom labels "G650ER-1" and "G650ER-2" and generate correct plan rows', async () => {
    const dto = {
      name: 'G650ER Split Budget Test',
      templateType: 'RSAF',
      dateRange: { start: '2025-04-01', end: '2028-03-31' },
      currency: 'USD',
      // Fixed: using columnNames instead of aircraftScope
      columnNames: ['G650ER-1', 'G650ER-2'],
    };

    const result = await service.create(dto, mockUserId);

    expect(result).toBeDefined();
    expect(planRowRepository.createMany).toHaveBeenCalledTimes(1);
    const createdRows = planRowRepository.createMany.mock.calls[0][0];

    // EXPECTED BEHAVIOR: 65 terms × 2 columns = 130 plan rows
    expect(createdRows).toHaveLength(RSAF_TERM_COUNT * 2);

    // Each row should be associated with either "G650ER-1" or "G650ER-2"
    const g650er1Rows = createdRows.filter(
      (row: Record<string, unknown>) =>
        row.columnName === 'G650ER-1' || row.aircraftType === 'G650ER-1',
    );
    const g650er2Rows = createdRows.filter(
      (row: Record<string, unknown>) =>
        row.columnName === 'G650ER-2' || row.aircraftType === 'G650ER-2',
    );

    expect(g650er1Rows).toHaveLength(RSAF_TERM_COUNT);
    expect(g650er2Rows).toHaveLength(RSAF_TERM_COUNT);
  });

  /**
   * Test Case 3: "PMO" is not a valid MongoId
   *
   * Bug: aircraftScope type "individual" with aircraftIds ["PMO"] fails
   * DTO validation because @IsMongoId() rejects "PMO" as an invalid ObjectId.
   * The request never reaches the service layer.
   *
   * Expected (fixed): The system should accept "PMO" as a column name
   * (not requiring it to be a MongoId) and create the project successfully.
   *
   * On UNFIXED code: This test FAILS because the DTO validation rejects
   * "PMO" before the service is called. In a unit test calling the service
   * directly, aircraftService.findById('PMO') throws BadRequestException
   * because 'PMO' is not a valid ObjectId.
   */
  it('should create a project with non-MongoId column name "PMO" via individual scope', async () => {
    const dto = {
      name: 'PMO Individual Scope Test',
      templateType: 'RSAF',
      dateRange: { start: '2025-04-01', end: '2028-03-31' },
      currency: 'USD',
      // Fixed: using columnNames instead of aircraftScope with individual IDs
      columnNames: ['PMO'],
    };

    // On UNFIXED code: this will throw because resolveAircraftScope calls
    // aircraftService.findById('PMO') which throws (PMO is not a valid ObjectId)
    // On FIXED code: this should succeed with columnNames approach
    const result = await service.create(dto, mockUserId);

    expect(result).toBeDefined();
    expect(planRowRepository.createMany).toHaveBeenCalledTimes(1);
    const createdRows = planRowRepository.createMany.mock.calls[0][0];

    // EXPECTED BEHAVIOR: 65 terms × 1 column = 65 plan rows with "PMO" association
    expect(createdRows).toHaveLength(RSAF_TERM_COUNT);

    const pmoRows = createdRows.filter(
      (row: Record<string, unknown>) =>
        row.columnName === 'PMO' || row.aircraftType === 'PMO',
    );
    expect(pmoRows).toHaveLength(RSAF_TERM_COUNT);
  });
});
