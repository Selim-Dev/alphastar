import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ImportType } from '../schemas/import-log.schema';
import { ExcelTemplateService, TemplateColumn } from './excel-template.service';
import { AircraftRepository } from '../../aircraft/repositories/aircraft.repository';

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

// Category mapping from Excel values to database enum
const CATEGORY_MAP: Record<string, string> = {
  'AOG': 'aog',
  'S-MX': 'scheduled',
  'U-MX': 'unscheduled',
  'MRO': 'mro',
  'CLEANING': 'cleaning',
};

@Injectable()
export class ExcelParserService {
  constructor(
    private readonly templateService: ExcelTemplateService,
    private readonly aircraftRepository: AircraftRepository,
  ) {}

  /**
   * Parses an uploaded Excel file and validates rows against the template
   * Requirements: 10.2, 10.3
   */
  async parseExcelFile(buffer: Buffer, importType: ImportType): Promise<ParseResult> {
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

      const parsedRow = await this.parseRow(row, i + 1, headerMap, template.columns, importType);
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
  private async parseRow(
    row: unknown[],
    rowNumber: number,
    headerMap: Map<number, TemplateColumn>,
    columns: TemplateColumn[],
    importType?: ImportType,
  ): Promise<ParsedRow> {
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
    } else if (importType === ImportType.AOGEvents) {
      await this.validateAOGEventRow(data, errors);
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
   * Validates AOG Event specific business rules
   * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1-4.8
   */
  private async validateAOGEventRow(data: Record<string, unknown>, errors: string[]): Promise<void> {
    // 1. Validate and lookup aircraft (registration or name)
    const aircraftInput = data.aircraft as string | undefined;
    if (aircraftInput) {
      const aircraft = await this.lookupAircraft(aircraftInput);
      if (!aircraft) {
        errors.push(`Aircraft: Registration or name not found: ${aircraftInput}`);
      } else {
        // Store the aircraftId for later use
        data.aircraftId = aircraft._id.toString();
        data.aircraftRegistration = aircraft.registration;
      }
    }

    // 2. Validate and map category
    const categoryInput = data.category as string | undefined;
    if (categoryInput) {
      const mappedCategory = CATEGORY_MAP[categoryInput.toUpperCase()];
      if (!mappedCategory) {
        errors.push(`Category: Invalid value "${categoryInput}". Allowed: AOG, S-MX, U-MX, MRO, CLEANING`);
      } else {
        data.categoryMapped = mappedCategory;
      }
    }

    // 3. Parse and validate Start Date + Time → detectedAt
    const startDate = data.startDate as Date | undefined;
    const startTime = data.startTime as string | undefined;
    
    if (startDate && startTime) {
      const detectedAt = this.combineDateAndTime(startDate, startTime);
      if (!detectedAt) {
        errors.push(`Start Time: Invalid time format "${startTime}". Expected HH:MM (24-hour)`);
      } else {
        // Validate not in future
        if (detectedAt > new Date()) {
          errors.push(`Start Date/Time: Cannot be in the future`);
        }
        data.detectedAt = detectedAt;
      }
    }

    // 4. Parse and validate Finish Date + Time → clearedAt (optional)
    const finishDate = data.finishDate as Date | undefined;
    const finishTime = data.finishTime as string | undefined;
    
    if (finishDate && finishTime) {
      const clearedAt = this.combineDateAndTime(finishDate, finishTime);
      if (!clearedAt) {
        errors.push(`Finish Time: Invalid time format "${finishTime}". Expected HH:MM (24-hour)`);
      } else {
        data.clearedAt = clearedAt;
        
        // Validate Finish >= Start
        const detectedAt = data.detectedAt as Date | undefined;
        if (detectedAt && clearedAt < detectedAt) {
          errors.push(`Finish Date/Time: Must be >= Start Date/Time`);
        }
      }
    } else if (finishDate || finishTime) {
      // If one is provided but not the other
      if (finishDate && !finishTime) {
        errors.push(`Finish Time: Required when Finish Date is provided`);
      }
      if (finishTime && !finishDate) {
        errors.push(`Finish Date: Required when Finish Time is provided`);
      }
    } else {
      // Both empty = active event
      data.clearedAt = null;
    }

    // 5. Validate location (ICAO code format - optional)
    const location = data.location as string | undefined;
    if (location && location.trim()) {
      const trimmedLocation = location.trim().toUpperCase();
      // Basic ICAO validation: 4 letters
      if (!/^[A-Z]{4}$/.test(trimmedLocation)) {
        errors.push(`Location: Invalid ICAO code format "${location}". Expected 4 letters (e.g., OERK, LFSB)`);
      } else {
        data.location = trimmedLocation;
      }
    }
  }

  /**
   * Looks up aircraft by registration or name (case-insensitive, fuzzy matching)
   * Requirements: 2.8, 3.1, 3.2, 3.3
   */
  private async lookupAircraft(input: string): Promise<{ _id: any; registration: string } | null> {
    const trimmedInput = input.trim();
    
    // Try exact registration match first (case-insensitive)
    const byRegistration = await this.aircraftRepository.findByRegistration(trimmedInput);
    if (byRegistration) {
      return byRegistration;
    }

    // Try fuzzy name matching
    // Get all aircraft and search by name/type fields
    const allAircraft = await this.aircraftRepository.findAll({ limit: 1000 });
    
    const inputLower = trimmedInput.toLowerCase();
    
    // Try exact match on registration (already tried above, but included for completeness)
    for (const aircraft of allAircraft.data) {
      if (aircraft.registration.toLowerCase() === inputLower) {
        return aircraft;
      }
    }
    
    // Try fuzzy match on aircraft type or fleet group
    for (const aircraft of allAircraft.data) {
      const aircraftType = aircraft.aircraftType?.toLowerCase() || '';
      const fleetGroup = aircraft.fleetGroup?.toLowerCase() || '';
      
      // Check if input contains the registration
      if (inputLower.includes(aircraft.registration.toLowerCase())) {
        return aircraft;
      }
      
      // Check if aircraft type or fleet group contains the input
      if (aircraftType.includes(inputLower) || inputLower.includes(aircraftType)) {
        // If multiple matches possible, this is ambiguous - return null
        // For now, return first match
        return aircraft;
      }
      
      if (fleetGroup.includes(inputLower) || inputLower.includes(fleetGroup)) {
        return aircraft;
      }
    }
    
    return null;
  }

  /**
   * Combines a date and time string (HH:MM) into a single Date object
   * Requirements: 2.3, 2.4
   */
  private combineDateAndTime(date: Date, timeStr: string): Date | null {
    if (!date || !timeStr) {
      return null;
    }

    // Parse time string (HH:MM format, 24-hour)
    const timeMatch = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) {
      return null;
    }

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    // Validate time ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // Create new date with combined date and time
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);

    return combined;
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
   * Supports: YYYY-MM-DD, MM/DD/YYYY, Excel serial dates, ISO dates
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
      const trimmedValue = value.trim();
      
      // Try parsing ISO format and common formats
      const parsed = new Date(trimmedValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      // Try YYYY-MM-DD format (with optional time)
      const isoMatch = trimmedValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
      if (isoMatch) {
        const [, year, month, day, hour, minute] = isoMatch;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour ? parseInt(hour) : 0,
          minute ? parseInt(minute) : 0,
        );
      }

      // Try MM/DD/YYYY format (with optional time)
      const usMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
      if (usMatch) {
        const [, month, day, year, hour, minute] = usMatch;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour ? parseInt(hour) : 0,
          minute ? parseInt(minute) : 0,
        );
      }

      // Try DD/MM/YYYY format (with optional time) - common in some regions
      const euMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
      if (euMatch) {
        const [, day, month, year, hour, minute] = euMatch;
        const parsedDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour ? parseInt(hour) : 0,
          minute ? parseInt(minute) : 0,
        );
        // Validate the date is valid (e.g., not 13/25/2026)
        if (!isNaN(parsedDate.getTime()) && 
            parsedDate.getMonth() === parseInt(month) - 1 &&
            parsedDate.getDate() === parseInt(day)) {
          return parsedDate;
        }
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
