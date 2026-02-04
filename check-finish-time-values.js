const XLSX = require('xlsx');

const wb = XLSX.readFile('aog_historical_data_import_FIXED.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

// Check rows WITH both Finish Date and Finish Time
const withBoth = data.filter(row => 
  row['Finish Date'] && row['Finish Date'] !== '' &&
  row['Finish Time'] && row['Finish Time'] !== ''
);

console.log(`Rows with BOTH Finish Date AND Finish Time: ${withBoth.length} / ${data.length}`);

console.log('\nSample rows with both:');
withBoth.slice(0, 5).forEach((row, i) => {
  console.log(`${i+1}. ${row['Aircraft']}`);
  console.log(`   Start: ${row['Start Date']} ${row['Start Time']}`);
  console.log(`   Finish: ${row['Finish Date']} ${row['Finish Time']}`);
});

// Check what types the Finish Time values are
console.log('\nFinish Time value types:');
withBoth.slice(0, 5).forEach((row, i) => {
  console.log(`${i+1}. Type: ${typeof row['Finish Time']}, Value: "${row['Finish Time']}"`);
});
