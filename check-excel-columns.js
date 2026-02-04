const XLSX = require('xlsx');

const wb = XLSX.readFile('aog_historical_data_import_FIXED.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Column names in first row:');
if (data.length > 0) {
  console.log(Object.keys(data[0]));
}

console.log('\nFirst row data:');
console.log(JSON.stringify(data[0], null, 2));
