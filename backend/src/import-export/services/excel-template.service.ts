import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ImportType } from '../schemas/import-log.schema';

export interface TemplateColumn {
  header: string;
  key: string;
  type: 'string' | 'number' | 'date' | 'enum';
  required: boolean;
  description?: string;
  enumValues?: string[];
}

export interface TemplateDefinition {
  name: string;
  columns: TemplateColumn[];
  exampleRows: Record<string, unknown>[];
}

@Injectable()
export class ExcelTemplateService {
  private readonly templates: Record<ImportType, TemplateDefinition> = {
    [ImportType.Utilization]: {
      name: 'Daily Utilization Counters',
      columns: [
        { header: 'Aircraft Registration', key: 'aircraftRegistration', type: 'string', required: true, description: 'e.g., HZ-A42' },
        { header: 'Date', key: 'date', type: 'date', required: true, description: 'YYYY-MM-DD' },
        { header: 'Airframe Hours TTSN', key: 'airframeHoursTtsn', type: 'number', required: true },
        { header: 'Airframe Cycles TCSN', key: 'airframeCyclesTcsn', type: 'number', required: true },
        { header: 'Engine 1 Hours', key: 'engine1Hours', type: 'number', required: true },
        { header: 'Engine 1 Cycles', key: 'engine1Cycles', type: 'number', required: true },
        { header: 'Engine 2 Hours', key: 'engine2Hours', type: 'number', required: true },
        { header: 'Engine 2 Cycles', key: 'engine2Cycles', type: 'number', required: true },
        { header: 'Engine 3 Hours', key: 'engine3Hours', type: 'number', required: false },
        { header: 'Engine 3 Cycles', key: 'engine3Cycles', type: 'number', required: false },
        { header: 'Engine 4 Hours', key: 'engine4Hours', type: 'number', required: false },
        { header: 'Engine 4 Cycles', key: 'engine4Cycles', type: 'number', required: false },
        { header: 'APU Hours', key: 'apuHours', type: 'number', required: true },
        { header: 'APU Cycles', key: 'apuCycles', type: 'number', required: false },
        { header: 'Last Flight Date', key: 'lastFlightDate', type: 'date', required: false },
      ],
      exampleRows: [
        {
          aircraftRegistration: 'HZ-A42',
          date: '2024-01-15',
          airframeHoursTtsn: 12500.5,
          airframeCyclesTcsn: 4200,
          engine1Hours: 8500.2,
          engine1Cycles: 3100,
          engine2Hours: 8450.8,
          engine2Cycles: 3050,
          apuHours: 6200.0,
        },
      ],
    },

    [ImportType.MaintenanceTasks]: {
      name: 'Maintenance Tasks',
      columns: [
        { header: 'Aircraft Registration', key: 'aircraftRegistration', type: 'string', required: true },
        { header: 'Date', key: 'date', type: 'date', required: true, description: 'YYYY-MM-DD' },
        { header: 'Shift', key: 'shift', type: 'enum', required: true, enumValues: ['Morning', 'Evening', 'Night', 'Other'] },
        { header: 'Task Type', key: 'taskType', type: 'string', required: true },
        { header: 'Task Description', key: 'taskDescription', type: 'string', required: true },
        { header: 'Manpower Count', key: 'manpowerCount', type: 'number', required: true },
        { header: 'Man Hours', key: 'manHours', type: 'number', required: true },
        { header: 'Cost', key: 'cost', type: 'number', required: false },
        { header: 'Work Order Reference', key: 'workOrderRef', type: 'string', required: false },
      ],
      exampleRows: [
        {
          aircraftRegistration: 'HZ-A42',
          date: '2024-01-15',
          shift: 'Morning',
          taskType: 'Scheduled Maintenance',
          taskDescription: 'A-Check inspection',
          manpowerCount: 3,
          manHours: 24,
          cost: 5000,
        },
      ],
    },

    [ImportType.AOGEvents]: {
      name: 'AOG Events',
      columns: [
        { header: 'Aircraft Registration', key: 'aircraftRegistration', type: 'string', required: true },
        { header: 'Detected At', key: 'detectedAt', type: 'date', required: true, description: 'YYYY-MM-DD HH:mm' },
        { header: 'Cleared At', key: 'clearedAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm' },
        { header: 'Category', key: 'category', type: 'enum', required: true, enumValues: ['scheduled', 'unscheduled', 'aog'] },
        { header: 'Reason Code', key: 'reasonCode', type: 'string', required: true },
        { header: 'Responsible Party', key: 'responsibleParty', type: 'enum', required: true, enumValues: ['Internal', 'OEM', 'Customs', 'Finance', 'Other'] },
        { header: 'Action Taken', key: 'actionTaken', type: 'string', required: true },
        { header: 'Manpower Count', key: 'manpowerCount', type: 'number', required: true },
        { header: 'Man Hours', key: 'manHours', type: 'number', required: true },
        // Legacy cost fields (preserved for backward compatibility)
        { header: 'Cost Labor', key: 'costLabor', type: 'number', required: false, description: 'Legacy: Labor cost' },
        { header: 'Cost Parts', key: 'costParts', type: 'number', required: false, description: 'Legacy: Parts cost' },
        { header: 'Cost External', key: 'costExternal', type: 'number', required: false, description: 'Legacy: External cost' },
        // NEW: Simplified cost fields (Requirement 9.1)
        { header: 'Internal Cost', key: 'internalCost', type: 'number', required: false, description: 'Labor and man-hours cost' },
        { header: 'External Cost', key: 'externalCost', type: 'number', required: false, description: 'Vendor and third-party cost' },
        // NEW: Milestone timestamps (Requirement 9.1)
        { header: 'Reported At', key: 'reportedAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm (defaults to Detected At)' },
        { header: 'Procurement Requested At', key: 'procurementRequestedAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm (optional - when parts were requested)' },
        { header: 'Available At Store At', key: 'availableAtStoreAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm (optional - when parts arrived)' },
        { header: 'Issued Back At', key: 'issuedBackAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm (optional - when parts issued to maintenance)' },
        { header: 'Installation Complete At', key: 'installationCompleteAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm (optional - when installation completed)' },
        { header: 'Test Start At', key: 'testStartAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm (optional - when ops testing started)' },
        { header: 'Up And Running At', key: 'upAndRunningAt', type: 'date', required: false, description: 'YYYY-MM-DD HH:mm (optional - defaults to Cleared At)' },
        { header: 'Current Status', key: 'currentStatus', type: 'enum', required: false, description: 'Workflow status (defaults to REPORTED on import)', enumValues: ['REPORTED', 'TROUBLESHOOTING', 'ISSUE_IDENTIFIED', 'RESOLVED_NO_PARTS', 'PART_REQUIRED', 'PROCUREMENT_REQUESTED', 'FINANCE_APPROVAL_PENDING', 'ORDER_PLACED', 'IN_TRANSIT', 'AT_PORT', 'CUSTOMS_CLEARANCE', 'RECEIVED_IN_STORES', 'ISSUED_TO_MAINTENANCE', 'INSTALLED_AND_TESTED', 'ENGINE_RUN_REQUESTED', 'ENGINE_RUN_COMPLETED', 'BACK_IN_SERVICE', 'CLOSED'] },
        { header: 'Blocking Reason', key: 'blockingReason', type: 'enum', required: false, description: 'Reason for blocking (if applicable)', enumValues: ['Finance', 'Port', 'Customs', 'Vendor', 'Ops', 'Other'] },
      ],
      exampleRows: [
        {
          aircraftRegistration: 'HZ-A42',
          detectedAt: '2024-01-15 08:30',
          clearedAt: '2024-01-15 14:45',
          category: 'unscheduled',
          reasonCode: 'ENG-001',
          responsibleParty: 'Internal',
          actionTaken: 'Engine inspection and repair',
          manpowerCount: 4,
          manHours: 24,
          costLabor: 2400,
          costParts: 15000,
          internalCost: 2400,
          externalCost: 15000,
          reportedAt: '2024-01-15 08:30',
          procurementRequestedAt: '2024-01-15 09:00',
          availableAtStoreAt: '2024-01-15 11:00',
          issuedBackAt: '2024-01-15 11:30',
          installationCompleteAt: '2024-01-15 13:30',
          testStartAt: '2024-01-15 14:00',
          upAndRunningAt: '2024-01-15 14:45',
          currentStatus: 'REPORTED',
          blockingReason: '',
        },
      ],
    },

    [ImportType.Budget]: {
      name: 'Budget Plan',
      columns: [
        { header: 'Fiscal Year', key: 'fiscalYear', type: 'number', required: true },
        { header: 'Clause ID', key: 'clauseId', type: 'number', required: true },
        { header: 'Clause Description', key: 'clauseDescription', type: 'string', required: true },
        { header: 'Aircraft Group', key: 'aircraftGroup', type: 'string', required: true },
        { header: 'Planned Amount', key: 'plannedAmount', type: 'number', required: true },
        { header: 'Currency', key: 'currency', type: 'string', required: false, description: 'Default: USD' },
      ],
      exampleRows: [
        {
          fiscalYear: 2024,
          clauseId: 1,
          clauseDescription: 'Spare Parts',
          aircraftGroup: 'A330',
          plannedAmount: 500000,
          currency: 'USD',
        },
      ],
    },

    [ImportType.Aircraft]: {
      name: 'Aircraft Master',
      columns: [
        { header: 'Registration', key: 'registration', type: 'string', required: true, description: 'e.g., HZ-A42' },
        { header: 'Fleet Group', key: 'fleetGroup', type: 'string', required: true, description: 'e.g., A330, G650ER' },
        { header: 'Aircraft Type', key: 'aircraftType', type: 'string', required: true, description: 'e.g., A340-642' },
        { header: 'MSN', key: 'msn', type: 'string', required: true, description: 'Manufacturer Serial Number' },
        { header: 'Owner', key: 'owner', type: 'string', required: true },
        { header: 'Manufacture Date', key: 'manufactureDate', type: 'date', required: true, description: 'YYYY-MM-DD' },
        { header: 'Engines Count', key: 'enginesCount', type: 'number', required: true, description: '2 or 4' },
        { header: 'Status', key: 'status', type: 'enum', required: true, enumValues: ['active', 'parked', 'leased'] },
      ],
      exampleRows: [
        {
          registration: 'HZ-A42',
          fleetGroup: 'A330',
          aircraftType: 'A330-243',
          msn: '1234',
          owner: 'Alpha Star Aviation',
          manufactureDate: '2015-06-15',
          enginesCount: 2,
          status: 'active',
        },
      ],
    },

    [ImportType.DailyStatus]: {
      name: 'Daily Status',
      columns: [
        { header: 'Aircraft Registration', key: 'aircraftRegistration', type: 'string', required: true, description: 'e.g., HZ-A42' },
        { header: 'Date', key: 'date', type: 'date', required: true, description: 'YYYY-MM-DD' },
        { header: 'POS Hours', key: 'posHours', type: 'number', required: true, description: 'Possessed hours (0-24, typically 24)' },
        { header: 'NMCM-S Hours', key: 'nmcmSHours', type: 'number', required: true, description: 'Scheduled maintenance downtime (0-24)' },
        { header: 'NMCM-U Hours', key: 'nmcmUHours', type: 'number', required: true, description: 'Unscheduled maintenance downtime (0-24)' },
        { header: 'NMCS Hours', key: 'nmcsHours', type: 'number', required: false, description: 'Supply-related downtime (0-24)' },
        { header: 'Notes', key: 'notes', type: 'string', required: false, description: 'Additional notes' },
      ],
      exampleRows: [
        {
          aircraftRegistration: 'HZ-A42',
          date: '2024-01-15',
          posHours: 24,
          nmcmSHours: 2,
          nmcmUHours: 0,
          nmcsHours: 0,
          notes: 'Scheduled A-check',
        },
      ],
    },

    [ImportType.WorkOrderSummary]: {
      name: 'Work Order Monthly Summary',
      columns: [
        { header: 'Aircraft Registration', key: 'aircraftRegistration', type: 'string', required: true, description: 'e.g., HZ-A42' },
        { header: 'Period', key: 'period', type: 'string', required: true, description: 'YYYY-MM format (e.g., 2024-01)' },
        { header: 'Work Order Count', key: 'workOrderCount', type: 'number', required: true, description: 'Number of work orders (must be >= 0)' },
        { header: 'Total Cost', key: 'totalCost', type: 'number', required: false, description: 'Total cost in USD (must be >= 0)' },
        { header: 'Notes', key: 'notes', type: 'string', required: false, description: 'Additional notes' },
      ],
      exampleRows: [
        {
          aircraftRegistration: 'HZ-A42',
          period: '2024-01',
          workOrderCount: 5,
          totalCost: 15000,
          notes: 'Monthly scheduled maintenance',
        },
        {
          aircraftRegistration: 'HZ-A42',
          period: '2024-02',
          workOrderCount: 3,
          totalCost: 8500,
          notes: '',
        },
      ],
    },

    [ImportType.VacationPlan]: {
      name: 'Vacation Plan',
      columns: [
        { header: 'Employee', key: 'employee', type: 'string', required: true, description: 'Employee name' },
        // Note: Vacation plan has a special format with 48 week columns
        // This template is for reference only - actual import uses special parsing
      ],
      exampleRows: [
        {
          employee: 'John Smith',
          // Week columns would follow (Jan W1, Jan W2, etc.)
        },
      ],
    },
  };


  /**
   * Gets the template definition for a given import type
   */
  getTemplateDefinition(importType: ImportType): TemplateDefinition {
    return this.templates[importType];
  }

  /**
   * Generates an Excel template file for the specified import type
   * Requirements: 10.1
   */
  generateTemplate(importType: ImportType): Buffer {
    const template = this.templates[importType];
    if (!template) {
      throw new Error(`Unknown import type: ${importType}`);
    }

    const workbook = XLSX.utils.book_new();

    // Create data sheet with headers and example rows
    const dataHeaders = template.columns.map((col) => col.header);
    const dataRows = template.exampleRows.map((row) =>
      template.columns.map((col) => row[col.key] ?? ''),
    );

    const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, ...dataRows]);

    // Set column widths
    dataSheet['!cols'] = template.columns.map((col) => ({
      wch: Math.max(col.header.length, 15),
    }));

    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');

    // Create instructions sheet
    const instructionsData = [
      ['Column', 'Type', 'Required', 'Description', 'Allowed Values'],
      ...template.columns.map((col) => [
        col.header,
        col.type,
        col.required ? 'Yes' : 'No',
        col.description || '',
        col.enumValues?.join(', ') || '',
      ]),
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 40 },
      { wch: 40 },
    ];

    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Gets the filename for a template download
   */
  getTemplateFilename(importType: ImportType): string {
    const template = this.templates[importType];
    const safeName = template.name.replace(/\s+/g, '_').toLowerCase();
    return `${safeName}_template.xlsx`;
  }

  /**
   * Gets all available import types
   */
  getAvailableImportTypes(): { type: ImportType; name: string }[] {
    return Object.entries(this.templates).map(([type, def]) => ({
      type: type as ImportType,
      name: def.name,
    }));
  }
}
