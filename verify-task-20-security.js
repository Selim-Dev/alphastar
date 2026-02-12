/**
 * Task 20 Security & Authorization Verification Script
 * 
 * This script verifies that role-based access control is properly implemented
 * for the Budget & Cost Revamp feature.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Task 20: Security & Authorization Verification\n');
console.log('=' .repeat(60));

// Check files exist
const filesToCheck = [
  'frontend/src/pages/budget/BudgetProjectsListPage.tsx',
  'frontend/src/pages/budget/BudgetProjectDetailPage.tsx',
  'frontend/src/components/budget/BudgetTable.tsx',
  'backend/src/budget-projects/controllers/budget-projects.controller.ts',
  'backend/src/budget-projects/controllers/budget-audit.controller.ts',
  'backend/src/budget-projects/controllers/budget-analytics.controller.ts',
  'backend/src/budget-projects/controllers/budget-import-export.controller.ts',
];

console.log('\n📁 Checking files exist...\n');
let allFilesExist = true;
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some files are missing!');
  process.exit(1);
}

// Check backend role decorators
console.log('\n🔐 Checking backend role decorators...\n');

const budgetProjectsController = fs.readFileSync(
  'backend/src/budget-projects/controllers/budget-projects.controller.ts',
  'utf8'
);

const checks = [
  {
    name: 'Create endpoint has Editor/Admin role',
    pattern: /@Post\(\)[\s\S]*?@Roles\(UserRole\.Editor, UserRole\.Admin\)/,
    file: 'budget-projects.controller.ts'
  },
  {
    name: 'Update endpoint has Editor/Admin role',
    pattern: /@Put\(':id'\)[\s\S]*?@Roles\(UserRole\.Editor, UserRole\.Admin\)/,
    file: 'budget-projects.controller.ts'
  },
  {
    name: 'Delete endpoint has Admin role only',
    pattern: /@Delete\(':id'\)[\s\S]*?@Roles\(UserRole\.Admin\)/,
    file: 'budget-projects.controller.ts'
  },
  {
    name: 'Update plan row has Editor/Admin role',
    pattern: /@Patch\(':id\/plan-row\/:rowId'\)[\s\S]*?@Roles\(UserRole\.Editor, UserRole\.Admin\)/,
    file: 'budget-projects.controller.ts'
  },
  {
    name: 'Update actual has Editor/Admin role',
    pattern: /@Patch\(':id\/actual\/:period'\)[\s\S]*?@Roles\(UserRole\.Editor, UserRole\.Admin\)/,
    file: 'budget-projects.controller.ts'
  },
];

checks.forEach(check => {
  const passed = check.pattern.test(budgetProjectsController);
  console.log(`${passed ? '✅' : '❌'} ${check.name}`);
});

// Check import/export controller
const importExportController = fs.readFileSync(
  'backend/src/budget-projects/controllers/budget-import-export.controller.ts',
  'utf8'
);

const importExportChecks = [
  {
    name: 'Import endpoint has Editor/Admin role',
    pattern: /@Post\('import'\)[\s\S]*?@Roles\(UserRole\.Editor, UserRole\.Admin\)/,
  },
  {
    name: 'Validate endpoint has Editor/Admin role',
    pattern: /@Post\('validate'\)[\s\S]*?@Roles\(UserRole\.Editor, UserRole\.Admin\)/,
  },
  {
    name: 'Export endpoint allows all authenticated users',
    pattern: /@Get\('export\/:projectId'\)[\s\S]*?@Roles\(UserRole\.Viewer, UserRole\.Editor, UserRole\.Admin\)/,
  },
];

importExportChecks.forEach(check => {
  const passed = check.pattern.test(importExportController);
  console.log(`${passed ? '✅' : '❌'} ${check.name}`);
});

// Check frontend role-based UI
console.log('\n🎨 Checking frontend role-based UI...\n');

const listPage = fs.readFileSync(
  'frontend/src/pages/budget/BudgetProjectsListPage.tsx',
  'utf8'
);

const detailPage = fs.readFileSync(
  'frontend/src/pages/budget/BudgetProjectDetailPage.tsx',
  'utf8'
);

const budgetTable = fs.readFileSync(
  'frontend/src/components/budget/BudgetTable.tsx',
  'utf8'
);

const frontendChecks = [
  {
    name: 'List page imports useAuth',
    pattern: /import.*useAuth.*from.*AuthContext/,
    content: listPage
  },
  {
    name: 'List page checks canCreateProject',
    pattern: /canCreateProject.*=.*user\?\.role.*===.*'Editor'.*\|\|.*user\?\.role.*===.*'Admin'/,
    content: listPage
  },
  {
    name: 'List page shows role indicator',
    pattern: /user\.role/,
    content: listPage
  },
  {
    name: 'Detail page imports useAuth',
    pattern: /import.*useAuth.*from.*AuthContext/,
    content: detailPage
  },
  {
    name: 'Detail page checks canEdit',
    pattern: /canEdit.*=.*user\?\.role.*===.*'Editor'.*\|\|.*user\?\.role.*===.*'Admin'/,
    content: detailPage
  },
  {
    name: 'Detail page checks canDelete',
    pattern: /canDelete.*=.*user\?\.role.*===.*'Admin'/,
    content: detailPage
  },
  {
    name: 'Detail page checks isViewer',
    pattern: /isViewer.*=.*user\?\.role.*===.*'Viewer'/,
    content: detailPage
  },
  {
    name: 'Detail page passes readOnly to BudgetTable',
    pattern: /<BudgetTable.*readOnly={isViewer}/,
    content: detailPage
  },
  {
    name: 'Detail page has delete button conditional',
    pattern: /canDelete.*&&/,
    content: detailPage
  },
  {
    name: 'BudgetTable has readOnly prop',
    pattern: /readOnly\?:\s*boolean/,
    content: budgetTable
  },
  {
    name: 'BudgetTable shows read-only notice',
    pattern: /readOnly.*&&[\s\S]*?Read-only access/,
    content: budgetTable
  },
  {
    name: 'BudgetTable prevents editing when readOnly',
    pattern: /if.*\(readOnly\).*return/,
    content: budgetTable
  },
];

frontendChecks.forEach(check => {
  const passed = check.pattern.test(check.content);
  console.log(`${passed ? '✅' : '❌'} ${check.name}`);
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Verification Summary\n');

const totalChecks = checks.length + importExportChecks.length + frontendChecks.length;
const passedChecks = [
  ...checks.filter(c => c.pattern.test(budgetProjectsController)),
  ...importExportChecks.filter(c => c.pattern.test(importExportController)),
  ...frontendChecks.filter(c => c.pattern.test(c.content)),
].length;

console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

if (passedChecks === totalChecks) {
  console.log('\n✅ All security checks passed!');
  console.log('\n🎉 Task 20 implementation verified successfully!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.\n');
  process.exit(1);
}
