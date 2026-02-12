import { Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { BudgetProjectsService } from './budget-projects.service';
import { BudgetTemplatesService } from './budget-templates.service';

/**
 * Budget Export Service
 * 
 * Handles Excel export functionality for budget projects.
 * Generates Excel files matching the RSAF template structure.
 * 
 * Requirements: 7.5, 7.6, 7.7, 7.8
 */
@Injectable()
export class BudgetExportService {
  constructor(
    private readonly budgetProjectsService: BudgetProjectsService,
    private readonly budgetTemplatesService: BudgetTemplatesService,
  ) {}

  /**
   * Exports budget project to Excel file
   * 
   * Requirements: 7.5, 7.6, 7.7, 7.8
   * 
   * @param projectId - Budget project ID
   * @param filters - Optional filters for data export
   * @returns Excel file buffer
   */
  async exportToExcel(
    projectId: string,
    filters?: {
      aircraftTypes?: string[];
      termCategories?: string[];
      dateRange?: { start: Date; end: Date };
    },
  ): Promise<Buffer> {
    // Get project details
    const project = await this.budgetProjectsService.findOne(projectId);
    if (!project) {
      throw new NotFoundException(`Budget project ${projectId} not found`);
    }

    // Get template definition
    const template = this.budgetTemplatesService.getTemplate(project.templateType);

    // Get table data (includes plan rows and actuals)
    const tableData = await this.budgetProjectsService.getTableData(projectId);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Generate worksheet based on template type
    let worksheet: XLSX.WorkSheet;
    
    if (project.templateType === 'RSAF') {
      worksheet = this.generateRSAFWorksheet(project, tableData, template, filters);
    } else {
      // Generic template export
      worksheet = this.generateGenericWorksheet(project, tableData, template, filters);
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, project.templateType);

    // Generate Excel file buffer
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
    });

    return buffer;
  }

  /**
   * Generates RSAF template worksheet
   * 
   * @param project - Budget project
   * @param tableData - Table data with plan rows and actuals
   * @param template - Budget template definition
   * @param filters - Optional filters
   * @returns XLSX worksheet
   */
  private generateRSAFWorksheet(
    project: any,
    tableData: any,
    template: any,
    filters?: any,
  ): XLSX.WorkSheet {
    const worksheet: XLSX.WorkSheet = {};
    const range = { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };

    // Define column mapping
    const termColumn = 'D';
    const plannedColumns = ['E', 'F', 'G', 'H']; // A330, G650ER-1, G650ER-2, PMO
    const actualColumns = template.excelStructure.actualColumns; // O-AX (36 columns)

    // Aircraft type mapping
    const aircraftTypes = ['A330', 'G650ER-1', 'G650ER-2', 'PMO'];

    // Row 1: Title (optional)
    this.setCellValue(worksheet, 'D', 1, 'RSAF Budget Template');
    
    // Row 2: Project info
    this.setCellValue(worksheet, 'D', 2, 'Project:');
    this.setCellValue(worksheet, 'E', 2, project.name);

    // Row 3: Headers (aircraft columns)
    this.setCellValue(worksheet, 'C', 3, '#');
    this.setCellValue(worksheet, 'D', 3, 'Clause Description');
    
    for (let i = 0; i < plannedColumns.length; i++) {
      this.setCellValue(worksheet, plannedColumns[i], 3, `${aircraftTypes[i]} Total`);
    }
    
    this.setCellValue(worksheet, 'I', 3, 'Total Budgeted');
    this.setCellValue(worksheet, 'K', 3, 'Total Budget Spent');
    this.setCellValue(worksheet, 'M', 3, 'Remaining Total Budget');

    // Row 4: Month headers for actual columns
    const periods = tableData.periods || [];
    for (let i = 0; i < actualColumns.length && i < periods.length; i++) {
      const col = actualColumns[i];
      const period = periods[i];
      const date = new Date(period);
      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      this.setCellValue(worksheet, col, 4, monthName);
    }

    // Data rows (starting from row 5)
    let currentRow = 5;
    const rowsByTerm = this.groupRowsByTerm(tableData.rows);

    let clauseNumber = 1;
    for (const [termName, rows] of Object.entries(rowsByTerm)) {
      // Clause number
      this.setCellValue(worksheet, 'C', currentRow, clauseNumber);
      
      // Term name
      this.setCellValue(worksheet, termColumn, currentRow, termName);

      // Planned amounts by aircraft type
      const plannedByAircraft: Record<string, number> = {};
      for (const row of rows as any[]) {
        const aircraftType = row.aircraftType || 'Unknown';
        plannedByAircraft[aircraftType] = (plannedByAircraft[aircraftType] || 0) + row.plannedAmount;
      }

      // Write planned amounts
      for (let i = 0; i < aircraftTypes.length; i++) {
        const amount = plannedByAircraft[aircraftTypes[i]] || 0;
        this.setCellValue(worksheet, plannedColumns[i], currentRow, amount);
        this.setCellFormat(worksheet, plannedColumns[i], currentRow, '#,##0.00');
      }

      // Total budgeted formula
      const totalBudgetedFormula = `=${plannedColumns.map(col => `${col}${currentRow}`).join('+')}`;
      this.setCellFormula(worksheet, 'I', currentRow, totalBudgetedFormula);
      this.setCellFormat(worksheet, 'I', currentRow, '#,##0.00');

      // Actual amounts by period
      const actualsByPeriod: Record<string, number> = {};
      for (const row of rows as any[]) {
        for (const [period, amount] of Object.entries(row.actuals || {})) {
          actualsByPeriod[period] = (actualsByPeriod[period] || 0) + (amount as number);
        }
      }

      // Write actual amounts
      for (let i = 0; i < actualColumns.length && i < periods.length; i++) {
        const col = actualColumns[i];
        const period = periods[i];
        const amount = actualsByPeriod[period] || 0;
        
        if (amount > 0) {
          this.setCellValue(worksheet, col, currentRow, amount);
          this.setCellFormat(worksheet, col, currentRow, '#,##0.00');
        }
      }

      // Total spent formula
      const actualColsRange = `${actualColumns[0]}${currentRow}:${actualColumns[actualColumns.length - 1]}${currentRow}`;
      this.setCellFormula(worksheet, 'K', currentRow, `=SUM(${actualColsRange})`);
      this.setCellFormat(worksheet, 'K', currentRow, '#,##0.00');

      // Remaining budget formula
      this.setCellFormula(worksheet, 'M', currentRow, `=I${currentRow}-K${currentRow}`);
      this.setCellFormat(worksheet, 'M', currentRow, '#,##0.00');

      currentRow++;
      clauseNumber++;
    }

    // Totals row
    const totalsRow = currentRow;
    this.setCellValue(worksheet, 'D', totalsRow, 'TOTAL');
    
    // Sum formulas for totals
    for (const col of [...plannedColumns, 'I', 'K', 'M']) {
      const sumFormula = `=SUM(${col}5:${col}${totalsRow - 1})`;
      this.setCellFormula(worksheet, col, totalsRow, sumFormula);
      this.setCellFormat(worksheet, col, totalsRow, '#,##0.00');
    }

    // Set range
    range.e.r = totalsRow;
    range.e.c = XLSX.utils.decode_col(actualColumns[actualColumns.length - 1]);
    worksheet['!ref'] = XLSX.utils.encode_range(range);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // C: #
      { wch: 40 }, // D: Clause Description
      { wch: 15 }, // E-H: Aircraft columns
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }, // I: Total Budgeted
      { wch: 5 },  // J: spacer
      { wch: 15 }, // K: Total Spent
      { wch: 5 },  // L: spacer
      { wch: 15 }, // M: Remaining
    ];

    return worksheet;
  }

  /**
   * Generates generic template worksheet
   * 
   * @param project - Budget project
   * @param tableData - Table data
   * @param template - Template definition
   * @param filters - Optional filters
   * @returns XLSX worksheet
   */
  private generateGenericWorksheet(
    project: any,
    tableData: any,
    template: any,
    filters?: any,
  ): XLSX.WorkSheet {
    // Simple table format for non-RSAF templates
    const data: any[][] = [];

    // Headers
    const headers = ['Term', 'Category', 'Aircraft', 'Planned', ...tableData.periods, 'Total Spent', 'Remaining'];
    data.push(headers);

    // Data rows
    for (const row of tableData.rows) {
      const rowData = [
        row.termName,
        row.termCategory,
        row.aircraftType || 'All',
        row.plannedAmount,
      ];

      // Add actual amounts for each period
      for (const period of tableData.periods) {
        rowData.push(row.actuals[period] || 0);
      }

      // Add totals
      rowData.push(row.totalSpent);
      rowData.push(row.remaining);

      data.push(rowData);
    }

    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    return worksheet;
  }

  /**
   * Groups table rows by term name
   * 
   * @param rows - Table rows
   * @returns Map of term name to rows
   */
  private groupRowsByTerm(rows: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();

    for (const row of rows) {
      const termName = row.termName;
      if (!grouped.has(termName)) {
        grouped.set(termName, []);
      }
      grouped.get(termName)!.push(row);
    }

    return grouped;
  }

  /**
   * Sets cell value in worksheet
   * 
   * @param worksheet - XLSX worksheet
   * @param col - Column letter
   * @param row - Row number (1-based)
   * @param value - Cell value
   */
  private setCellValue(worksheet: XLSX.WorkSheet, col: string, row: number, value: any): void {
    const cellAddress = `${col}${row}`;
    worksheet[cellAddress] = { v: value, t: typeof value === 'number' ? 'n' : 's' };
  }

  /**
   * Sets cell formula in worksheet
   * 
   * @param worksheet - XLSX worksheet
   * @param col - Column letter
   * @param row - Row number (1-based)
   * @param formula - Excel formula (without leading =)
   */
  private setCellFormula(worksheet: XLSX.WorkSheet, col: string, row: number, formula: string): void {
    const cellAddress = `${col}${row}`;
    worksheet[cellAddress] = { f: formula, t: 'n' };
  }

  /**
   * Sets cell number format
   * 
   * @param worksheet - XLSX worksheet
   * @param col - Column letter
   * @param row - Row number (1-based)
   * @param format - Excel number format
   */
  private setCellFormat(worksheet: XLSX.WorkSheet, col: string, row: number, format: string): void {
    const cellAddress = `${col}${row}`;
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].z = format;
    }
  }
}
