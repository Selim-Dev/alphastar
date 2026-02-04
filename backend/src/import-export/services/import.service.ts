import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as XLSX from 'xlsx';
import { ImportLogRepository } from '../repositories/import-log.repository';
import { ImportLog, ImportLogDocument, ImportType, ImportError } from '../schemas/import-log.schema';
import { ExcelParserService, ParseResult, ParsedRow } from './excel-parser.service';
import { AircraftRepository } from '../../aircraft/repositories/aircraft.repository';
import { AircraftStatus } from '../../aircraft/schemas/aircraft.schema';
import { DailyCounterRepository } from '../../utilization/repositories/daily-counter.repository';
import { MaintenanceTaskRepository } from '../../maintenance-tasks/repositories/maintenance-task.repository';
import { Shift } from '../../maintenance-tasks/schemas/maintenance-task.schema';
import { AOGEventRepository } from '../../aog-events/repositories/aog-event.repository';
import { AOGCategory, ResponsibleParty } from '../../aog-events/schemas/aog-event.schema';
import { BudgetPlanRepository } from '../../budget/repositories/budget-plan.repository';
import { DailyStatusRepository } from '../../daily-status/repositories/daily-status.repository';
import { WorkOrderSummaryRepository } from '../../work-order-summaries/repositories/work-order-summary.repository';
import { VacationPlanRepository } from '../../vacation-plans/repositories/vacation-plan.repository';
import { VacationTeam, VacationEmployee } from '../../vacation-plans/schemas/vacation-plan.schema';

export interface ImportPreview {
  importType: ImportType;
  filename: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  validRows: ParsedRow[];
  errors: { row: number; message: string }[];
  sessionId: string;
}

export interface ImportConfirmResult {
  importLogId: string;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
}

// In-memory session storage for import previews
const importSessions = new Map<string, { parseResult: ParseResult; filename: string; buffer: Buffer }>();

@Injectable()
export class ImportService {
  constructor(
    private readonly importLogRepository: ImportLogRepository,
    private readonly excelParserService: ExcelParserService,
    private readonly aircraftRepository: AircraftRepository,
    private readonly dailyCounterRepository: DailyCounterRepository,
    private readonly maintenanceTaskRepository: MaintenanceTaskRepository,
    private readonly aogEventRepository: AOGEventRepository,
    private readonly budgetPlanRepository: BudgetPlanRepository,
    private readonly dailyStatusRepository: DailyStatusRepository,
    private readonly workOrderSummaryRepository: WorkOrderSummaryRepository,
    private readonly vacationPlanRepository: VacationPlanRepository,
  ) {}

  /**
   * Parses an uploaded Excel file and returns a preview
   * Requirements: 10.2, 10.3
   */
  async parseAndPreview(
    buffer: Buffer,
    filename: string,
    importType: ImportType,
  ): Promise<ImportPreview> {
    const parseResult = await this.excelParserService.parseExcelFile(buffer, importType);
    const summary = this.excelParserService.getValidationSummary(parseResult);

    // Generate session ID and store for later confirmation
    const sessionId = new Types.ObjectId().toString();
    importSessions.set(sessionId, { parseResult, filename, buffer });

    // Auto-cleanup after 30 minutes
    setTimeout(() => importSessions.delete(sessionId), 30 * 60 * 1000);

    return {
      importType,
      filename,
      totalRows: summary.totalRows,
      validCount: summary.validCount,
      errorCount: summary.errorCount,
      validRows: parseResult.validRows,
      errors: summary.errors,
      sessionId,
    };
  }


  /**
   * Confirms import of valid rows from a preview session
   * Requirements: 10.4, 10.5
   */
  async confirmImport(
    sessionId: string,
    userId: string,
    s3Key: string,
  ): Promise<ImportConfirmResult> {
    const session = importSessions.get(sessionId);
    if (!session) {
      throw new NotFoundException('Import session not found or expired');
    }

    const { parseResult, filename } = session;
    const errors: ImportError[] = [];
    let successCount = 0;

    // Import valid rows based on type
    for (const row of parseResult.validRows) {
      try {
        await this.importRow(parseResult.importType, row.data, userId);
        successCount++;
      } catch (error) {
        errors.push({
          row: row.rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Create import log record
    const importLog: ImportLogDocument = await this.importLogRepository.create({
      filename,
      s3Key,
      importType: parseResult.importType,
      rowCount: parseResult.totalRows,
      successCount,
      errorCount: parseResult.invalidRows.length + errors.length,
      errors: [
        ...parseResult.invalidRows.flatMap((r) =>
          r.errors.map((e) => ({ row: r.rowNumber, message: e })),
        ),
        ...errors,
      ],
      importedBy: new Types.ObjectId(userId),
    });

    // Clean up session
    importSessions.delete(sessionId);

    return {
      importLogId: (importLog._id as Types.ObjectId).toString(),
      successCount,
      errorCount: parseResult.invalidRows.length + errors.length,
      errors: importLog.errors,
    };
  }

  /**
   * Imports a single row based on import type
   */
  private async importRow(
    importType: ImportType,
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    switch (importType) {
      case ImportType.Aircraft:
        await this.importAircraft(data);
        break;
      case ImportType.Utilization:
        await this.importUtilization(data, userId);
        break;
      case ImportType.MaintenanceTasks:
        await this.importMaintenanceTask(data, userId);
        break;
      case ImportType.AOGEvents:
        await this.importAOGEvent(data, userId);
        break;
      case ImportType.Budget:
        await this.importBudgetPlan(data);
        break;
      case ImportType.DailyStatus:
        await this.importDailyStatus(data, userId);
        break;
      case ImportType.WorkOrderSummary:
        await this.importWorkOrderSummary(data, userId);
        break;
      case ImportType.VacationPlan:
        // Vacation plan import is handled specially via importVacationPlan method
        // This case should not be reached in normal row-by-row import
        throw new BadRequestException('Vacation plan import requires special handling');
      default:
        throw new BadRequestException(`Unsupported import type: ${importType}`);
    }
  }

  private async importAircraft(data: Record<string, unknown>): Promise<void> {
    const registration = String(data.registration).toUpperCase();
    
    // Check for duplicate
    const exists = await this.aircraftRepository.existsByRegistration(registration);
    if (exists) {
      throw new BadRequestException(`Aircraft ${registration} already exists`);
    }

    // Map status string to enum
    const statusMap: Record<string, AircraftStatus> = {
      active: AircraftStatus.Active,
      parked: AircraftStatus.Parked,
      leased: AircraftStatus.Leased,
    };

    await this.aircraftRepository.create({
      registration,
      fleetGroup: String(data.fleetGroup),
      aircraftType: String(data.aircraftType),
      msn: String(data.msn),
      owner: String(data.owner),
      manufactureDate: data.manufactureDate as Date,
      enginesCount: Number(data.enginesCount),
      status: statusMap[String(data.status).toLowerCase()] || AircraftStatus.Active,
    });
  }

  private async importUtilization(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    const registration = String(data.aircraftRegistration).toUpperCase();
    const aircraft = await this.aircraftRepository.findByRegistration(registration);
    if (!aircraft) {
      throw new BadRequestException(`Aircraft ${registration} not found`);
    }

    await this.dailyCounterRepository.create({
      aircraftId: aircraft._id as Types.ObjectId,
      date: data.date as Date,
      airframeHoursTtsn: Number(data.airframeHoursTtsn),
      airframeCyclesTcsn: Number(data.airframeCyclesTcsn),
      engine1Hours: Number(data.engine1Hours),
      engine1Cycles: Number(data.engine1Cycles),
      engine2Hours: Number(data.engine2Hours),
      engine2Cycles: Number(data.engine2Cycles),
      engine3Hours: data.engine3Hours ? Number(data.engine3Hours) : undefined,
      engine3Cycles: data.engine3Cycles ? Number(data.engine3Cycles) : undefined,
      engine4Hours: data.engine4Hours ? Number(data.engine4Hours) : undefined,
      engine4Cycles: data.engine4Cycles ? Number(data.engine4Cycles) : undefined,
      apuHours: Number(data.apuHours),
      apuCycles: data.apuCycles ? Number(data.apuCycles) : undefined,
      lastFlightDate: data.lastFlightDate as Date | undefined,
      updatedBy: new Types.ObjectId(userId),
    });
  }


  private async importMaintenanceTask(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    const registration = String(data.aircraftRegistration).toUpperCase();
    const aircraft = await this.aircraftRepository.findByRegistration(registration);
    if (!aircraft) {
      throw new BadRequestException(`Aircraft ${registration} not found`);
    }

    // Map shift string to enum
    const shiftMap: Record<string, Shift> = {
      Morning: Shift.Morning,
      Evening: Shift.Evening,
      Night: Shift.Night,
      Other: Shift.Other,
    };

    await this.maintenanceTaskRepository.create({
      aircraftId: aircraft._id as Types.ObjectId,
      date: data.date as Date,
      shift: shiftMap[String(data.shift)] || Shift.Other,
      taskType: String(data.taskType),
      taskDescription: String(data.taskDescription),
      manpowerCount: Number(data.manpowerCount),
      manHours: Number(data.manHours),
      cost: data.cost ? Number(data.cost) : undefined,
      updatedBy: new Types.ObjectId(userId),
    });
  }

  private async importAOGEvent(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    // Aircraft lookup already done by parser - use aircraftId
    const aircraftId = data.aircraftId as string;
    if (!aircraftId) {
      throw new BadRequestException('Aircraft ID not found in parsed data');
    }

    // Dates already parsed and validated by parser
    const detectedAt = data.detectedAt as Date;
    
    // Handle clearedAt: create a fresh Date object if valid, otherwise undefined
    let clearedAt: Date | undefined;
    if (data.clearedAt && data.clearedAt instanceof Date) {
      // Create a fresh Date object to ensure proper Mongoose serialization
      clearedAt = new Date(data.clearedAt.getTime());
    } else {
      clearedAt = undefined;
    }

    // Category already mapped by parser
    const categoryMapped = data.categoryMapped as string;
    const categoryMap: Record<string, AOGCategory> = {
      scheduled: AOGCategory.Scheduled,
      unscheduled: AOGCategory.Unscheduled,
      aog: AOGCategory.AOG,
      mro: AOGCategory.MRO,
      cleaning: AOGCategory.Cleaning,
    };
    const category = categoryMap[categoryMapped] || AOGCategory.Unscheduled;

    // Location already validated by parser (ICAO code or null)
    const location = data.location ? String(data.location) : undefined;

    // Defect Description → reasonCode (Requirement 2.1)
    const reasonCode = data.defectDescription 
      ? String(data.defectDescription) 
      : 'Historical AOG Event'; // Default per Requirement 4.1

    // Apply default values (Requirements 4.3, 4.4, 4.5, 4.6)
    const responsibleParty = ResponsibleParty.Other; // Default per Requirement 4.3
    const actionTaken = 'See defect description'; // Default per Requirement 4.4
    const manpowerCount = 1; // Default per Requirement 4.5

    // Calculate manHours from duration or default to 0 (Requirement 4.6)
    let manHours = 0;
    if (clearedAt) {
      const durationMs = clearedAt.getTime() - detectedAt.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      manHours = Math.max(0, Math.round(durationHours)); // Round to nearest hour
    }

    // Calculate status (Requirement 5.1, 5.2)
    // Status is a virtual field, but we don't need to store it

    // Calculate durationHours (Requirement 6.1, 6.2)
    let durationHours = 0;
    if (clearedAt) {
      const durationMs = clearedAt.getTime() - detectedAt.getTime();
      durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
    } else {
      // Active event - duration from start to now
      const durationMs = new Date().getTime() - detectedAt.getTime();
      durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
    }

    // Set reportedAt and upAndRunningAt defaults (Requirement 4.8)
    const reportedAt = detectedAt;
    const upAndRunningAt = clearedAt;

    // For imported events, set installationCompleteAt to clearedAt if event is resolved
    // This allows basic three-bucket analytics even for imported data
    const installationCompleteAt = clearedAt;

    // Create AOG event with isImported flag (Requirement 4.7)
    await this.aogEventRepository.create({
      aircraftId: new Types.ObjectId(aircraftId),
      detectedAt,
      clearedAt,
      category,
      reasonCode,
      location,
      responsibleParty,
      actionTaken,
      manpowerCount,
      manHours,
      // Set isImported flag (Requirement 2.5)
      isImported: true,
      // Set reportedAt and upAndRunningAt for consistency (Requirement 4.8)
      reportedAt,
      upAndRunningAt,
      installationCompleteAt,
      // Computed metrics - will be computed by pre-save hook if milestones are set
      technicalTimeHours: 0,
      procurementTimeHours: 0,
      opsTimeHours: 0,
      totalDowntimeHours: durationHours,
      // Simplified cost fields (default to 0)
      internalCost: 0,
      externalCost: 0,
      attachments: [],
      updatedBy: new Types.ObjectId(userId),
    });
  }

  private async importBudgetPlan(data: Record<string, unknown>): Promise<void> {
    await this.budgetPlanRepository.upsert(
      Number(data.fiscalYear),
      Number(data.clauseId),
      String(data.aircraftGroup),
      {
        fiscalYear: Number(data.fiscalYear),
        clauseId: Number(data.clauseId),
        clauseDescription: String(data.clauseDescription),
        aircraftGroup: String(data.aircraftGroup),
        plannedAmount: Number(data.plannedAmount),
        currency: data.currency ? String(data.currency) : 'USD',
      },
    );
  }

  /**
   * Imports a daily status record with aircraft validation and duplicate prevention
   * Requirements: 4.4, 4.5, 8.3, 8.7
   */
  private async importDailyStatus(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    const registration = String(data.aircraftRegistration).toUpperCase();
    const aircraft = await this.aircraftRepository.findByRegistration(registration);
    if (!aircraft) {
      throw new BadRequestException(`Aircraft ${registration} not found`);
    }

    const date = data.date as Date;
    const posHours = Number(data.posHours);
    const nmcmSHours = Number(data.nmcmSHours);
    const nmcmUHours = Number(data.nmcmUHours);
    const nmcsHours = data.nmcsHours ? Number(data.nmcsHours) : 0;

    // Validate hour ranges (0-24)
    if (posHours < 0 || posHours > 24) {
      throw new BadRequestException(`POS Hours must be between 0 and 24`);
    }
    if (nmcmSHours < 0 || nmcmSHours > 24) {
      throw new BadRequestException(`NMCM-S Hours must be between 0 and 24`);
    }
    if (nmcmUHours < 0 || nmcmUHours > 24) {
      throw new BadRequestException(`NMCM-U Hours must be between 0 and 24`);
    }
    if (nmcsHours < 0 || nmcsHours > 24) {
      throw new BadRequestException(`NMCS Hours must be between 0 and 24`);
    }

    // Calculate total downtime and validate it doesn't exceed POS hours
    const totalDowntime = nmcmSHours + nmcmUHours + nmcsHours;
    if (totalDowntime > posHours) {
      throw new BadRequestException(
        `Total downtime (${totalDowntime}h) cannot exceed POS hours (${posHours}h)`,
      );
    }

    // Calculate FMC hours (POS hours - total downtime)
    // Ensure FMC hours never go below 0 or exceed POS hours (Requirement 8.7)
    const fmcHours = Math.max(0, Math.min(posHours, posHours - totalDowntime));

    // Check for duplicate record (same aircraft and date)
    const existingRecord = await this.dailyStatusRepository.findByAircraftAndDate(
      (aircraft._id as Types.ObjectId).toString(),
      date,
    );
    if (existingRecord) {
      throw new BadRequestException(
        `Daily status record already exists for ${registration} on ${date.toISOString().split('T')[0]}`,
      );
    }

    await this.dailyStatusRepository.create({
      aircraftId: aircraft._id as Types.ObjectId,
      date,
      posHours,
      fmcHours,
      nmcmSHours,
      nmcmUHours,
      nmcsHours: data.nmcsHours ? nmcsHours : undefined,
      notes: data.notes ? String(data.notes) : undefined,
      updatedBy: new Types.ObjectId(userId),
    });
  }

  /**
   * Imports a work order summary record with aircraft validation and upsert behavior
   * Requirements: 13.2, 13.3
   */
  private async importWorkOrderSummary(
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    const registration = String(data.aircraftRegistration).toUpperCase();
    const aircraft = await this.aircraftRepository.findByRegistration(registration);
    if (!aircraft) {
      throw new BadRequestException(`Aircraft ${registration} not found`);
    }

    const period = String(data.period);
    const workOrderCount = Number(data.workOrderCount);
    const totalCost = data.totalCost !== undefined && data.totalCost !== '' 
      ? Number(data.totalCost) 
      : undefined;

    // Validate period format (YYYY-MM)
    const periodRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!periodRegex.test(period)) {
      throw new BadRequestException(`Invalid period format: ${period}. Expected YYYY-MM (e.g., 2024-01)`);
    }

    // Validate count >= 0 (Requirement 13.3)
    if (workOrderCount < 0 || !Number.isFinite(workOrderCount)) {
      throw new BadRequestException(`Work order count must be >= 0, got: ${data.workOrderCount}`);
    }

    // Validate cost >= 0 if provided (Requirement 13.3)
    if (totalCost !== undefined && (totalCost < 0 || !Number.isFinite(totalCost))) {
      throw new BadRequestException(`Total cost must be >= 0, got: ${data.totalCost}`);
    }

    // Upsert by (aircraftId, period) - update if exists, create if not (Requirement 13.2)
    await this.workOrderSummaryRepository.upsert(
      (aircraft._id as Types.ObjectId).toString(),
      period,
      {
        workOrderCount,
        totalCost,
        currency: 'USD',
        notes: data.notes ? String(data.notes) : undefined,
        updatedBy: new Types.ObjectId(userId),
      },
    );
  }

  /**
   * Gets import history
   */
  async getImportHistory(
    userId?: string,
    importType?: ImportType,
  ): Promise<ImportLog[]> {
    return this.importLogRepository.findAll({
      importedBy: userId,
      importType,
    });
  }

  /**
   * Gets a specific import log
   */
  async getImportLog(id: string): Promise<ImportLog | null> {
    return this.importLogRepository.findById(id);
  }

  /**
   * Imports vacation plans from Excel file with two sheets (Engineering, TPL)
   * Requirements: 17.1, 17.3
   */
  async importVacationPlan(
    buffer: Buffer,
    filename: string,
    year: number,
    userId: string,
  ): Promise<ImportConfirmResult> {
    let workbook: XLSX.WorkBook;
    
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new BadRequestException('Invalid Excel file format');
    }

    const errors: ImportError[] = [];
    let successCount = 0;
    const teamSheetMap: Record<string, VacationTeam> = {
      'Engineering': VacationTeam.Engineering,
      'TPL': VacationTeam.TPL,
    };

    // Process each sheet (Engineering and TPL)
    for (const sheetName of workbook.SheetNames) {
      const team = teamSheetMap[sheetName];
      if (!team) {
        // Skip sheets that don't match team names
        continue;
      }

      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: true,
      }) as unknown[][];

      if (rawData.length < 2) {
        errors.push({
          row: 0,
          message: `Sheet "${sheetName}" must contain headers and at least one data row`,
        });
        continue;
      }

      // Parse employees from the sheet
      // Expected format: First column is employee name, next 48 columns are week values
      const employees: VacationEmployee[] = [];
      
      for (let rowIndex = 1; rowIndex < rawData.length; rowIndex++) {
        const row = rawData[rowIndex] as unknown[];
        if (!row || row.length === 0) continue;

        const employeeName = row[0];
        if (!employeeName || String(employeeName).trim() === '') continue;

        // Skip rows that look like headers or totals
        const nameStr = String(employeeName).toLowerCase();
        if (nameStr === 'employee' || nameStr === 'name' || nameStr === 'total' || nameStr === 'overlap') {
          continue;
        }

        const cells: number[] = new Array(48).fill(0);
        let hasError = false;

        // Parse 48 week columns (columns 1-48)
        for (let weekIndex = 0; weekIndex < 48; weekIndex++) {
          const cellValue = row[weekIndex + 1];
          
          if (cellValue === undefined || cellValue === null || cellValue === '') {
            cells[weekIndex] = 0;
          } else if (typeof cellValue === 'number') {
            if (cellValue < 0) {
              errors.push({
                row: rowIndex + 1,
                message: `${sheetName} - ${employeeName}: Week ${weekIndex + 1} value must be >= 0, got ${cellValue}`,
              });
              hasError = true;
            } else {
              cells[weekIndex] = cellValue;
            }
          } else {
            const numValue = Number(cellValue);
            if (isNaN(numValue)) {
              errors.push({
                row: rowIndex + 1,
                message: `${sheetName} - ${employeeName}: Week ${weekIndex + 1} must be numeric, got "${cellValue}"`,
              });
              hasError = true;
            } else if (numValue < 0) {
              errors.push({
                row: rowIndex + 1,
                message: `${sheetName} - ${employeeName}: Week ${weekIndex + 1} value must be >= 0, got ${numValue}`,
              });
              hasError = true;
            } else {
              cells[weekIndex] = numValue;
            }
          }
        }

        if (!hasError) {
          const total = cells.reduce((sum, val) => sum + val, 0);
          employees.push({
            name: String(employeeName).trim(),
            cells,
            total,
          });
        }
      }

      if (employees.length === 0) {
        errors.push({
          row: 0,
          message: `Sheet "${sheetName}" contains no valid employee data`,
        });
        continue;
      }

      // Compute overlaps
      const overlaps = this.computeOverlaps(employees);

      // Upsert the vacation plan
      try {
        await this.vacationPlanRepository.upsert(year, team, {
          employees,
          overlaps,
          updatedBy: new Types.ObjectId(userId),
        });
        successCount++;
      } catch (error) {
        errors.push({
          row: 0,
          message: `Failed to save ${sheetName} vacation plan: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // Create import log record
    const s3Key = `imports/${Date.now()}_vacation_plan`;
    const importLog: ImportLogDocument = await this.importLogRepository.create({
      filename,
      s3Key,
      importType: ImportType.VacationPlan,
      rowCount: successCount,
      successCount,
      errorCount: errors.length,
      errors,
      importedBy: new Types.ObjectId(userId),
    });

    return {
      importLogId: (importLog._id as Types.ObjectId).toString(),
      successCount,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * Computes overlap indicators for each week
   * If more than one employee has a value > 0 in a week, mark as 'Check'
   */
  private computeOverlaps(employees: VacationEmployee[]): string[] {
    const overlaps: string[] = new Array(48).fill('Ok');

    for (let weekIndex = 0; weekIndex < 48; weekIndex++) {
      let count = 0;
      for (const employee of employees) {
        if (employee.cells && employee.cells[weekIndex] > 0) {
          count++;
        }
      }
      if (count > 1) {
        overlaps[weekIndex] = 'Check';
      }
    }

    return overlaps;
  }
}
