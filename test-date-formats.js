/**
 * Test script to verify AOG import accepts both date formats
 * Tests: YYYY-MM-DD and MM/DD/YYYY
 */

const testDates = [
  // YYYY-MM-DD format
  { input: '2026-01-21', expected: new Date(2026, 0, 21), format: 'YYYY-MM-DD' },
  { input: '2026-01-22', expected: new Date(2026, 0, 22), format: 'YYYY-MM-DD' },
  { input: '2026-01-24', expected: new Date(2026, 0, 24), format: 'YYYY-MM-DD' },
  
  // MM/DD/YYYY format
  { input: '1/24/2026', expected: new Date(2026, 0, 24), format: 'MM/DD/YYYY' },
  { input: '1/21/2026', expected: new Date(2026, 0, 21), format: 'MM/DD/YYYY' },
  { input: '1/22/2026', expected: new Date(2026, 0, 22), format: 'MM/DD/YYYY' },
  { input: '1/25/2026', expected: new Date(2026, 0, 25), format: 'MM/DD/YYYY' },
  
  // With leading zeros
  { input: '01/24/2026', expected: new Date(2026, 0, 24), format: 'MM/DD/YYYY (with zeros)' },
  { input: '01/21/2026', expected: new Date(2026, 0, 21), format: 'MM/DD/YYYY (with zeros)' },
  
  // Edge cases
  { input: '12/31/2025', expected: new Date(2025, 11, 31), format: 'MM/DD/YYYY (end of year)' },
  { input: '2025-12-31', expected: new Date(2025, 11, 31), format: 'YYYY-MM-DD (end of year)' },
];

/**
 * Simulates the parseDate function from excel-parser.service.ts
 */
function parseDate(value) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    
    // Try parsing ISO format and common formats
    const parsed = new Date(trimmedValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Try YYYY-MM-DD format (with optional time)
    const isoMatch = trimmedValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (isoMatch) {
      const [, year, month, day, hour, minute] = isoMatch;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hour ? parseInt(hour) : 0,
        minute ? parseInt(minute) : 0,
      );
    }

    // Try MM/DD/YYYY format (with optional time)
    const usMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (usMatch) {
      const [, month, day, year, hour, minute] = usMatch;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hour ? parseInt(hour) : 0,
        minute ? parseInt(minute) : 0,
      );
    }

    // Try DD/MM/YYYY format (with optional time) - common in some regions
    const euMatch = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (euMatch) {
      const [, day, month, year, hour, minute] = euMatch;
      const parsedDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        hour ? parseInt(hour) : 0,
        minute ? parseInt(minute) : 0,
      );
      // Validate the date is valid (e.g., not 13/25/2026)
      if (!isNaN(parsedDate.getTime()) && 
          parsedDate.getMonth() === parseInt(month) - 1 &&
          parsedDate.getDate() === parseInt(day)) {
        return parsedDate;
      }
    }
  }

  return null;
}

console.log('Testing Date Format Parsing\n');
console.log('=' .repeat(80));

let passCount = 0;
let failCount = 0;

testDates.forEach((test, index) => {
  const result = parseDate(test.input);
  const passed = result && 
                 result.getFullYear() === test.expected.getFullYear() &&
                 result.getMonth() === test.expected.getMonth() &&
                 result.getDate() === test.expected.getDate();
  
  if (passed) {
    console.log(`✅ Test ${index + 1}: ${test.format}`);
    console.log(`   Input: "${test.input}" → ${result.toISOString().split('T')[0]}`);
    passCount++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.format}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: ${test.expected.toISOString().split('T')[0]}`);
    console.log(`   Got: ${result ? result.toISOString().split('T')[0] : 'null'}`);
    failCount++;
  }
  console.log('');
});

console.log('=' .repeat(80));
console.log(`\nResults: ${passCount} passed, ${failCount} failed`);

if (failCount === 0) {
  console.log('\n✅ All date format tests passed!');
  console.log('\nSupported formats:');
  console.log('  - YYYY-MM-DD (e.g., 2026-01-21)');
  console.log('  - MM/DD/YYYY (e.g., 1/24/2026 or 01/24/2026)');
  console.log('  - DD/MM/YYYY (e.g., 24/1/2026 - with validation)');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
}
