/**
 * Convert AOG/OOS data from markdown to Excel format
 * 
 * This script reads the historical AOG/OOS data from aog_oos_seed_data_clean.md
 * and converts it to the Excel format expected by the import system.
 */

const XLSX = require('xlsx');
const fs = require('fs');

// Read the markdown file
const markdownContent = fs.readFileSync('aog_oos_seed_data_clean.md', 'utf-8');

// Parse the markdown table
function parseMarkdownTable(content) {
  const lines = content.split('\n');
  const dataRows = [];
  let inTable = false;
  let headers = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // Check if this is a table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed
        .split('|')
        .slice(1, -1) // Remove first and last empty elements
        .map(cell => cell.trim());
      
      // Skip separator rows (contains dashes)
      if (cells[0] && cells[0].includes('---')) {
        inTable = true;
        continue;
      }
      
      // First row is headers
      if (!inTable && cells.length > 0 && cells[0]) {
        headers = cells;
        continue;
      }
      
      // Data rows
      if (inTable && cells.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = cells[index];
        });
        dataRows.push(row);
      }
    }
  }
  
  return dataRows;
}

// Convert to Excel format
function convertToExcelFormat(data) {
  return data.map(row => {
    // Extract aircraft registration (remove any extra text)
    let aircraft = row['Aircraft'] || '';
    
    // Extract defect description
    let defectDescription = row['WO / Defect'] || '';
    
    // Extract location
    let location = row['Location'] || '';
    
    // Map category
    let category = row['AOG/OOS'] || '';
    // Normalize category values
    const categoryMap = {
      'AOG': 'AOG',
      'S-MX': 'S-MX',
      'U-MX': 'U-MX',
      'MRO': 'MRO',
      'CLEANING': 'CLEANING'
    };
    category = categoryMap[category] || category;
    
    // Parse start date and time
    let startDate = row['Start Date'] || '';
    let startTime = row['Time'] || '';
    
    // Parse finish date and time
    let finishDate = row['Finish Date'] || '';
    let finishTime = row['Time.1'] || '';
    
    return {
      'Aircraft': aircraft,
      'Defect Description': defectDescription,
      'Location': location,
      'Category': category,
      'Start Date': startDate,
      'Start Time': startTime,
      'Finish Date': finishDate,
      'Finish Time': finishTime
    };
  });
}

// Main execution
console.log('Reading AOG/OOS data from markdown...');
const rawData = parseMarkdownTable(markdownContent);
console.log(`Found ${rawData.length} events`);

console.log('\nConverting to Excel format...');
const excelData = convertToExcelFormat(rawData);

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet from data
const worksheet = XLSX.utils.json_to_sheet(excelData);

// Set column widths
worksheet['!cols'] = [
  { wch: 12 },  // Aircraft
  { wch: 50 },  // Defect Description
  { wch: 10 },  // Location
  { wch: 12 },  // Category
  { wch: 12 },  // Start Date
  { wch: 10 },  // Start Time
  { wch: 12 },  // Finish Date
  { wch: 10 }   // Finish Time
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'AOG Events');

// Write to file
const outputFilename = 'aog_historical_data_import.xlsx';
XLSX.writeFile(workbook, outputFilename);

console.log(`\n✅ Success! Created ${outputFilename}`);
console.log(`   Total events: ${excelData.length}`);
console.log('\nNext steps:');
console.log('1. Review the Excel file to ensure data looks correct');
console.log('2. Navigate to the Import page in the dashboard');
console.log('3. Select "AOG Events" as import type');
console.log('4. Upload the Excel file');
console.log('5. Review validation results and confirm import');

// Show sample of first few rows
console.log('\nSample data (first 3 rows):');
excelData.slice(0, 3).forEach((row, index) => {
  console.log(`\n${index + 1}. ${row.Aircraft} - ${row.Category}`);
  console.log(`   ${row['Defect Description']}`);
  console.log(`   ${row['Start Date']} ${row['Start Time']} → ${row['Finish Date']} ${row['Finish Time']}`);
});
