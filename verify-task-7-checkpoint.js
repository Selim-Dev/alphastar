/**
 * Task 7 Checkpoint Verification Script
 * 
 * This script verifies that all data entry and audit trail functionality
 * is working correctly before proceeding to Task 8 (Budget Analytics).
 * 
 * Tests Covered:
 * 1. Budget Project CRUD operations (Task 3)
 * 2. Budget Table Data operations (Task 5)
 * 3. Audit Trail system (Task 6)
 */

const { execSync } = require('child_process');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Task 7: Data Entry & Audit Tests Checkpoint             ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Running comprehensive test suite...');
console.log('');

const tests = [
  {
    name: 'Budget Project CRUD Operations',
    script: 'test-budget-project-crud.js',
    description: 'Tests project creation, listing, retrieval, update, and deletion',
  },
  {
    name: 'Budget Table Data Operations',
    script: 'test-budget-table-data.js',
    description: 'Tests table data retrieval, plan row updates, actual updates, and calculations',
  },
  {
    name: 'Audit Trail System',
    script: 'test-audit-trail.js',
    description: 'Tests audit logging for all mutation operations and audit log retrieval',
  },
];

const results = [];

for (const test of tests) {
  console.log('─'.repeat(60));
  console.log(`Running: ${test.name}`);
  console.log(`Description: ${test.description}`);
  console.log('─'.repeat(60));
  
  try {
    execSync(`node ${test.script}`, { stdio: 'inherit' });
    results.push({ name: test.name, status: 'PASS' });
    console.log('');
  } catch (error) {
    results.push({ name: test.name, status: 'FAIL' });
    console.log('');
    console.error(`✗ Test failed: ${test.name}`);
    console.log('');
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Checkpoint Results Summary                               ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

results.forEach(result => {
  const status = result.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${result.name}`);
});

console.log('');

const allPassed = results.every(r => r.status === 'PASS');

if (allPassed) {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ✅ CHECKPOINT PASSED                                     ║');
  console.log('║                                                            ║');
  console.log('║   All data entry and audit tests are passing.             ║');
  console.log('║   Ready to proceed to Task 8: Budget Analytics Service    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ❌ CHECKPOINT FAILED                                     ║');
  console.log('║                                                            ║');
  console.log('║   Some tests failed. Review errors above.                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  process.exit(1);
}
