import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ImportType } from '../schemas/import-log.schema';
import { ExcelTemplateService, TemplateColumn } from './excel-template.service';

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: string[];
  isValid: boolean;
}

export interface ParseResult {
  importType: ImportType;
  totalRows: number;
  validRows: ParsedRow[];
  invalidRows: ParsedRow[];
  allRows: ParsedRow[];
}

@Injectable()
export class ExcelParserService {
  constructor(private readonly templateService: ExcelTemplateService) {}

  /**
   * Parses an uploaded Excel file and validates rows against the template
   * Requirements: 10.2, 10.3
   */
  parseExcelFile(buffer: Buffer, importType: ImportType): ParseResult {
    const template = this.templateService.getTemplateDefinition(importType);
    if (!template) {
      throw new BadRequestException(`Unknown import type: ${importType}`);
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch {
      throw new BadRequestException('Invalid Excel file format');
    }

    // Get the first sheet (Data sheet)
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file contains no sheets');
    }

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd',
    }) as unknown[][];

    if (rawData.length < 2) {
      throw new BadRequestException('Excel file must contain headers and at least one data row');
    }

    // Extract headers from first row
    const headers = rawData[0] as string[];
    const headerMap = this.mapHeadersToColumns(headers, template.columns);

    // Parse data rows (skip header row)
    const allRows: ParsedRow[] = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] as unknown[];
      if (this.isEmptyRow(row)) continue;

      const parsedRow = this.parseRow(row, i + 1, headerMap, template.columns, importType);
      allRows.push(parsedRow);
    }

    const validRows = allRows.filter((r) => r.isValid);
    const invalidRows = allRows.filter((r) => !r.isValid);

    return {
      importType,
      totalRows: allRows.length,
      validRows,
      invalidRows,
      allRows,
    };
  }


  /**
   * Maps Excel headers to template column definitions
   */
  private mapHeadersToColumns(
    headers: string[],
    columns: TemplateColumn[],
  ): Map<number, TemplateColumn> {
    const headerMap = new Map<number, TemplateColumn>();

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.trim().toLowerCase();
      if (!header) continue;

      const column = columns.find(
        (col) => col.header.toLowerCase() === header,
      );
      if (column) {
        headerMap.set(i, column);
      }
    }

    return headerMap;
  }

  /**
   * Checks if a row is empty
   */
  private isEmptyRow(row: unknown[]): boolean {
    return row.every((cell) => cell === null || cell === undefined || cell === '');
  }

  /**
   * Parses and validates a single row
   */
  private parseRow(
    row: unknown[],
    rowNumber: number,
    headerMap: Map<number, TemplateColumn>,
    columns: TemplateColumn[],
    importType?: ImportType,
  ): ParsedRow {
    const data: Record<string, unknown> = {};
    const errors: string[] = [];

    // Extract values based on header mapping
    headerMap.forEach((column, index) => {
      const rawValue = row[index];
      const { value, error } = this.parseAndValidateCell(rawValue, column);
      
      if (error) {
        errors.push(`${column.header}: ${error}`);
      }
      
      if (value !== undefined) {
        data[column.key] = value;
      }
    });

    // Check for missing required fields
    for (const column of columns) {
      if (column.required && (data[column.key] === undefined || data[column.key] === null || data[column.key] === '')) {
        errors.push(`${column.header}: Required field is missing`);
      }
    }

    // Apply import-type-specific validation
    if (importType === ImportType.DailyStatus) {
      this.validateDailyStatusRow(data, errors);
    }

    return {
      rowNumber,
      data,
      errors,
      isValid: errors.length === 0,
    };
  }

  /**
   * Validates Daily Status specific business rules
   * Requirements: 4.2, 4.3 - Hour range validation and downtime sum validation
   */
  private validateDailyStatusRow(data: Record<string, unknown>, errors: string[]): void {
    const posHours = data.posHours as number | undefined;
    const nmcmSHours = data.nmcmSHours as number | undefined;
    const nmcmUHours = data.nmcmUHours as number | undefined;
    const nmcsHours = data.nmcsHours as number | undefined;

    // Validate hour ranges (0-24)
    if (posHours !== undefined && (posHours < 0 || posHours > 24)) {
      errors.push(`POS Hours: Value ${posHours} is outside valid range (0-24)`);
    }
    if (nmcmSHours !== undefined && (nmcmSHours < 0 || nmcmSHours > 24)) {
      errors.push(`NMCM-S Hours: Value ${nmcmSHours} is outside valid range (0-24)`);
    }
    if (nmcmUHours !== undefined && (nmcmUHours < 0 || nmcmUHours > 24)) {
      errors.push(`NMCM-U Hours: Value ${nmcmUHours} is outside valid range (0-24)`);
    }
    if (nmcsHours !== undefined && (nmcsHours < 0 || nmcsHours > 24)) {
      errors.push(`NMCS Hours: Value ${nmcsHours} is outside valid range (0-24)`);
    }

    // Validate downtime sum does not exceed POS hours
    if (posHours !== undefined && nmcmSHours !== undefined && nmcmUHours !== undefined) {
      const totalDowntime = nmcmSHours + nmcmUHours + (nmcsHours || 0);
      if (totalDowntime > posHours) {
        errors.push(`Total downtime (${totalDowntime}h) exceeds POS hours (${posHours}h)`);
      }
    }
  }

  /**
   * Parses and validates a single cell value
   */
  private parseAndValidateCell(
    rawValue: unknown,
    column: TemplateColumn,
  ): { value: unknown; error?: string } {
    // Handle empty values
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return { value: undefined };
    }

    switch (column.type) {
      case 'string':
        return { value: String(rawValue).trim() };

      case 'number': {
        const num = Number(rawValue);
        if (isNaN(num)) {
          return { value: undefined, error: `Invalid number: ${rawValue}` };
        }
        return { value: num };
      }

      case 'date': {
        const date = this.parseDate(rawValue);
        if (!date) {
          return { value: undefined, error: `Invalid date: ${rawValue}` };
        }
        return { value: date };
      }

      case 'enum': {
        const strValue = String(rawValue).trim();
        if (column.enumValues && !column.enumValues.includes(strValue)) {
          return {
            value: undefined,
            error: `Invalid value: ${strValue}. Allowed: ${column.enumValues.join(', ')}`,
          };
        }
        return { value: strValue };
      }

      default:
        return { value: rawValue };
    }
  }

  /**
   * Parses various date formats
   */
  private parseDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number') {
      // Excel serial date
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
      }
    }

    if (typeof value === 'string') {
      // Try parsing ISO format and common formats
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      // Try YYYY-MM-DD format
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?$/);
      if (match) {
        const [, year, month, day, hour, minute] = match;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour ? parseInt(hour) : 0,
          minute ? parseInt(minute) : 0,
        );
      }
    }

    return null;
  }

  /**
   * Gets validation summary for display
   */
  getValidationSummary(result: ParseResult): {
    totalRows: number;
    validCount: number;
    errorCount: number;
    errors: { row: number; message: string }[];
  } {
    const errors = result.invalidRows.flatMap((row) =>
      row.errors.map((error) => ({
        row: row.rowNumber,
        message: error,
      })),
    );

    return {
      totalRows: result.totalRows,
      validCount: result.validRows.length,
      errorCount: result.invalidRows.length,
      errors,
    };
  }
}
