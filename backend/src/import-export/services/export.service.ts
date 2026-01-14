import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { AircraftRepository } from '../../aircraft/repositories/aircraft.repository';
import { DailyCounterRepository } from '../../utilization/repositories/daily-counter.repository';
import { AOGEventRepository } from '../../aog-events/repositories/aog-event.repository';
import { BudgetPlanRepository } from '../../budget/repositories/budget-plan.repository';
import { ActualSpendRepository } from '../../budget/repositories/actual-spend.repository';
import { DailyStatusRepository } from '../../daily-status/repositories/daily-status.repository';
import { MaintenanceTaskRepository } from '../../maintenance-tasks/repositories/maintenance-task.repository';
import { WorkOrderRepository } from '../../work-orders/repositories/work-order.repository';
import { DiscrepancyRepository } from '../../discrepancies/repositories/discrepancy.repository';
import { WorkOrderSummaryRepository } from '../../work-order-summaries/repositories/work-order-summary.repository';
import { VacationPlanRepository } from '../../vacation-plans/repositories/vacation-plan.repository';

export type ExportType =
  | 'aircraft'
  | 'utilization'
  | 'daily-status'
  | 'aog-events'
  | 'maintenance-tasks'
  | 'work-orders'
  | 'work-order-summaries'
  | 'discrepancies'
  | 'budget-plans'
  | 'actual-spend'
  | 'dashboard'
  | 'aircraft-detail'
  | 'vacation-plan';

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  aircraftId?: string;
  fiscalYear?: number;
  fleetGroup?: string;
}

@Injectable()
export class ExportService {
  constructor(
    private readonly aircraftRepository: AircraftRepository,
    private readonly dailyCounterRepository: DailyCounterRepository,
    private readonly aogEventRepository: AOGEventRepository,
    private readonly budgetPlanRepository: BudgetPlanRepository,
    private readonly actualSpendRepository: ActualSpendRepository,
    private readonly dailyStatusRepository: DailyStatusRepository,
    private readonly maintenanceTaskRepository: MaintenanceTaskRepository,
    private readonly workOrderRepository: WorkOrderRepository,
    private readonly discrepancyRepository: DiscrepancyRepository,
    private readonly workOrderSummaryRepository: WorkOrderSummaryRepository,
    private readonly vacationPlanRepository: VacationPlanRepository,
  ) {}

  /**
   * Exports data to Excel format
   * Requirements: 1.5, 8.5, 11.5
   */
  async exportToExcel(
    exportType: ExportType,
    options?: ExportOptions,
  ): Promise<{ buffer: Buffer; filename: string }> {
    let data: Record<string, unknown>[];
    let sheetName: string;
    let filename: string;

    switch (exportType) {
      case 'aircraft':
        data = await this.exportAircraft();
        sheetName = 'Aircraft';
        filename = 'aircraft_export.xlsx';
        break;
      case 'utilization':
        data = await this.exportUtilization(options);
        sheetName = 'Utilization';
        filename = 'utilization_export.xlsx';
        break;
      case 'daily-status':
        // Use enhanced export with summary statistics
        return this.exportDailyStatusWithSummary(options);
      case 'aog-events':
        data = await this.exportAOGEvents(options);
        sheetName = 'AOG Events';
        filename = 'aog_events_export.xlsx';
        break;
      case 'maintenance-tasks':
        data = await this.exportMaintenanceTasks(options);
        sheetName = 'Maintenance Tasks';
        filename = 'maintenance_tasks_export.xlsx';
        break;
      case 'work-orders':
        data = await this.exportWorkOrders(options);
        sheetName = 'Work Orders';
        filename = 'work_orders_export.xlsx';
        break;
      case 'work-order-summaries':
        data = await this.exportWorkOrderSummaries(options);
        sheetName = 'Work Order Summaries';
        filename = 'work_order_summaries_export.xlsx';
        break;
      case 'discrepancies':
        data = await this.exportDiscrepancies(options);
        sheetName = 'Discrepancies';
        filename = 'discrepancies_export.xlsx';
        break;
      case 'budget-plans':
        data = await this.exportBudgetPlans(options);
        sheetName = 'Budget Plans';
        filename = 'budget_plans_export.xlsx';
        break;
      case 'actual-spend':
        data = await this.exportActualSpend(options);
        sheetName = 'Actual Spend';
        filename = 'actual_spend_export.xlsx';
        break;
      case 'dashboard':
        return this.exportDashboardSummary(options);
      case 'aircraft-detail':
        return this.exportAircraftDetail(options);
      case 'vacation-plan':
        // Vacation plan export is handled via exportVacationPlan method
        throw new Error('Vacation plan export requires year parameter - use exportVacationPlan method');
      default:
        throw new Error(`Unknown export type: ${exportType}`);
    }

    const buffer = this.createExcelBuffer(data, sheetName);
    return { buffer, filename };
  }


  private createExcelBuffer(
    data: Record<string, unknown>[],
    sheetName: string,
  ): Buffer {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet['!cols'] = headers.map((header) => ({
        wch: Math.max(
          header.length,
          ...data.map((row) => String(row[header] ?? '').length).slice(0, 100),
          10,
        ),
      }));
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private async exportAircraft(): Promise<Record<string, unknown>[]> {
    const result = await this.aircraftRepository.findAll({ limit: 1000 });
    return result.data.map((a) => ({
      Registration: a.registration,
      'Fleet Group': a.fleetGroup,
      'Aircraft Type': a.aircraftType,
      MSN: a.msn,
      Owner: a.owner,
      'Manufacture Date': a.manufactureDate?.toISOString().split('T')[0],
      'Engines Count': a.enginesCount,
      Status: a.status,
      'Created At': a.createdAt?.toISOString(),
    }));
  }

  private async exportUtilization(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const counters = await this.dailyCounterRepository.findAll({
      aircraftId: options?.aircraftId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    // Get aircraft map for registration lookup
    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    return counters.map((c) => ({
      'Aircraft Registration': aircraftMap.get(c.aircraftId?.toString()) || c.aircraftId?.toString(),
      Date: c.date?.toISOString().split('T')[0],
      'Airframe Hours TTSN': c.airframeHoursTtsn,
      'Airframe Cycles TCSN': c.airframeCyclesTcsn,
      'Engine 1 Hours': c.engine1Hours,
      'Engine 1 Cycles': c.engine1Cycles,
      'Engine 2 Hours': c.engine2Hours,
      'Engine 2 Cycles': c.engine2Cycles,
      'Engine 3 Hours': c.engine3Hours,
      'Engine 3 Cycles': c.engine3Cycles,
      'Engine 4 Hours': c.engine4Hours,
      'Engine 4 Cycles': c.engine4Cycles,
      'APU Hours': c.apuHours,
      'APU Cycles': c.apuCycles,
      'Last Flight Date': c.lastFlightDate?.toISOString().split('T')[0],
    }));
  }

  private async exportDailyStatus(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const statuses = await this.dailyStatusRepository.findAll({
      aircraftId: options?.aircraftId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), { registration: a.registration, fleetGroup: a.fleetGroup }]));

    return statuses.map((s) => {
      const aircraft = aircraftMap.get(s.aircraftId?.toString());
      const totalDowntime = s.nmcmSHours + s.nmcmUHours + (s.nmcsHours || 0);
      const availabilityPercentage = s.posHours > 0 ? ((s.fmcHours / s.posHours) * 100) : 0;
      
      return {
        'Aircraft Registration': aircraft?.registration || s.aircraftId?.toString(),
        'Fleet Group': aircraft?.fleetGroup || '',
        Date: s.date?.toISOString().split('T')[0],
        'POS Hours': s.posHours,
        'FMC Hours': s.fmcHours,
        'NMCM-S Hours': s.nmcmSHours,
        'NMCM-U Hours': s.nmcmUHours,
        'NMCS Hours': s.nmcsHours || 0,
        'Total Downtime': totalDowntime,
        'Availability %': Math.round(availabilityPercentage * 100) / 100,
        Notes: s.notes || '',
      };
    });
  }

  /**
   * Exports daily status data with summary statistics to Excel
   * Requirements: 7.1, 7.2, 7.3, 7.4
   */
  async exportDailyStatusWithSummary(
    options?: ExportOptions,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const workbook = XLSX.utils.book_new();
    
    // Get daily status data
    const allStatuses = await this.dailyStatusRepository.findAll({
      aircraftId: options?.aircraftId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), { registration: a.registration, fleetGroup: a.fleetGroup }]));

    // Filter by fleet group if specified
    const statuses = options?.fleetGroup 
      ? allStatuses.filter((s) => {
          const aircraft = aircraftMap.get(s.aircraftId?.toString());
          return aircraft?.fleetGroup === options.fleetGroup;
        })
      : allStatuses;

    // Process data with calculated fields
    const processedData = statuses.map((s) => {
      const aircraft = aircraftMap.get(s.aircraftId?.toString());
      const totalDowntime = s.nmcmSHours + s.nmcmUHours + (s.nmcsHours || 0);
      const availabilityPercentage = s.posHours > 0 ? ((s.fmcHours / s.posHours) * 100) : 0;
      
      return {
        'Aircraft Registration': aircraft?.registration || s.aircraftId?.toString(),
        'Fleet Group': aircraft?.fleetGroup || '',
        Date: s.date?.toISOString().split('T')[0],
        'POS Hours': s.posHours,
        'FMC Hours': s.fmcHours,
        'NMCM-S Hours': s.nmcmSHours,
        'NMCM-U Hours': s.nmcmUHours,
        'NMCS Hours': s.nmcsHours || 0,
        'Total Downtime': totalDowntime,
        'Availability %': Math.round(availabilityPercentage * 100) / 100,
        Notes: s.notes || '',
      };
    });

    // Sheet 1: Summary Statistics
    const totalPosHours = statuses.reduce((sum, s) => sum + (s.posHours || 0), 0);
    const totalFmcHours = statuses.reduce((sum, s) => sum + (s.fmcHours || 0), 0);
    const totalScheduledDowntime = statuses.reduce((sum, s) => sum + (s.nmcmSHours || 0), 0);
    const totalUnscheduledDowntime = statuses.reduce((sum, s) => sum + (s.nmcmUHours || 0) + (s.nmcsHours || 0), 0);
    const uniqueAircraft = new Set(statuses.map((s) => s.aircraftId?.toString()));
    const recordsWithDowntime = statuses.filter((s) => s.nmcmSHours > 0 || s.nmcmUHours > 0 || (s.nmcsHours || 0) > 0).length;
    const belowThreshold85 = processedData.filter((d) => (d['Availability %'] as number) < 85).length;
    const belowThreshold70 = processedData.filter((d) => (d['Availability %'] as number) < 70).length;
    const averageAvailability = totalPosHours > 0 ? ((totalFmcHours / totalPosHours) * 100) : 0;

    const summaryData = [
      { Metric: 'Report Period', Value: `${options?.startDate?.toISOString().split('T')[0] || 'All'} to ${options?.endDate?.toISOString().split('T')[0] || 'All'}` },
      { Metric: 'Fleet Group Filter', Value: options?.fleetGroup || 'All Fleets' },
      { Metric: 'Total Records', Value: statuses.length },
      { Metric: 'Unique Aircraft', Value: uniqueAircraft.size },
      { Metric: 'Average Availability %', Value: Math.round(averageAvailability * 100) / 100 },
      { Metric: 'Total POS Hours', Value: totalPosHours },
      { Metric: 'Total FMC Hours', Value: totalFmcHours },
      { Metric: 'Total Scheduled Downtime (NMCM-S)', Value: totalScheduledDowntime },
      { Metric: 'Total Unscheduled Downtime (NMCM-U + NMCS)', Value: totalUnscheduledDowntime },
      { Metric: 'Records with Downtime', Value: recordsWithDowntime },
      { Metric: 'Records Below 85% Availability', Value: belowThreshold85 },
      { Metric: 'Records Below 70% Availability (Critical)', Value: belowThreshold70 },
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 40 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Sheet 2: Daily Status Records
    if (processedData.length > 0) {
      const dataSheet = XLSX.utils.json_to_sheet(processedData);
      const headers = Object.keys(processedData[0]);
      dataSheet['!cols'] = headers.map((header) => ({
        wch: Math.max(
          header.length,
          ...processedData.map((row) => String(row[header] ?? '').length).slice(0, 100),
          10,
        ),
      }));
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Daily Status');
    }

    // Sheet 3: Availability by Aircraft (aggregated)
    const availabilityByAircraft = new Map<string, { posHours: number; fmcHours: number; days: number; registration: string; fleetGroup: string }>();
    statuses.forEach((s) => {
      const key = s.aircraftId?.toString() || '';
      const aircraft = aircraftMap.get(key);
      const existing = availabilityByAircraft.get(key) || { 
        posHours: 0, 
        fmcHours: 0, 
        days: 0, 
        registration: aircraft?.registration || key,
        fleetGroup: aircraft?.fleetGroup || ''
      };
      existing.posHours += s.posHours || 0;
      existing.fmcHours += s.fmcHours || 0;
      existing.days += 1;
      availabilityByAircraft.set(key, existing);
    });

    const aircraftSummary = Array.from(availabilityByAircraft.values()).map((data) => ({
      'Aircraft Registration': data.registration,
      'Fleet Group': data.fleetGroup,
      'Total POS Hours': data.posHours,
      'Total FMC Hours': data.fmcHours,
      'Availability %': data.posHours > 0 ? Math.round((data.fmcHours / data.posHours) * 10000) / 100 : 0,
      'Days Tracked': data.days,
    })).sort((a, b) => (a['Availability %'] as number) - (b['Availability %'] as number));

    if (aircraftSummary.length > 0) {
      const aircraftSheet = XLSX.utils.json_to_sheet(aircraftSummary);
      const aircraftHeaders = Object.keys(aircraftSummary[0]);
      aircraftSheet['!cols'] = aircraftHeaders.map((header) => ({
        wch: Math.max(header.length, 15),
      }));
      XLSX.utils.book_append_sheet(workbook, aircraftSheet, 'By Aircraft');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Generate descriptive filename with date range
    const startDateStr = options?.startDate?.toISOString().split('T')[0] || 'all';
    const endDateStr = options?.endDate?.toISOString().split('T')[0] || 'all';
    const filename = `daily_status_${startDateStr}_to_${endDateStr}.xlsx`;

    return { buffer, filename };
  }

  private async exportAOGEvents(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const events = await this.aogEventRepository.findAll({
      aircraftId: options?.aircraftId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    return events.map((e) => {
      const downtimeHours = e.clearedAt
        ? Math.round(((e.clearedAt.getTime() - e.detectedAt.getTime()) / (1000 * 60 * 60)) * 100) / 100
        : null;

      // Calculate total cost summary (legacy fields)
      const totalCost = (e.costLabor || 0) + (e.costParts || 0) + (e.costExternal || 0);

      // Calculate total cost from simplified fields
      const simplifiedTotalCost = (e.internalCost || 0) + (e.externalCost || 0);

      return {
        'Aircraft Registration': aircraftMap.get(e.aircraftId?.toString()) || e.aircraftId?.toString(),
        'Detected At': e.detectedAt?.toISOString(),
        'Cleared At': e.clearedAt?.toISOString(),
        'Downtime Hours': downtimeHours,
        Category: e.category,
        'Reason Code': e.reasonCode,
        'Responsible Party': e.responsibleParty,
        'Action Taken': e.actionTaken,
        'Manpower Count': e.manpowerCount,
        'Man Hours': e.manHours,
        // Legacy cost fields
        'Cost Labor': e.costLabor,
        'Cost Parts': e.costParts,
        'Cost External': e.costExternal,
        'Total Cost (Legacy)': totalCost > 0 ? totalCost : null,
        // NEW: Simplified cost fields (Requirement 9.3)
        'Internal Cost': e.internalCost || 0,
        'External Cost': e.externalCost || 0,
        'Total Cost': simplifiedTotalCost > 0 ? simplifiedTotalCost : null,
        // NEW: Milestone timestamps (Requirement 9.3)
        'Reported At': e.reportedAt?.toISOString() || e.detectedAt?.toISOString(),
        'Procurement Requested At': e.procurementRequestedAt?.toISOString() || '',
        'Available At Store At': e.availableAtStoreAt?.toISOString() || '',
        'Issued Back At': e.issuedBackAt?.toISOString() || '',
        'Installation Complete At': e.installationCompleteAt?.toISOString() || '',
        'Test Start At': e.testStartAt?.toISOString() || '',
        'Up And Running At': e.upAndRunningAt?.toISOString() || e.clearedAt?.toISOString() || '',
        // NEW: Computed downtime metrics (Requirement 9.3)
        'Technical Time Hours': e.technicalTimeHours || 0,
        'Procurement Time Hours': e.procurementTimeHours || 0,
        'Ops Time Hours': e.opsTimeHours || 0,
        'Total Downtime Hours': e.totalDowntimeHours || 0,
        'Current Status': e.currentStatus || 'REPORTED',
        'Blocking Reason': e.blockingReason || '',
      };
    });
  }


  private async exportMaintenanceTasks(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const tasks = await this.maintenanceTaskRepository.findAll({
      aircraftId: options?.aircraftId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    return tasks.map((t) => ({
      'Aircraft Registration': aircraftMap.get(t.aircraftId?.toString()) || t.aircraftId?.toString(),
      Date: t.date?.toISOString().split('T')[0],
      Shift: t.shift,
      'Task Type': t.taskType,
      'Task Description': t.taskDescription,
      'Manpower Count': t.manpowerCount,
      'Man Hours': t.manHours,
      Cost: t.cost,
      'Work Order Ref': t.workOrderRef?.toString(),
    }));
  }

  private async exportWorkOrders(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const workOrders = await this.workOrderRepository.findAll({
      aircraftId: options?.aircraftId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    return workOrders.map((wo) => {
      const turnaroundDays = wo.dateOut && wo.dateIn
        ? Math.round(((wo.dateOut.getTime() - wo.dateIn.getTime()) / (1000 * 60 * 60 * 24)) * 100) / 100
        : null;

      return {
        'WO Number': wo.woNumber,
        'Aircraft Registration': aircraftMap.get(wo.aircraftId?.toString()) || wo.aircraftId?.toString(),
        Description: wo.description,
        Status: wo.status,
        'Date In': wo.dateIn?.toISOString().split('T')[0],
        'Date Out': wo.dateOut?.toISOString().split('T')[0],
        'Due Date': wo.dueDate?.toISOString().split('T')[0],
        'CRS Number': wo.crsNumber,
        'MR Number': wo.mrNumber,
        'Turnaround Days': turnaroundDays,
      };
    });
  }

  /**
   * Exports work order summaries for a period range
   * Requirements: 13.4
   */
  private async exportWorkOrderSummaries(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    // Convert date options to period format (YYYY-MM)
    const startPeriod = options?.startDate
      ? `${options.startDate.getFullYear()}-${String(options.startDate.getMonth() + 1).padStart(2, '0')}`
      : undefined;
    const endPeriod = options?.endDate
      ? `${options.endDate.getFullYear()}-${String(options.endDate.getMonth() + 1).padStart(2, '0')}`
      : undefined;

    const summaries = await this.workOrderSummaryRepository.findAll({
      aircraftId: options?.aircraftId,
      startPeriod,
      endPeriod,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    return summaries.map((s) => ({
      'Aircraft Registration': aircraftMap.get(s.aircraftId?.toString()) || s.aircraftId?.toString(),
      Period: s.period,
      'Work Order Count': s.workOrderCount,
      'Total Cost': s.totalCost ?? '',
      Currency: s.currency || 'USD',
      Notes: s.notes || '',
    }));
  }

  private async exportDiscrepancies(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const discrepancies = await this.discrepancyRepository.findAll({
      aircraftId: options?.aircraftId,
      startDate: options?.startDate,
      endDate: options?.endDate,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    return discrepancies.map((d) => ({
      'Aircraft Registration': aircraftMap.get(d.aircraftId?.toString()) || d.aircraftId?.toString(),
      'Date Detected': d.dateDetected?.toISOString().split('T')[0],
      'ATA Chapter': d.ataChapter,
      'Discrepancy Text': d.discrepancyText,
      'Date Corrected': d.dateCorrected?.toISOString().split('T')[0],
      'Corrective Action': d.correctiveAction,
      Responsibility: d.responsibility,
      'Downtime Hours': d.downtimeHours,
    }));
  }

  private async exportBudgetPlans(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const plans = await this.budgetPlanRepository.findAll({
      fiscalYear: options?.fiscalYear,
    });

    return plans.map((p) => ({
      'Fiscal Year': p.fiscalYear,
      'Clause ID': p.clauseId,
      'Clause Description': p.clauseDescription,
      'Aircraft Group': p.aircraftGroup,
      'Planned Amount': p.plannedAmount,
      Currency: p.currency,
    }));
  }

  private async exportActualSpend(
    options?: ExportOptions,
  ): Promise<Record<string, unknown>[]> {
    const spends = await this.actualSpendRepository.findAll({
      aircraftId: options?.aircraftId,
    });

    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    return spends.map((s) => ({
      Period: s.period,
      'Aircraft Group': s.aircraftGroup,
      'Aircraft Registration': s.aircraftId ? aircraftMap.get(s.aircraftId?.toString()) : '',
      'Clause ID': s.clauseId,
      Amount: s.amount,
      Currency: s.currency,
      Vendor: s.vendor,
      Notes: s.notes,
    }));
  }

  /**
   * Exports comprehensive aircraft detail data with multiple sheets
   * Requirements: 11.5
   */
  private async exportAircraftDetail(
    options?: ExportOptions,
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (!options?.aircraftId) {
      throw new Error('Aircraft ID is required for aircraft-detail export');
    }

    const aircraft = await this.aircraftRepository.findById(options.aircraftId);
    if (!aircraft) {
      throw new Error('Aircraft not found');
    }

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Aircraft Info
    const aircraftInfo = [{
      Registration: aircraft.registration,
      'Fleet Group': aircraft.fleetGroup,
      'Aircraft Type': aircraft.aircraftType,
      MSN: aircraft.msn,
      Owner: aircraft.owner,
      'Manufacture Date': aircraft.manufactureDate?.toISOString().split('T')[0],
      'Engines Count': aircraft.enginesCount,
      Status: aircraft.status,
    }];
    const aircraftSheet = XLSX.utils.json_to_sheet(aircraftInfo);
    XLSX.utils.book_append_sheet(workbook, aircraftSheet, 'Aircraft Info');

    // Sheet 2: Utilization Counters
    const utilizationData = await this.exportUtilization(options);
    if (utilizationData.length > 0) {
      const utilizationSheet = XLSX.utils.json_to_sheet(utilizationData);
      XLSX.utils.book_append_sheet(workbook, utilizationSheet, 'Utilization');
    }

    // Sheet 3: Daily Status
    const statusData = await this.exportDailyStatus(options);
    if (statusData.length > 0) {
      const statusSheet = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusSheet, 'Daily Status');
    }

    // Sheet 4: AOG Events
    const aogData = await this.exportAOGEvents(options);
    if (aogData.length > 0) {
      const aogSheet = XLSX.utils.json_to_sheet(aogData);
      XLSX.utils.book_append_sheet(workbook, aogSheet, 'AOG Events');
    }

    // Sheet 5: Work Orders
    const workOrderData = await this.exportWorkOrders(options);
    if (workOrderData.length > 0) {
      const workOrderSheet = XLSX.utils.json_to_sheet(workOrderData);
      XLSX.utils.book_append_sheet(workbook, workOrderSheet, 'Work Orders');
    }

    // Sheet 6: Discrepancies
    const discrepancyData = await this.exportDiscrepancies(options);
    if (discrepancyData.length > 0) {
      const discrepancySheet = XLSX.utils.json_to_sheet(discrepancyData);
      XLSX.utils.book_append_sheet(workbook, discrepancySheet, 'Discrepancies');
    }

    // Sheet 7: Maintenance Tasks
    const maintenanceData = await this.exportMaintenanceTasks(options);
    if (maintenanceData.length > 0) {
      const maintenanceSheet = XLSX.utils.json_to_sheet(maintenanceData);
      XLSX.utils.book_append_sheet(workbook, maintenanceSheet, 'Maintenance Tasks');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `aircraft_${aircraft.registration}_detail_${timestamp}.xlsx`;

    return { buffer, filename };
  }

  /**
   * Exports comprehensive dashboard summary with multiple sheets
   * Requirements: CEO Dashboard Export
   */
  private async exportDashboardSummary(
    options?: ExportOptions,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const workbook = XLSX.utils.book_new();
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options?.endDate || new Date();

    // Get aircraft data for lookups
    const aircraftResult = await this.aircraftRepository.findAll({ limit: 1000 });
    const aircraftMap = new Map(aircraftResult.data.map((a) => [a._id?.toString(), a.registration]));

    // Sheet 1: Fleet Summary
    const fleetSummary = aircraftResult.data.map((a) => ({
      Registration: a.registration,
      'Fleet Group': a.fleetGroup,
      'Aircraft Type': a.aircraftType,
      Owner: a.owner,
      Status: a.status,
      'Engines Count': a.enginesCount,
    }));
    const fleetSheet = XLSX.utils.json_to_sheet(fleetSummary);
    XLSX.utils.book_append_sheet(workbook, fleetSheet, 'Fleet Summary');

    // Sheet 2: Availability Summary
    const dailyStatuses = await this.dailyStatusRepository.findAll({
      startDate,
      endDate,
    });
    
    // Group by aircraft and calculate availability
    const availabilityByAircraft = new Map<string, { posHours: number; fmcHours: number; days: number }>();
    dailyStatuses.forEach((s) => {
      const key = s.aircraftId?.toString() || '';
      const existing = availabilityByAircraft.get(key) || { posHours: 0, fmcHours: 0, days: 0 };
      existing.posHours += s.posHours || 0;
      existing.fmcHours += s.fmcHours || 0;
      existing.days += 1;
      availabilityByAircraft.set(key, existing);
    });

    const availabilitySummary = Array.from(availabilityByAircraft.entries()).map(([aircraftId, data]) => ({
      'Aircraft Registration': aircraftMap.get(aircraftId) || aircraftId,
      'Total POS Hours': data.posHours,
      'Total FMC Hours': data.fmcHours,
      'Availability %': data.posHours > 0 ? ((data.fmcHours / data.posHours) * 100).toFixed(1) : '0',
      'Days Tracked': data.days,
    }));
    if (availabilitySummary.length > 0) {
      const availabilitySheet = XLSX.utils.json_to_sheet(availabilitySummary);
      XLSX.utils.book_append_sheet(workbook, availabilitySheet, 'Availability');
    }

    // Sheet 3: Utilization Summary
    const counters = await this.dailyCounterRepository.findAll({
      startDate,
      endDate,
    });
    
    // Get first and last counter for each aircraft to calculate period utilization
    const utilizationByAircraft = new Map<string, { firstHours: number; lastHours: number; firstCycles: number; lastCycles: number }>();
    counters.forEach((c) => {
      const key = c.aircraftId?.toString() || '';
      const existing = utilizationByAircraft.get(key);
      if (!existing) {
        utilizationByAircraft.set(key, {
          firstHours: c.airframeHoursTtsn || 0,
          lastHours: c.airframeHoursTtsn || 0,
          firstCycles: c.airframeCyclesTcsn || 0,
          lastCycles: c.airframeCyclesTcsn || 0,
        });
      } else {
        existing.lastHours = c.airframeHoursTtsn || 0;
        existing.lastCycles = c.airframeCyclesTcsn || 0;
      }
    });

    const utilizationSummary = Array.from(utilizationByAircraft.entries()).map(([aircraftId, data]) => ({
      'Aircraft Registration': aircraftMap.get(aircraftId) || aircraftId,
      'Period Flight Hours': (data.lastHours - data.firstHours).toFixed(1),
      'Period Cycles': data.lastCycles - data.firstCycles,
      'Current Total Hours': data.lastHours,
      'Current Total Cycles': data.lastCycles,
    }));
    if (utilizationSummary.length > 0) {
      const utilizationSheet = XLSX.utils.json_to_sheet(utilizationSummary);
      XLSX.utils.book_append_sheet(workbook, utilizationSheet, 'Utilization');
    }

    // Sheet 4: AOG Events
    const aogData = await this.exportAOGEvents({ startDate, endDate });
    if (aogData.length > 0) {
      const aogSheet = XLSX.utils.json_to_sheet(aogData);
      XLSX.utils.book_append_sheet(workbook, aogSheet, 'AOG Events');
    }

    // Sheet 5: Work Orders
    const workOrderData = await this.exportWorkOrders({ startDate, endDate });
    if (workOrderData.length > 0) {
      const workOrderSheet = XLSX.utils.json_to_sheet(workOrderData);
      XLSX.utils.book_append_sheet(workbook, workOrderSheet, 'Work Orders');
    }

    // Sheet 6: Maintenance Tasks
    const maintenanceData = await this.exportMaintenanceTasks({ startDate, endDate });
    if (maintenanceData.length > 0) {
      const maintenanceSheet = XLSX.utils.json_to_sheet(maintenanceData);
      XLSX.utils.book_append_sheet(workbook, maintenanceSheet, 'Maintenance Tasks');
    }

    // Sheet 7: Discrepancies
    const discrepancyData = await this.exportDiscrepancies({ startDate, endDate });
    if (discrepancyData.length > 0) {
      const discrepancySheet = XLSX.utils.json_to_sheet(discrepancyData);
      XLSX.utils.book_append_sheet(workbook, discrepancySheet, 'Discrepancies');
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dashboard_summary_${timestamp}.xlsx`;

    return { buffer, filename };
  }

  /**
   * Gets the filename for an export
   */
  getExportFilename(exportType: ExportType): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${exportType}_export_${timestamp}.xlsx`;
  }

  /**
   * Exports a vacation plan to Excel with 48 week columns
   * Requirements: 17.2, 17.4
   */
  async exportVacationPlan(
    planId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const plan = await this.vacationPlanRepository.findById(planId);
    if (!plan) {
      throw new Error(`Vacation plan with ID ${planId} not found`);
    }

    const workbook = XLSX.utils.book_new();

    // Generate week headers (W1-W48, grouped by month)
    const weekHeaders = ['Employee'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let month = 0; month < 12; month++) {
      for (let week = 1; week <= 4; week++) {
        weekHeaders.push(`${monthNames[month]} W${week}`);
      }
    }
    weekHeaders.push('Total');

    // Build data rows
    const dataRows: (string | number)[][] = [weekHeaders];

    // Add employee rows
    for (const employee of plan.employees) {
      const row: (string | number)[] = [employee.name];
      for (let i = 0; i < 48; i++) {
        row.push(employee.cells[i] || 0);
      }
      row.push(employee.total || 0);
      dataRows.push(row);
    }

    // Add overlap row (Requirement 17.4)
    const overlapRow: (string | number)[] = ['Overlap'];
    for (let i = 0; i < 48; i++) {
      overlapRow.push(plan.overlaps[i] || 'Ok');
    }
    overlapRow.push(''); // No total for overlap row
    dataRows.push(overlapRow);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(dataRows);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Employee name column
      ...new Array(48).fill({ wch: 8 }), // Week columns
      { wch: 8 }, // Total column
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, plan.team);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `vacation_plan_${plan.year}_${plan.team}.xlsx`;

    return { buffer, filename };
  }

  /**
   * Exports all vacation plans for a year to Excel with two sheets (Engineering, TPL)
   * Requirements: 17.2, 17.4
   */
  async exportVacationPlansByYear(
    year: number,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const plans = await this.vacationPlanRepository.findAll({ year });
    
    if (plans.length === 0) {
      throw new Error(`No vacation plans found for year ${year}`);
    }

    const workbook = XLSX.utils.book_new();

    // Generate week headers (W1-W48, grouped by month)
    const weekHeaders = ['Employee'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let month = 0; month < 12; month++) {
      for (let week = 1; week <= 4; week++) {
        weekHeaders.push(`${monthNames[month]} W${week}`);
      }
    }
    weekHeaders.push('Total');

    // Create a sheet for each team
    for (const plan of plans) {
      // Build data rows
      const dataRows: (string | number)[][] = [weekHeaders];

      // Add employee rows
      for (const employee of plan.employees) {
        const row: (string | number)[] = [employee.name];
        for (let i = 0; i < 48; i++) {
          row.push(employee.cells[i] || 0);
        }
        row.push(employee.total || 0);
        dataRows.push(row);
      }

      // Add overlap row (Requirement 17.4)
      const overlapRow: (string | number)[] = ['Overlap'];
      for (let i = 0; i < 48; i++) {
        overlapRow.push(plan.overlaps[i] || 'Ok');
      }
      overlapRow.push(''); // No total for overlap row
      dataRows.push(overlapRow);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(dataRows);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // Employee name column
        ...new Array(48).fill({ wch: 8 }), // Week columns
        { wch: 8 }, // Total column
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, plan.team);
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `vacation_plans_${year}.xlsx`;

    return { buffer, filename };
  }
}
