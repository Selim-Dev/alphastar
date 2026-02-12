import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BudgetImportService } from './budget-import.service';
import { BudgetTemplatesService } from './budget-templates.service';
import { BudgetProjectsService } from './budget-projects.service';
import { ExcelData } from '../utils/template-validator';

describe('BudgetImportService', () => {
  let service: BudgetImportService;
  let templatesService: BudgetTemplatesService;
  let projectsService: BudgetProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetImportService,
        BudgetTemplatesService,
        {
          provide: BudgetProjectsService,
          useValue: {
            findOne: jest.fn(),
            getTableData: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BudgetImportService>(BudgetImportService);
    templatesService = module.get<BudgetTemplatesService>(BudgetTemplatesService);
    projectsService = module.get<BudgetProjectsService>(BudgetProjectsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateExcelStructure', () => {
    it('should validate a valid RSAF template structure', async () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330',
          F: 'G650ER-1',
          G: 'G650ER-2',
          H: 'PMO',
          O: 'Jan 2025',
          P: 'Feb 2025',
        },
        rows: [
          {
            rowNumber: 4,
            cells: {
              D: 'Off Base Maintenance International - Scheduled',
              E: 100000,
              F: 50000,
              O: 5000,
              P: 6000,
            },
          },
        ],
      };

      const result = await service.validateExcelStructure(data, 'RSAF');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should throw BadRequestException for invalid structure', async () => {
      const data: ExcelData = {
        headers: {},
        rows: [],
      };

      await expect(service.validateExcelStructure(data, 'RSAF')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include detailed error messages in exception', async () => {
      const data: ExcelData = {
        headers: {},
        rows: [],
      };

      try {
        await service.validateExcelStructure(data, 'RSAF');
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = error.getResponse() as any;
        expect(response.message).toBe('Excel file validation failed');
        expect(response.errors).toBeDefined();
        expect(response.warnings).toBeDefined();
        expect(response.details).toBeDefined();
        expect(Array.isArray(response.details)).toBe(true);
      }
    });

    it('should validate missing term column', async () => {
      const data: ExcelData = {
        headers: {
          E: 'A330',
          F: 'G650ER-1',
        },
        rows: [
          {
            rowNumber: 4,
            cells: {
              E: 1000,
            },
          },
        ],
      };

      await expect(service.validateExcelStructure(data, 'RSAF')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate non-numeric values in amount columns', async () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330',
        },
        rows: [
          {
            rowNumber: 4,
            cells: {
              D: 'Test Term',
              E: 'invalid',
            },
          },
        ],
      };

      await expect(service.validateExcelStructure(data, 'RSAF')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate negative values in amount columns', async () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330',
        },
        rows: [
          {
            rowNumber: 4,
            cells: {
              D: 'Test Term',
              E: -1000,
            },
          },
        ],
      };

      await expect(service.validateExcelStructure(data, 'RSAF')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return warnings for non-critical issues', async () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330',
          F: 'G650ER-1',
          G: 'G650ER-2',
          H: 'PMO',
        },
        rows: [
          {
            rowNumber: 4,
            cells: {
              D: '', // Empty term cell (warning, not error)
              E: 1000,
            },
          },
          {
            rowNumber: 5,
            cells: {
              D: 'Valid Term',
              E: 2000,
            },
          },
        ],
      };

      const result = await service.validateExcelStructure(data, 'RSAF');

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle template not found', async () => {
      const data: ExcelData = {
        headers: { D: 'Term' },
        rows: [],
      };

      await expect(
        service.validateExcelStructure(data, 'INVALID_TEMPLATE'),
      ).rejects.toThrow();
    });
  });

  describe('parseExcelFile', () => {
    it('should parse a valid Excel file', async () => {
      // This test would require a real Excel file buffer
      // For now, we'll skip it as it requires integration testing
      expect(service.parseExcelFile).toBeDefined();
    });
  });

  describe('importData', () => {
    it('should import data from preview', async () => {
      // Mock project service
      jest.spyOn(projectsService, 'findOne').mockResolvedValue({
        _id: 'project-id',
        name: 'Test Project',
        templateType: 'RSAF',
        dateRange: { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
      } as any);

      const previewData = {
        projectId: 'project-id',
        templateType: 'RSAF',
        plannedAmounts: [],
        actualAmounts: [],
        summary: {
          totalPlannedRows: 0,
          totalActualRows: 0,
          totalPlannedAmount: 0,
          totalActualAmount: 0,
        },
      };

      const result = await service.importData('project-id', previewData, 'user-id');

      expect(result).toBeDefined();
      expect(result.planRowsCreated).toBeDefined();
      expect(result.actualsCreated).toBeDefined();
    });
  });
});
