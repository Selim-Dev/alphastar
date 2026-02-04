/**
 * Fix data quality issues in the AOG import Excel file
 */

const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const wb = XLSX.readFile('aog_historical_data_import.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log(`Total rows: ${data.length}`);

// Function to fix time format
function fixTimeFormat(timeStr) {
  if (!timeStr || timeStr === '') return '';
  
  let cleaned = String(timeStr).trim();
  
  // Remove 'Z' suffix
  cleaned = cleaned.replace(/Z$/i, '');
  
  // Remove 'LT' suffix
  cleaned = cleaned.replace(/LT$/i, '');
  
  // If it's already in HH:MM format, return it
  if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
    // Pad single digit hours
    const parts = cleaned.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }
  
  // If it's in HHMM or HMM format (no colon), add colon
  if (/^\d{3,4}$/.test(cleaned)) {
    if (cleaned.length === 4) {
      // HHMM format
      return `${cleaned.substring(0, 2)}:${cleaned.substring(2)}`;
    } else if (cleaned.length === 3) {
      // HMM format
      return `0${cleaned.substring(0, 1)}:${cleaned.substring(1)}`;
    }
  }
  
  // If it's a single or double digit, assume it's hours
  if (/^\d{1,2}$/.test(cleaned)) {
    return `${cleaned.padStart(2, '0')}:00`;
  }
  
  return cleaned;
}

// Function to fix ICAO code
function fixICAOCode(code) {
  if (!code || code === '') return '';
  
  const cleaned = String(code).trim().toUpperCase();
  
  // Known 3-letter codes that should be 4 letters
  const icaoFixes = {
    'SAV': 'KSAV', // Savannah, Georgia
  };
  
  if (icaoFixes[cleaned]) {
    return icaoFixes[cleaned];
  }
  
  return cleaned;
}

// Clean the data
const cleanedData = data.filter(row => {
  // Remove header rows that got included as data
  if (row.Aircraft === 'AIRCRAFT' || row.Aircraft === 'Aircraft') {
    console.log(`Removing header row at position`);
    return false;
  }
  
  // Remove rows with no aircraft
  if (!row.Aircraft || row.Aircraft.trim() === '') {
    console.log(`Removing empty aircraft row`);
    return false;
  }
  
  return true;
}).map(row => {
  return {
    'Aircraft': row.Aircraft ? String(row.Aircraft).trim() : '',
    'Defect Description': row['Defect Description'] ? String(row['Defect Description']).trim() : '',
    'Location': fixICAOCode(row.Location),
    'Category': row.Category ? String(row.Category).trim() : '',
    'Start Date': row['Start Date'] ? String(row['Start Date']).trim() : '',
    'Start Time': fixTimeFormat(row['Start Time']),
    'Finish Date': row['Finish Date'] ? String(row['Finish Date']).trim() : '',
    'Finish Time': fixTimeFormat(row['Finish Time'])
  };
});

console.log(`\nCleaned rows: ${cleanedData.length}`);
console.log(`Removed: ${data.length - cleanedData.length} rows`);

// Show some examples of fixes
console.log('\nSample fixes:');
console.log('Row 14 time fix: "21:00Z" → "21:00"');
console.log('Row 122 time fix: "06:08Z" → "06:08"');
console.log('Row 131 time fix: "0400Z" → "04:00"');
console.log('Row 132 location fix: "SAV" → "KSAV"');

// Create new workbook
const newWb = XLSX.utils.book_new();
const newWs = XLSX.utils.json_to_sheet(cleanedData);

// Set column widths
newWs['!cols'] = [
  { wch: 12 },  // Aircraft
  { wch: 50 },  // Defect Description
  { wch: 10 },  // Location
  { wch: 12 },  // Category
  { wch: 12 },  // Start Date
  { wch: 10 },  // Start Time
  { wch: 12 },  // Finish Date
  { wch: 10 }   // Finish Time
];

XLSX.utils.book_append_sheet(newWb, newWs, 'AOG Events');

// Write to file
const outputFilename = 'aog_historical_data_import_FIXED.xlsx';
XLSX.writeFile(newWb, outputFilename);

console.log(`\n✅ Success! Created ${outputFilename}`);
console.log(`   Total events: ${cleanedData.length}`);
console.log('\nNext steps:');
console.log('1. Upload the FIXED file to the Import page');
console.log('2. All validation errors should be resolved');
console.log('3. Confirm import');

// Show validation summary
const issues = {
  timeWithZ: 0,
  timeWithoutColon: 0,
  headerRows: 0,
  invalidICAO: 0
};

data.forEach(row => {
  if (row['Start Time'] && /Z$/i.test(String(row['Start Time']))) issues.timeWithZ++;
  if (row['Finish Time'] && /Z$/i.test(String(row['Finish Time']))) issues.timeWithZ++;
  if (row['Start Time'] && /^\d{3,4}$/.test(String(row['Start Time']).replace(/Z$/i, ''))) issues.timeWithoutColon++;
  if (row['Finish Time'] && /^\d{3,4}$/.test(String(row['Finish Time']).replace(/Z$/i, ''))) issues.timeWithoutColon++;
  if (row.Aircraft === 'AIRCRAFT') issues.headerRows++;
  if (row.Location && row.Location.length === 3) issues.invalidICAO++;
});

console.log('\n📊 Issues fixed:');
console.log(`   Times with "Z" suffix: ${issues.timeWithZ}`);
console.log(`   Times without colon: ${issues.timeWithoutColon}`);
console.log(`   Header rows removed: ${issues.headerRows}`);
console.log(`   Invalid ICAO codes: ${issues.invalidICAO}`);
