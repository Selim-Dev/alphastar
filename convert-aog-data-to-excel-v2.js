/**
 * Convert AOG/OOS data from markdown to Excel format (Version 2 - handles multi-line cells)
 */

const XLSX = require('xlsx');
const fs = require('fs');

// Read the markdown file
const markdownContent = fs.readFileSync('aog_oos_seed_data_clean.md', 'utf-8');

// Parse the markdown table (handles multi-line cells)
function parseMarkdownTable(content) {
  const lines = content.split('\n');
  const dataRows = [];
  let headers = [];
  let inTable = false;
  let currentRow = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      if (currentRow && inTable) {
        // End of table
        if (currentRow.AIRCRAFT && currentRow.AIRCRAFT.trim()) {
          dataRows.push(currentRow);
        }
        currentRow = null;
      }
      continue;
    }
    
    // Check if this is a table row
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
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
        console.log('Headers found:', headers);
        continue;
      }
      
      // Data rows
      if (inTable && cells.length === headers.length) {
        // Save previous row if exists
        if (currentRow && currentRow.AIRCRAFT && currentRow.AIRCRAFT.trim()) {
          dataRows.push(currentRow);
        }
        
        // Start new row
        currentRow = {};
        headers.forEach((header, index) => {
          currentRow[header] = cells[index];
        });
      }
    }
  }
  
  // Don't forget the last row
  if (currentRow && currentRow.AIRCRAFT && currentRow.AIRCRAFT.trim()) {
    dataRows.push(currentRow);
  }
  
  return dataRows;
}

// Convert to Excel format
function convertToExcelFormat(data) {
  return data.map(row => {
    // Extract aircraft registration
    let aircraft = row['AIRCRAFT'] || '';
    
    // Extract defect description
    let defectDescription = row['WO / Defect'] || '';
    
    // Extract location
    let location = row['Location'] || '';
    
    // Map category
    let category = row['AOG/OOS'] || '';
    
    // Parse start date and time
    let startDate = row['Start Date'] || '';
    let startTime = row['Time'] || '';
    
    // Parse finish date and time
    let finishDate = row['Finish Date'] || '';
    let finishTime = row['Time.1'] || '';
    
    return {
      'Aircraft': aircraft.trim(),
      'Defect Description': defectDescription.trim(),
      'Location': location.trim(),
      'Category': category.trim(),
      'Start Date': startDate.trim(),
      'Start Time': startTime.trim(),
      'Finish Date': finishDate.trim(),
      'Finish Time': finishTime.trim()
    };
  });
}

// Main execution
console.log('Reading AOG/OOS data from markdown...');
const rawData = parseMarkdownTable(markdownContent);
console.log(`Found ${rawData.length} events`);

console.log('\nConverting to Excel format...');
const excelData = convertToExcelFormat(rawData);

// Filter out rows with empty aircraft
const validData = excelData.filter(row => row.Aircraft && row.Aircraft.trim());
console.log(`Valid events with aircraft: ${validData.length}`);

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet from data
const worksheet = XLSX.utils.json_to_sheet(validData);

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
console.log(`   Total events: ${validData.length}`);
console.log('\nNext steps:');
console.log('1. Review the Excel file to ensure data looks correct');
console.log('2. Navigate to the Import page in the dashboard');
console.log('3. Select "AOG Events" as import type');
console.log('4. Upload the Excel file');
console.log('5. Review validation results and confirm import');

// Show sample of first few rows
console.log('\nSample data (first 5 rows):');
validData.slice(0, 5).forEach((row, index) => {
  console.log(`\n${index + 1}. ${row.Aircraft} - ${row.Category}`);
  console.log(`   ${row['Defect Description']}`);
  console.log(`   ${row['Start Date']} ${row['Start Time']} → ${row['Finish Date']} ${row['Finish Time']}`);
});
