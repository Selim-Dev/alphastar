const XLSX = require('xlsx');

// Aircraft from import file
const wb = XLSX.readFile('aog_historical_data_import.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws);
const importAircraft = [...new Set(data.map(r => r.Aircraft))].filter(a => a && a !== 'AIRCRAFT').sort();

// Aircraft from seed script (based on seed output)
const seedAircraft = [
  'HZ-A42', 'HZ-SKY1', 'HZ-SKY2', 'HZ-SKY4', 'HZ-A2', 'HZ-A3', 'HZ-A4', 'HZ-A5',
  'HZ-A15', 'HZ-A10', 'HZ-A11', 'HZ-A24', 'HZ-A8', 'HZ-A9', 'HZ-A25', 'HZ-A26',
  'HZ-A32', 'HZ-A22', 'HZ-SK2', 'HZ-SK3', 'HZ-SK5', 'HZ-SK7', 'HZ-CMJ', 'HZ-MD6',
  'HZ-MD62', 'M-III', 'VP-CSN'
];

console.log('Aircraft in import file:', importAircraft.length);
console.log('Aircraft in seed script:', seedAircraft.length);
console.log('\nMissing aircraft (need to be created):');

const missing = importAircraft.filter(a => !seedAircraft.includes(a));
missing.forEach(a => console.log('  ❌', a));

console.log('\nAircraft that exist:');
const existing = importAircraft.filter(a => seedAircraft.includes(a));
existing.forEach(a => console.log('  ✅', a));

console.log('\n📊 Summary:');
console.log(`  Total in import: ${importAircraft.length}`);
console.log(`  Existing: ${existing.length}`);
console.log(`  Missing: ${missing.length}`);
