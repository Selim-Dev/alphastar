/**
 * Script to add missing aircraft to the seed data
 * Run this to update the seed script with the 9 missing aircraft
 */

const fs = require('fs');

const missingAircraft = [
  {
    registration: 'HZ-SKY',
    fleetGroup: 'AIRBUS 340',
    aircraftType: 'A340-212 ACJ',
    msn: 'Unknown',
    owner: 'Alpha Star Aviation',
    enginesCount: 4,
    status: 'active',
    notes: 'Added for historical AOG data import'
  },
  {
    registration: 'HZ-XY7',
    fleetGroup: 'AIRBUS 340',
    aircraftType: 'A340 ACJ',
    msn: 'Unknown',
    owner: 'Alpha Star Aviation',
    enginesCount: 4,
    status: 'active',
    notes: 'Added for historical AOG data import'
  },
  {
    registration: 'M-IIII',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'Gulfstream G650ER',
    msn: 'Unknown',
    owner: 'Alpha Star Aviation',
    enginesCount: 2,
    status: 'active',
    notes: 'Added for historical AOG data import - verify if same as M-III'
  },
  {
    registration: 'SU-SME',
    fleetGroup: 'AIRBUS 320 FAMILY',
    aircraftType: 'A320',
    msn: 'Unknown',
    owner: 'Wet Lease',
    enginesCount: 2,
    status: 'leased',
    notes: 'Wet lease aircraft - Added for historical AOG data import'
  },
  {
    registration: 'SU-SMK',
    fleetGroup: 'AIRBUS 320 FAMILY',
    aircraftType: 'A320',
    msn: 'Unknown',
    owner: 'Wet Lease',
    enginesCount: 2,
    status: 'leased',
    notes: 'Wet lease aircraft - Added for historical AOG data import'
  },
  {
    registration: 'VP-CAL',
    fleetGroup: 'CESSNA',
    aircraftType: 'Citation Bravo',
    msn: 'Unknown',
    owner: 'Sky Prime Aviation',
    enginesCount: 2,
    status: 'active',
    notes: 'Added for historical AOG data import'
  },
  {
    registration: 'VP-CMJ',
    fleetGroup: 'GULFSTREAM',
    aircraftType: 'Gulfstream G450',
    msn: 'Unknown',
    owner: 'Sky Prime Aviation',
    enginesCount: 2,
    status: 'active',
    notes: 'Added for historical AOG data import'
  },
  {
    registration: 'VP-CSK',
    fleetGroup: 'CESSNA',
    aircraftType: 'Citation Bravo',
    msn: 'Unknown',
    owner: 'Sky Prime Aviation',
    enginesCount: 2,
    status: 'active',
    notes: 'Added for historical AOG data import'
  }
];

console.log('Missing Aircraft to Add:\n');
console.log('Copy this code and add it to backend/src/scripts/seed.ts in the AIRCRAFT_DATA array:\n');
console.log('// ===== ADDED FOR HISTORICAL AOG DATA IMPORT =====');

missingAircraft.forEach((aircraft, index) => {
  console.log(`  {`);
  console.log(`    registration: '${aircraft.registration}',`);
  console.log(`    fleetGroup: '${aircraft.fleetGroup}',`);
  console.log(`    aircraftType: '${aircraft.aircraftType}',`);
  console.log(`    msn: '${aircraft.msn}',`);
  console.log(`    owner: '${aircraft.owner}',`);
  console.log(`    enginesCount: ${aircraft.enginesCount},`);
  console.log(`    status: AircraftStatus.${aircraft.status.charAt(0).toUpperCase() + aircraft.status.slice(1)},`);
  console.log(`  },`);
});

console.log('\n📝 Note: "HZ-SKY 1" (with space) was excluded - likely a typo for HZ-SKY1');
console.log('   Please verify and fix in the Excel file before importing.');
