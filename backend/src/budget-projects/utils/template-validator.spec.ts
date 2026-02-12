import {
  validateTemplateStructure,
  validateRequiredColumns,
  validateCellValue,
  validateSpendingTerms,
  validateDateFormat,
  validateRSAFTemplateStructure,
  ExcelData,
  ValidationError,
} from './template-validator';
import { RSAF_TEMPLATE, BudgetTemplate } from '../templates/spending-terms.registry';

describe('Template Validator', () => {
  describe('validateTemplateStructure', () => {
    it('should validate a valid RSAF template structure', () => {
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
          {
            rowNumber: 5,
            cells: {
              D: 'Scheduled Maintenance - A Check',
              E: 80000,
              F: 40000,
              O: 4000,
              P: 5000,
            },
          },
        ],
      };

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing header row', () => {
      const data: ExcelData = {
        headers: {},
        rows: [],
      };

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_structure');
      expect(result.errors[0].message).toContain('Header row not found');
    });

    it('should detect missing term column', () => {
      const data: ExcelData = {
        headers: {
          E: 'A330',
          F: 'G650ER-1',
        },
        rows: [],
      };

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'missing_column')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('Term/Clause column'))).toBe(true);
    });

    it('should detect missing data rows', () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330',
        },
        rows: [],
      };

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'missing_data')).toBe(true);
    });

    it('should detect non-numeric values in amount columns', () => {
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

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'invalid_value')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('Non-numeric'))).toBe(true);
    });

    it('should detect negative values in amount columns', () => {
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

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'invalid_value')).toBe(true);
      expect(result.errors.some((e) => e.message.includes('Negative'))).toBe(true);
    });

    it('should warn about empty term cells', () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330',
        },
        rows: [
          {
            rowNumber: 4,
            cells: {
              D: '',
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

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.warnings.some((w) => w.type === 'empty_cell')).toBe(true);
      expect(result.warnings.some((w) => w.message.includes('empty term'))).toBe(true);
    });

    it('should allow empty cells in amount columns', () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330',
          F: 'G650ER-1',
        },
        rows: [
          {
            rowNumber: 4,
            cells: {
              D: 'Test Term',
              E: 1000,
              F: '', // Empty cell is allowed
            },
          },
        ],
      };

      const result = validateTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRequiredColumns', () => {
    it('should return empty array for valid headers', () => {
      const headers = {
        D: 'Clause Description',
        E: 'A330',
        F: 'G650ER-1',
        G: 'G650ER-2',
        H: 'PMO',
      };

      const missing = validateRequiredColumns(headers, RSAF_TEMPLATE);

      expect(missing).toHaveLength(0);
    });

    it('should detect missing term column', () => {
      const headers = {
        E: 'A330',
        F: 'G650ER-1',
      };

      const missing = validateRequiredColumns(headers, RSAF_TEMPLATE);

      expect(missing).toContain('D');
    });

    it('should detect missing planned columns', () => {
      const headers = {
        D: 'Clause Description',
        E: 'A330',
        // Missing F, G, H
      };

      const missing = validateRequiredColumns(headers, RSAF_TEMPLATE);

      expect(missing).toContain('F');
      expect(missing).toContain('G');
      expect(missing).toContain('H');
    });
  });

  describe('validateCellValue', () => {
    it('should validate numeric values', () => {
      expect(validateCellValue(1000, 'number', 'A1')).toBeNull();
      expect(validateCellValue(0, 'number', 'A1')).toBeNull();
      expect(validateCellValue('1000', 'number', 'A1')).toBeNull();
    });

    it('should reject non-numeric values for number type', () => {
      const error = validateCellValue('abc', 'number', 'A1');
      expect(error).not.toBeNull();
      expect(error?.type).toBe('invalid_value');
    });

    it('should reject negative numbers', () => {
      const error = validateCellValue(-100, 'number', 'A1');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('Negative');
    });

    it('should allow empty cells', () => {
      expect(validateCellValue(null, 'number', 'A1')).toBeNull();
      expect(validateCellValue(undefined, 'number', 'A1')).toBeNull();
      expect(validateCellValue('', 'number', 'A1')).toBeNull();
    });

    it('should validate string values', () => {
      expect(validateCellValue('Test', 'string', 'A1')).toBeNull();
      expect(validateCellValue('', 'string', 'A1')).toBeNull();
    });

    it('should validate date values', () => {
      expect(validateCellValue('2025-01', 'date', 'A1')).toBeNull();
      expect(validateCellValue('2025-01-15', 'date', 'A1')).toBeNull();
      expect(validateCellValue(new Date(), 'date', 'A1')).toBeNull();
    });

    it('should reject invalid dates', () => {
      const error = validateCellValue('invalid-date', 'date', 'A1');
      expect(error).not.toBeNull();
      expect(error?.type).toBe('invalid_value');
    });
  });

  describe('validateSpendingTerms', () => {
    const templateTerms = [
      'Off Base Maintenance International - Scheduled',
      'Scheduled Maintenance - A Check',
      'Engines & APU Corporate Care Program',
    ];

    it('should match all terms correctly', () => {
      const excelTerms = [
        'Off Base Maintenance International - Scheduled',
        'Scheduled Maintenance - A Check',
        'Engines & APU Corporate Care Program',
      ];

      const result = validateSpendingTerms(excelTerms, templateTerms);

      expect(result.matched).toHaveLength(3);
      expect(result.unmatched).toHaveLength(0);
      expect(result.missing).toHaveLength(0);
    });

    it('should match terms case-insensitively', () => {
      const excelTerms = [
        'off base maintenance international - scheduled',
        'SCHEDULED MAINTENANCE - A CHECK',
      ];

      const result = validateSpendingTerms(excelTerms, templateTerms);

      expect(result.matched).toHaveLength(2);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should detect unmatched terms from Excel', () => {
      const excelTerms = [
        'Off Base Maintenance International - Scheduled',
        'Unknown Term',
      ];

      const result = validateSpendingTerms(excelTerms, templateTerms);

      expect(result.matched).toHaveLength(1);
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched[0]).toBe('Unknown Term');
    });

    it('should detect missing terms from template', () => {
      const excelTerms = [
        'Off Base Maintenance International - Scheduled',
      ];

      const result = validateSpendingTerms(excelTerms, templateTerms);

      expect(result.matched).toHaveLength(1);
      expect(result.missing).toHaveLength(2);
      expect(result.missing).toContain('Scheduled Maintenance - A Check');
      expect(result.missing).toContain('Engines & APU Corporate Care Program');
    });

    it('should handle whitespace in term names', () => {
      const excelTerms = [
        '  Off Base Maintenance International - Scheduled  ',
      ];

      const result = validateSpendingTerms(excelTerms, templateTerms);

      expect(result.matched).toHaveLength(1);
    });
  });

  describe('validateDateFormat', () => {
    it('should accept YYYY-MM format', () => {
      expect(validateDateFormat('2025-01', 'A1')).toBeNull();
      expect(validateDateFormat('2025-12', 'A1')).toBeNull();
    });

    it('should accept MM/YYYY format', () => {
      expect(validateDateFormat('01/2025', 'A1')).toBeNull();
      expect(validateDateFormat('12/2025', 'A1')).toBeNull();
    });

    it('should accept Excel date serial numbers', () => {
      expect(validateDateFormat(44927, 'A1')).toBeNull(); // Jan 1, 2023
      expect(validateDateFormat(45292, 'A1')).toBeNull(); // Jan 1, 2024
    });

    it('should accept Date objects', () => {
      expect(validateDateFormat(new Date('2025-01-15'), 'A1')).toBeNull();
    });

    it('should reject invalid date formats', () => {
      const error = validateDateFormat('invalid', 'A1');
      expect(error).not.toBeNull();
      expect(error?.type).toBe('invalid_value');
      expect(error?.message).toContain('Invalid date format');
    });

    it('should allow empty values', () => {
      expect(validateDateFormat(null, 'A1')).toBeNull();
      expect(validateDateFormat(undefined, 'A1')).toBeNull();
      expect(validateDateFormat('', 'A1')).toBeNull();
    });
  });

  describe('validateRSAFTemplateStructure', () => {
    it('should validate complete RSAF template', () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'A330 Planned',
          F: 'G650ER-1 Planned',
          G: 'G650ER-2 Planned',
          H: 'PMO Planned',
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
              G: 30000,
              H: 20000,
            },
          },
        ],
        metadata: {
          rowCount: 70,
          columnCount: 50,
        },
      };

      const result = validateRSAFTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(true);
    });

    it('should reject non-RSAF templates', () => {
      const customTemplate: BudgetTemplate = {
        type: 'CUSTOM',
        name: 'Custom Template',
        spendingTerms: [],
        excelStructure: {
          headerRow: 1,
          termColumn: 'A',
          plannedColumns: ['B'],
          actualColumns: ['C'],
        },
      };

      const data: ExcelData = {
        headers: { A: 'Term' },
        rows: [],
      };

      const result = validateRSAFTemplateStructure(data, customTemplate);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Template type mismatch'))).toBe(true);
    });

    it('should detect insufficient rows', () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
        },
        rows: [],
        metadata: {
          rowCount: 2, // Less than expected header row (3)
        },
      };

      const result = validateRSAFTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('fewer rows'))).toBe(true);
    });

    it('should warn about unexpected aircraft column headers', () => {
      const data: ExcelData = {
        headers: {
          D: 'Clause Description',
          E: 'Unknown Aircraft', // Should contain 'A330'
          F: 'G650ER-1',
          G: 'G650ER-2',
          H: 'PMO',
        },
        rows: [
          {
            rowNumber: 4,
            cells: { D: 'Test Term' },
          },
        ],
      };

      const result = validateRSAFTemplateStructure(data, RSAF_TEMPLATE);

      expect(result.warnings.some((w) => w.message.includes('Aircraft column header'))).toBe(true);
    });
  });
});
