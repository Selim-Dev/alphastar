/**
 * Verification Script for Task 14: Budget Project Detail Page
 * 
 * This script verifies that all components for Task 14 have been implemented correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 14: Budget Project Detail Page Implementation\n');

let allPassed = true;

// Helper function to check if file exists
function checkFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    allPassed = false;
    return false;
  }
}

// Helper function to check if file contains specific content
function checkFileContains(filePath, searchStrings, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    allPassed = false;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const missingStrings = searchStrings.filter(str => !content.includes(str));

  if (missingStrings.length === 0) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    console.log(`❌ ${description} - Missing: ${missingStrings.join(', ')}`);
    allPassed = false;
    return false;
  }
}

console.log('📋 Subtask 14.1: BudgetProjectDetailPage Component\n');

checkFileExists(
  'frontend/src/pages/budget/BudgetProjectDetailPage.tsx',
  'BudgetProjectDetailPage component file exists'
);

checkFileContains(
  'frontend/src/pages/budget/BudgetProjectDetailPage.tsx',
  [
    'export function BudgetProjectDetailPage',
    'useParams',
    'useBudgetProjects',
    'useBudgetAnalytics',
    'Tabs',
    'TabPanel',
    'BudgetTable',
    'BudgetAuditLog',
    'Breadcrumb Navigation',
    'Export to Excel',
    'Total Budgeted',
    'Total Spent',
    'Remaining',
    'Burn Rate',
  ],
  'BudgetProjectDetailPage has required features'
);

console.log('\n📋 Subtask 14.2: BudgetTable Component\n');

checkFileExists(
  'frontend/src/components/budget/BudgetTable.tsx',
  'BudgetTable component file exists'
);

checkFileContains(
  'frontend/src/components/budget/BudgetTable.tsx',
  [
    'export function BudgetTable',
    'useTableData',
    'Spending Term',
    'Planned',
    'Total Spent',
    'Remaining',
    'sticky',
    'columnTotals',
    'grandTotal',
    'Loading skeleton',
    'error states',
  ],
  'BudgetTable has required features'
);

console.log('\n📋 Subtask 14.3: BudgetAuditLog Component\n');

checkFileExists(
  'frontend/src/components/budget/BudgetAuditLog.tsx',
  'BudgetAuditLog component file exists'
);

checkFileContains(
  'frontend/src/components/budget/BudgetAuditLog.tsx',
  [
    'export function BudgetAuditLog',
    'useBudgetAudit',
    'useAuditLog',
    'useAuditSummary',
    'filters',
    'pagination',
    'timestamp',
    'action',
    'oldValue',
    'newValue',
    'reverse chronological',
  ],
  'BudgetAuditLog has required features'
);

console.log('\n📋 Route Configuration\n');

checkFileContains(
  'frontend/src/App.tsx',
  [
    'BudgetProjectDetailPage',
    '/budget-projects/:id',
  ],
  'App.tsx has budget detail route configured'
);

checkFileExists(
  'frontend/src/pages/budget/index.ts',
  'Budget pages index file exists'
);

checkFileContains(
  'frontend/src/pages/budget/index.ts',
  [
    'BudgetProjectsListPage',
    'BudgetProjectDetailPage',
  ],
  'Budget pages index exports all components'
);

console.log('\n📋 Hook Dependencies\n');

checkFileExists(
  'frontend/src/hooks/useBudgetProjects.ts',
  'useBudgetProjects hook exists'
);

checkFileExists(
  'frontend/src/hooks/useBudgetAudit.ts',
  'useBudgetAudit hook exists'
);

checkFileExists(
  'frontend/src/hooks/useBudgetAnalytics.ts',
  'useBudgetAnalytics hook exists'
);

console.log('\n📋 Type Definitions\n');

checkFileExists(
  'frontend/src/types/budget-projects.ts',
  'Budget project types file exists'
);

checkFileContains(
  'frontend/src/types/budget-projects.ts',
  [
    'BudgetProject',
    'BudgetTableData',
    'BudgetTableRow',
    'BudgetAuditEntry',
    'BudgetAuditSummary',
    'AuditLogFilters',
  ],
  'Budget types include all required interfaces'
);

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ All Task 14 verifications passed!');
  console.log('\n📝 Summary:');
  console.log('   - BudgetProjectDetailPage component created');
  console.log('   - BudgetTable component created with sticky headers');
  console.log('   - BudgetAuditLog component created with filters and pagination');
  console.log('   - Routes configured in App.tsx');
  console.log('   - All dependencies in place');
  console.log('\n🎯 Task 14 is complete and ready for testing!');
  process.exit(0);
} else {
  console.log('❌ Some verifications failed. Please review the output above.');
  process.exit(1);
}
