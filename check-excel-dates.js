const XLSX = require('xlsx');

const wb = XLSX.readFile('aog_historical_data_import_FIXED.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Total rows:', data.length);
console.log('\nSample rows with Finish Date/Time:');
data.slice(0, 5).forEach((row, i) => {
  console.log(`\nRow ${i+1}:`);
  console.log('  Aircraft:', row['Aircraft']);
  console.log('  Start Date:', row['Start Date']);
  console.log('  Time:', row['Time']);
  console.log('  Finish Date:', row['Finish Date']);
  console.log('  Time.1:', row['Time.1']);
});

// Check how many rows have Finish Date
const withFinishDate = data.filter(row => row['Finish Date'] && row['Finish Date'] !== '');
console.log(`\nRows with Finish Date: ${withFinishDate.length} / ${data.length}`);

// Check how many rows have Time.1
const withFinishTime = data.filter(row => row['Time.1'] && row['Time.1'] !== '');
console.log(`Rows with Finish Time: ${withFinishTime.length} / ${data.length}`);
