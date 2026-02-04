const XLSX = require('xlsx');

const wb = XLSX.readFile('aog_historical_data_import_FIXED.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Total rows:', data.length);

// Check rows without Finish Date
const withoutFinishDate = data.filter(row => !row['Finish Date'] || row['Finish Date'] === '');
console.log(`\nRows WITHOUT Finish Date: ${withoutFinishDate.length}`);
if (withoutFinishDate.length > 0) {
  console.log('Sample rows without Finish Date:');
  withoutFinishDate.slice(0, 3).forEach((row, i) => {
    console.log(`  ${i+1}. ${row['Aircraft']} - ${row['Category']} - Start: ${row['Start Date']}`);
  });
}

// Check rows WITH Finish Date
const withFinishDate = data.filter(row => row['Finish Date'] && row['Finish Date'] !== '');
console.log(`\nRows WITH Finish Date: ${withFinishDate.length}`);

// Check if Finish Time is present when Finish Date is present
const withFinishDateButNoTime = withFinishDate.filter(row => !row['Finish Time'] || row['Finish Time'] === '');
console.log(`\nRows with Finish Date but NO Finish Time: ${withFinishDateButNoTime.length}`);
if (withFinishDateButNoTime.length > 0) {
  console.log('Sample rows:');
  withFinishDateButNoTime.slice(0, 5).forEach((row, i) => {
    console.log(`  ${i+1}. ${row['Aircraft']} - Finish Date: ${row['Finish Date']}, Finish Time: "${row['Finish Time']}"`);
  });
}
