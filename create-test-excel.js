const XLSX = require('xlsx');

// Create test data matching the AOG import format
const testData = [
  {
    'Aircraft': 'HZ-A42',
    'Defect Description': 'Engine hydraulic leak',
    'Location': 'OERK',
    'Category': 'AOG',
    'Start Date': '2024-01-15',
    'Start Time': '08:30',
    'Finish Date': '2024-01-17',
    'Finish Time': '14:45'
  },
  {
    'Aircraft': 'HZ-SKY2',
    'Defect Description': 'Scheduled A-check',
    'Location': 'LFSB',
    'Category': 'S-MX',
    'Start Date': '2024-02-01',
    'Start Time': '09:00',
    'Finish Date': '2024-02-05',
    'Finish Time': '17:00'
  },
  {
    'Aircraft': 'HZ-A10',
    'Defect Description': 'Engine replacement - Still ongoing',
    'Location': 'OERK',
    'Category': 'U-MX',
    'Start Date': '2025-01-03',
    'Start Time': '07:00',
    'Finish Date': '',
    'Finish Time': ''
  },
  {
    'Aircraft': 'HZ-SKY4',
    'Defect Description': 'APU malfunction',
    'Location': 'OERK',
    'Category': 'AOG',
    'Start Date': '2024-03-10',
    'Start Time': '14:20',
    'Finish Date': '2024-03-12',
    'Finish Time': '09:15'
  },
  {
    'Aircraft': 'HZ-A2',
    'Defect Description': 'Landing gear inspection',
    'Location': 'LFSB',
    'Category': 'S-MX',
    'Start Date': '2024-04-05',
    'Start Time': '08:00',
    'Finish Date': '2024-04-08',
    'Finish Time': '16:00'
  },
  {
    'Aircraft': 'HZ-A3',
    'Defect Description': 'Cabin cleaning and refurbishment',
    'Location': 'OERK',
    'Category': 'CLEANING',
    'Start Date': '2024-05-12',
    'Start Time': '06:00',
    'Finish Date': '2024-05-13',
    'Finish Time': '18:00'
  },
  {
    'Aircraft': 'HZ-A4',
    'Defect Description': 'Major overhaul at MRO facility',
    'Location': 'LFSB',
    'Category': 'MRO',
    'Start Date': '2024-06-01',
    'Start Time': '08:00',
    'Finish Date': '2024-07-15',
    'Finish Time': '17:00'
  }
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from data
const ws = XLSX.utils.json_to_sheet(testData);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Data');

// Write file
XLSX.writeFile(wb, 'test_aog_import.xlsx');

console.log('✓ Test Excel file created: test_aog_import.xlsx');
console.log(`✓ Contains ${testData.length} test AOG events`);
console.log('✓ Includes: 2 resolved AOG, 1 active event, 2 scheduled, 1 unscheduled, 1 MRO, 1 cleaning');
