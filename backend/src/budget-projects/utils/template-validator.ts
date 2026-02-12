import { BudgetTemplate } from '../templates/spending-terms.registry';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  type: 'missing_column' | 'invalid_header' | 'invalid_structure' | 'missing_data' | 'invalid_value';
  message: string;
  location?: string; // e.g., "Row 5, Column D"
  expected?: string;
  actual?: string;
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  type: 'empty_cell' | 'unexpected_format' | 'data_quality';
  message: string;
  location?: string;
}

/**
 * Excel data structure interface
 */
export interface ExcelData {
  headers: Record<string, string>; // Column letter -> header value
  rows: ExcelRow[];
  metadata?: {
    sheetName?: string;
    rowCount?: number;
    columnCount?: number;
  };
}

/**
 * Excel row interface
 */
export interface ExcelRow {
  rowNumber: number;
  cells: Record<string, any>; // Column letter -> cell value
}

/**
 * Validates Excel file structure against RSAF template
 * 
 * Requirements: 7.2, 11.6
 * 
 * @param data - Parsed Excel data
 * @param template - Budget template definition
 * @returns Validation result with errors and warnings
 */
export function validateTemplateStructure(
  data: ExcelData,
  template: BudgetTemplate,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate header row exists
  if (!data.headers || Object.keys(data.headers).length === 0) {
    errors.push({
      type: 'invalid_structure',
      message: 'Header row not found or empty',
      location: `Row ${template.excelStructure.headerRow}`,
    });
    return { isValid: false, errors, warnings };
  }

  // Validate term column exists
  const termColumn = template.excelStructure.termColumn;
  if (!data.headers[termColumn]) {
    errors.push({
      type: 'missing_column',
      message: 'Term/Clause column not found',
      location: `Column ${termColumn}`,
      expected: 'Clause description column',
      actual: 'Column not found or empty',
    });
  }

  // Validate planned columns exist
  const plannedColumns = template.excelStructure.plannedColumns;
  for (const col of plannedColumns) {
    if (!data.headers[col]) {
      warnings.push({
        type: 'unexpected_format',
        message: `Planned amount column not found: ${col}`,
        location: `Column ${col}`,
      });
    }
  }

  // Validate actual columns exist
  const actualColumns = template.excelStructure.actualColumns;
  let missingActualColumns = 0;
  for (const col of actualColumns) {
    if (!data.headers[col]) {
      missingActualColumns++;
    }
  }

  // Allow some missing actual columns (they might be for future months)
  // But warn if more than 50% are missing
  if (missingActualColumns > actualColumns.length * 0.5) {
    warnings.push({
      type: 'data_quality',
      message: `Many actual columns are missing (${missingActualColumns}/${actualColumns.length})`,
      location: 'Actual columns section',
    });
  }

  // Validate data rows
  if (!data.rows || data.rows.length === 0) {
    errors.push({
      type: 'missing_data',
      message: 'No data rows found in Excel file',
      location: `After row ${template.excelStructure.headerRow}`,
    });
  } else {
    // Validate each row has term column populated
    let emptyTermCount = 0;
    for (const row of data.rows) {
      const termValue = row.cells[termColumn];
      if (!termValue || String(termValue).trim() === '') {
        emptyTermCount++;
      }
    }

    if (emptyTermCount === data.rows.length) {
      errors.push({
        type: 'missing_data',
        message: 'All term/clause cells are empty',
        location: `Column ${termColumn}`,
      });
    } else if (emptyTermCount > 0) {
      warnings.push({
        type: 'empty_cell',
        message: `${emptyTermCount} rows have empty term/clause values`,
        location: `Column ${termColumn}`,
      });
    }
  }

  // Validate numeric values in planned and actual columns
  const numericColumns = [...plannedColumns, ...actualColumns];
  for (const row of data.rows) {
    for (const col of numericColumns) {
      const value = row.cells[col];
      if (value !== null && value !== undefined && value !== '') {
        // Check if value is numeric or can be converted to number
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors.push({
            type: 'invalid_value',
            message: 'Non-numeric value found in amount column',
            location: `Row ${row.rowNumber}, Column ${col}`,
            expected: 'Numeric value',
            actual: String(value),
          });
        } else if (numValue < 0) {
          errors.push({
            type: 'invalid_value',
            message: 'Negative value found in amount column',
            location: `Row ${row.rowNumber}, Column ${col}`,
            expected: 'Non-negative number',
            actual: String(value),
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that required columns are present in the Excel file
 * 
 * @param headers - Column headers from Excel file
 * @param template - Budget template definition
 * @returns Array of missing column identifiers
 */
export function validateRequiredColumns(
  headers: Record<string, string>,
  template: BudgetTemplate,
): string[] {
  const missingColumns: string[] = [];

  // Check term column
  if (!headers[template.excelStructure.termColumn]) {
    missingColumns.push(template.excelStructure.termColumn);
  }

  // Check planned columns (all required)
  for (const col of template.excelStructure.plannedColumns) {
    if (!headers[col]) {
      missingColumns.push(col);
    }
  }

  return missingColumns;
}

/**
 * Validates a single cell value based on expected type
 * 
 * @param value - Cell value to validate
 * @param expectedType - Expected data type ('number', 'string', 'date')
 * @returns Validation error if invalid, null if valid
 */
export function validateCellValue(
  value: any,
  expectedType: 'number' | 'string' | 'date',
  location: string,
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    // Empty cells are allowed
    return null;
  }

  switch (expectedType) {
    case 'number': {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return {
          type: 'invalid_value',
          message: 'Expected numeric value',
          location,
          expected: 'Number',
          actual: String(value),
        };
      }
      if (numValue < 0) {
        return {
          type: 'invalid_value',
          message: 'Negative values not allowed',
          location,
          expected: 'Non-negative number',
          actual: String(value),
        };
      }
      return null;
    }

    case 'string': {
      if (typeof value !== 'string') {
        return {
          type: 'invalid_value',
          message: 'Expected text value',
          location,
          expected: 'String',
          actual: typeof value,
        };
      }
      return null;
    }

    case 'date': {
      // Check if value is a valid date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          type: 'invalid_value',
          message: 'Invalid date format',
          location,
          expected: 'Valid date (YYYY-MM, MM/YYYY, or Excel date)',
          actual: String(value),
        };
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Validates that spending terms in Excel match template terms
 * 
 * @param excelTerms - Array of term names from Excel file
 * @param templateTerms - Array of term names from template
 * @returns Validation result with unmatched terms
 */
export function validateSpendingTerms(
  excelTerms: string[],
  templateTerms: string[],
): {
  matched: string[];
  unmatched: string[];
  missing: string[];
} {
  const matched: string[] = [];
  const unmatched: string[] = [];
  const missing: string[] = [];

  // Normalize terms for comparison (lowercase, trim whitespace)
  const normalizedTemplateTerms = templateTerms.map((t) => t.toLowerCase().trim());
  const normalizedExcelTerms = excelTerms.map((t) => t.toLowerCase().trim());

  // Find matched and unmatched terms from Excel
  for (let i = 0; i < excelTerms.length; i++) {
    const excelTerm = excelTerms[i];
    const normalizedExcelTerm = normalizedExcelTerms[i];

    if (normalizedTemplateTerms.includes(normalizedExcelTerm)) {
      matched.push(excelTerm);
    } else {
      unmatched.push(excelTerm);
    }
  }

  // Find missing terms from template
  for (let i = 0; i < templateTerms.length; i++) {
    const templateTerm = templateTerms[i];
    const normalizedTemplateTerm = normalizedTemplateTerms[i];

    if (!normalizedExcelTerms.includes(normalizedTemplateTerm)) {
      missing.push(templateTerm);
    }
  }

  return { matched, unmatched, missing };
}

/**
 * Validates date format in period columns
 * Supports: YYYY-MM, MM/YYYY, Excel date serial numbers
 * 
 * @param value - Date value to validate
 * @param location - Cell location for error reporting
 * @returns Validation error if invalid, null if valid
 */
export function validateDateFormat(
  value: any,
  location: string,
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Check for YYYY-MM format
  const yyyymmPattern = /^\d{4}-\d{2}$/;
  if (yyyymmPattern.test(String(value))) {
    return null;
  }

  // Check for MM/YYYY format
  const mmyyyyPattern = /^\d{2}\/\d{4}$/;
  if (mmyyyyPattern.test(String(value))) {
    return null;
  }

  // Check for Excel date serial number (number between 1 and 100000)
  const numValue = Number(value);
  if (!isNaN(numValue) && numValue >= 1 && numValue <= 100000) {
    return null;
  }

  // Check if it's a valid Date object
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return null;
  }

  return {
    type: 'invalid_value',
    message: 'Invalid date format',
    location,
    expected: 'YYYY-MM, MM/YYYY, or Excel date serial number',
    actual: String(value),
  };
}

/**
 * Validates that the Excel file has the expected structure for RSAF template
 * Checks for:
 * - Header row at correct position
 * - Term column in correct position
 * - Planned columns (aircraft columns)
 * - Actual columns (monthly columns)
 * 
 * @param data - Parsed Excel data
 * @param template - Budget template definition
 * @returns Detailed validation result
 */
export function validateRSAFTemplateStructure(
  data: ExcelData,
  template: BudgetTemplate,
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate this is RSAF template
  if (template.type !== 'RSAF') {
    errors.push({
      type: 'invalid_structure',
      message: 'Template type mismatch',
      expected: 'RSAF',
      actual: template.type,
    });
    return { isValid: false, errors, warnings };
  }

  // Perform general structure validation
  const generalValidation = validateTemplateStructure(data, template);
  errors.push(...generalValidation.errors);
  warnings.push(...generalValidation.warnings);

  // RSAF-specific validations
  // Check for expected header structure
  const expectedHeaderRow = template.excelStructure.headerRow;
  if (data.metadata?.rowCount && data.metadata.rowCount < expectedHeaderRow) {
    errors.push({
      type: 'invalid_structure',
      message: `File has fewer rows than expected header row`,
      location: `Expected header at row ${expectedHeaderRow}`,
      expected: `At least ${expectedHeaderRow} rows`,
      actual: `${data.metadata.rowCount} rows`,
    });
  }

  // Check for expected aircraft columns (planned columns)
  const expectedAircraftColumns = ['A330', 'G650ER-1', 'G650ER-2', 'PMO'];
  const plannedColumns = template.excelStructure.plannedColumns;
  
  for (let i = 0; i < plannedColumns.length; i++) {
    const col = plannedColumns[i];
    const header = data.headers[col];
    
    if (header) {
      // Check if header contains expected aircraft name
      const expectedAircraft = expectedAircraftColumns[i];
      if (!header.includes(expectedAircraft)) {
        warnings.push({
          type: 'unexpected_format',
          message: `Aircraft column header doesn't match expected format`,
          location: `Column ${col}`,
        });
      }
    }
  }

  // Check for 36 actual columns (3 years × 12 months)
  const actualColumns = template.excelStructure.actualColumns;
  if (actualColumns.length !== 36) {
    warnings.push({
      type: 'data_quality',
      message: `Expected 36 monthly columns (3 years), found ${actualColumns.length}`,
      location: 'Actual columns section',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
