/**
 * Budget Projects Utilities
 * 
 * This module exports utility functions for budget project operations,
 * including template validation for Excel imports.
 */

export {
  validateTemplateStructure,
  validateRequiredColumns,
  validateCellValue,
  validateSpendingTerms,
  validateDateFormat,
  validateRSAFTemplateStructure,
} from './template-validator';

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ExcelData,
  ExcelRow,
} from './template-validator';
