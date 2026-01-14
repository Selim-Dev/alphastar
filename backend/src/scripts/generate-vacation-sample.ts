/**
 * Script to generate a sample vacation plan Excel file for demo/import
 * Run with: npx ts-node src/scripts/generate-vacation-sample.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Engineering team employees with realistic vacation patterns
const engineeringEmployees: { name: string; vacations: [number, number][] }[] = [
  { name: 'Ahmed Al-Rashid', vacations: [[3, 1], [4, 1], [15, 0.5], [28, 1], [29, 1], [30, 1], [44, 0.5]] },
  { name: 'Fatima Hassan', vacations: [[8, 1], [20, 1], [21, 1], [32, 0.5], [45, 1]] },
  { name: 'Mohammed Ali', vacations: [[5, 1], [16, 1], [17, 1], [36, 1], [37, 1]] },
  { name: 'Sara Abdullah', vacations: [[10, 0.5], [11, 1], [24, 1], [25, 1], [40, 1]] },
  { name: 'Khalid Ibrahim', vacations: [[6, 1], [7, 0.5], [22, 1], [23, 1], [38, 1], [39, 0.5]] },
  { name: 'Noura Al-Mutairi', vacations: [[12, 1], [26, 1], [27, 1], [42, 1], [43, 1]] },
  { name: 'Omar Saleh', vacations: [[2, 0.5], [14, 1], [30, 1], [31, 1], [46, 1]] },
  { name: 'Layla Mahmoud', vacations: [[9, 1], [18, 1], [19, 0.5], [34, 1], [35, 1]] },
];

// TPL team employees with realistic vacation patterns
const tplEmployees: { name: string; vacations: [number, number][] }[] = [
  { name: 'Yusuf Al-Qahtani', vacations: [[4, 1], [5, 1], [20, 1], [21, 1], [36, 0.5]] },
  { name: 'Aisha Bakr', vacations: [[8, 0.5], [9, 1], [24, 1], [25, 1], [40, 1]] },
  { name: 'Hassan Nasser', vacations: [[12, 1], [13, 1], [28, 1], [29, 0.5], [44, 1]] },
  { name: 'Maryam Al-Dosari', vacations: [[2, 1], [16, 1], [17, 1], [32, 1], [33, 1]] },
  { name: 'Abdullah Faisal', vacations: [[6, 1], [7, 1], [22, 0.5], [38, 1], [39, 1]] },
  { name: 'Reem Al-Harbi', vacations: [[10, 1], [11, 0.5], [26, 1], [27, 1], [42, 1], [43, 0.5]] },
];

function generateCells(vacations: [number, number][]): number[] {
  const cells = new Array(48).fill(0);
  for (const [weekIndex, value] of vacations) {
    if (weekIndex >= 0 && weekIndex < 48) {
      cells[weekIndex] = value;
    }
  }
  return cells;
}

function createSheetData(employees: { name: string; vacations: [number, number][] }[]): unknown[][] {
  // Header row: Employee name + 48 week columns
  const headers = ['Employee'];
  for (let i = 1; i <= 48; i++) {
    headers.push(`W${i}`);
  }
  headers.push('Total');

  const data: unknown[][] = [headers];

  // Employee rows
  for (const emp of employees) {
    const cells = generateCells(emp.vacations);
    const total = cells.reduce((sum, val) => sum + val, 0);
    const row = [emp.name, ...cells, total];
    data.push(row);
  }

  return data;
}

function generateVacationPlanExcel(): void {
  const workbook = XLSX.utils.book_new();

  // Create Engineering sheet
  const engineeringData = createSheetData(engineeringEmployees);
  const engineeringSheet = XLSX.utils.aoa_to_sheet(engineeringData);
  
  // Set column widths
  engineeringSheet['!cols'] = [
    { wch: 20 }, // Employee name column
    ...new Array(48).fill({ wch: 5 }), // Week columns
    { wch: 8 }, // Total column
  ];
  
  XLSX.utils.book_append_sheet(workbook, engineeringSheet, 'Engineering');

  // Create TPL sheet
  const tplData = createSheetData(tplEmployees);
  const tplSheet = XLSX.utils.aoa_to_sheet(tplData);
  
  // Set column widths
  tplSheet['!cols'] = [
    { wch: 20 }, // Employee name column
    ...new Array(48).fill({ wch: 5 }), // Week columns
    { wch: 8 }, // Total column
  ];
  
  XLSX.utils.book_append_sheet(workbook, tplSheet, 'TPL');

  // Write to file
  const outputPath = path.join(__dirname, '..', '..', '..', 'vacation-plan-sample-2026.xlsx');
  XLSX.writeFile(workbook, outputPath);
  
  console.log(`✅ Sample vacation plan Excel file generated: ${outputPath}`);
  console.log('\nEngineering Team:');
  for (const emp of engineeringEmployees) {
    const total = emp.vacations.reduce((sum, [, val]) => sum + val, 0);
    console.log(`  - ${emp.name}: ${total} weeks`);
  }
  console.log('\nTPL Team:');
  for (const emp of tplEmployees) {
    const total = emp.vacations.reduce((sum, [, val]) => sum + val, 0);
    console.log(`  - ${emp.name}: ${total} weeks`);
  }
}

generateVacationPlanExcel();
