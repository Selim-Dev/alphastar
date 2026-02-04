const XLSX = require('xlsx');

// Read the Excel file
const wb = XLSX.readFile('aog_historical_data_import_FIXED.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);

console.log('Testing clearedAt logic from import service:\n');

// Test the logic from import.service.ts line 289
function testClearedAtLogic(finishDate, finishTime) {
  // Simulate parser logic
  let clearedAt;
  if (finishDate && finishTime) {
    // Parser would create a Date object
    clearedAt = new Date(`${finishDate}T${finishTime}:00`);
  } else if (!finishDate && !finishTime) {
    // Parser sets to null for active events
    clearedAt = null;
  } else {
    // One but not the other - would be a validation error
    clearedAt = null;
  }
  
  // Import service logic: const clearedAt = (data.clearedAt as Date | null) || undefined;
  const importServiceClearedAt = clearedAt || undefined;
  
  return { parserClearedAt: clearedAt, importServiceClearedAt };
}

// Test with a row that has both dates
const rowWithBoth = data.find(row => row['Finish Date'] && row['Finish Time']);
console.log('1. Row WITH Finish Date and Time:');
console.log(`   Aircraft: ${rowWithBoth['Aircraft']}`);
console.log(`   Finish Date: ${rowWithBoth['Finish Date']}`);
console.log(`   Finish Time: ${rowWithBoth['Finish Time']}`);
const result1 = testClearedAtLogic(rowWithBoth['Finish Date'], rowWithBoth['Finish Time']);
console.log(`   Parser clearedAt: ${result1.parserClearedAt}`);
console.log(`   Import service clearedAt: ${result1.importServiceClearedAt}`);
console.log(`   Is truthy? ${!!result1.importServiceClearedAt}`);

// Test with a row that has neither
const rowWithNeither = data.find(row => !row['Finish Date'] && !row['Finish Time']);
console.log('\n2. Row WITHOUT Finish Date or Time (active):');
console.log(`   Aircraft: ${rowWithNeither['Aircraft']}`);
console.log(`   Finish Date: ${rowWithNeither['Finish Date']}`);
console.log(`   Finish Time: ${rowWithNeither['Finish Time']}`);
const result2 = testClearedAtLogic(rowWithNeither['Finish Date'], rowWithNeither['Finish Time']);
console.log(`   Parser clearedAt: ${result2.parserClearedAt}`);
console.log(`   Import service clearedAt: ${result2.importServiceClearedAt}`);
console.log(`   Is truthy? ${!!result2.importServiceClearedAt}`);

console.log('\n3. The PROBLEM:');
console.log('   When clearedAt is a Date object, (Date || undefined) returns the Date ✓');
console.log('   When clearedAt is null, (null || undefined) returns undefined ✓');
console.log('   Both should work correctly in MongoDB...');
console.log('\n   BUT: The issue might be that the Date object is not being');
console.log('   properly passed through to MongoDB, or there\'s a serialization issue.');
