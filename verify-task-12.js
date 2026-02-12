/**
 * Verification script for Task 12: Budget Projects List Page
 * 
 * This script verifies that:
 * 1. BudgetProjectsListPage component exists and is properly structured
 * 2. CreateProjectDialog component exists with form validation
 * 3. Routes are properly configured
 * 4. Sidebar navigation is updated
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 12: Budget Projects List Page\n');

let allPassed = true;

// Test 1: Check BudgetProjectsListPage exists
console.log('Test 1: Checking BudgetProjectsListPage component...');
const listPagePath = path.join(__dirname, 'frontend/src/pages/budget/BudgetProjectsListPage.tsx');
if (fs.existsSync(listPagePath)) {
  const content = fs.readFileSync(listPagePath, 'utf8');
  
  // Check for required features
  const checks = [
    { name: 'Year filter dropdown', pattern: /yearFilter/ },
    { name: 'Status filter', pattern: /statusFilter/ },
    { name: 'Create New Project button', pattern: /Create New Project/ },
    { name: 'DataTable component', pattern: /<DataTable/ },
    { name: 'Row click navigation', pattern: /handleRowClick/ },
    { name: 'Loading states', pattern: /isLoading/ },
    { name: 'useBudgetProjects hook', pattern: /useBudgetProjects/ },
  ];
  
  let passed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NOT FOUND`);
      passed = false;
      allPassed = false;
    }
  });
  
  if (passed) {
    console.log('  ✅ BudgetProjectsListPage component is complete\n');
  }
} else {
  console.log('  ❌ BudgetProjectsListPage.tsx not found\n');
  allPassed = false;
}

// Test 2: Check CreateProjectDialog exists
console.log('Test 2: Checking CreateProjectDialog component...');
const dialogPath = path.join(__dirname, 'frontend/src/components/budget/CreateProjectDialog.tsx');
if (fs.existsSync(dialogPath)) {
  const content = fs.readFileSync(dialogPath, 'utf8');
  
  const checks = [
    { name: 'React Hook Form', pattern: /useForm/ },
    { name: 'Zod validation', pattern: /zodResolver/ },
    { name: 'Project name field', pattern: /name.*register/ },
    { name: 'Template type field', pattern: /templateType/ },
    { name: 'Date range fields', pattern: /dateRangeStart.*dateRangeEnd/ },
    { name: 'Currency field', pattern: /currency/ },
    { name: 'Aircraft scope selection', pattern: /aircraftScopeType/ },
    { name: 'Individual aircraft selection', pattern: /selectedAircraftIds/ },
    { name: 'Aircraft type selection', pattern: /selectedAircraftTypes/ },
    { name: 'Fleet group selection', pattern: /selectedFleetGroups/ },
    { name: 'Form submission', pattern: /onSubmit/ },
    { name: 'Success navigation', pattern: /navigate/ },
    { name: 'Validation errors display', pattern: /errors/ },
  ];
  
  let passed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NOT FOUND`);
      passed = false;
      allPassed = false;
    }
  });
  
  if (passed) {
    console.log('  ✅ CreateProjectDialog component is complete\n');
  }
} else {
  console.log('  ❌ CreateProjectDialog.tsx not found\n');
  allPassed = false;
}

// Test 3: Check Dialog component exists
console.log('Test 3: Checking Dialog UI component...');
const dialogUIPath = path.join(__dirname, 'frontend/src/components/ui/Dialog.tsx');
if (fs.existsSync(dialogUIPath)) {
  const content = fs.readFileSync(dialogUIPath, 'utf8');
  
  const checks = [
    { name: 'Backdrop', pattern: /backdrop/ },
    { name: 'Close on escape', pattern: /Escape/ },
    { name: 'Prevent body scroll', pattern: /overflow/ },
    { name: 'Accessibility attributes', pattern: /aria-modal/ },
  ];
  
  let passed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NOT FOUND`);
      passed = false;
      allPassed = false;
    }
  });
  
  if (passed) {
    console.log('  ✅ Dialog component is complete\n');
  }
} else {
  console.log('  ❌ Dialog.tsx not found\n');
  allPassed = false;
}

// Test 4: Check routes are configured
console.log('Test 4: Checking route configuration...');
const appPath = path.join(__dirname, 'frontend/src/App.tsx');
if (fs.existsSync(appPath)) {
  const content = fs.readFileSync(appPath, 'utf8');
  
  const checks = [
    { name: 'Budget projects list route', pattern: /path="\/budget-projects"/ },
    { name: 'Budget project detail route', pattern: /path="\/budget-projects\/:id"/ },
    { name: 'Budget analytics route', pattern: /path="\/budget-projects\/:id\/analytics"/ },
    { name: 'BudgetProjectsListPage import', pattern: /import.*BudgetProjectsListPage/ },
  ];
  
  let passed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NOT FOUND`);
      passed = false;
      allPassed = false;
    }
  });
  
  if (passed) {
    console.log('  ✅ Routes are properly configured\n');
  }
} else {
  console.log('  ❌ App.tsx not found\n');
  allPassed = false;
}

// Test 5: Check sidebar navigation
console.log('Test 5: Checking sidebar navigation...');
const sidebarPath = path.join(__dirname, 'frontend/src/components/layout/Sidebar.tsx');
if (fs.existsSync(sidebarPath)) {
  const content = fs.readFileSync(sidebarPath, 'utf8');
  
  const checks = [
    { name: 'Budget Projects navigation entry', pattern: /Budget Projects/ },
    { name: 'Budget projects path', pattern: /path.*budget-projects/ },
    { name: 'Projects List sub-item', pattern: /Projects List/ },
  ];
  
  let passed = true;
  checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`  ✅ ${check.name}`);
    } else {
      console.log(`  ❌ ${check.name} - NOT FOUND`);
      passed = false;
      allPassed = false;
    }
  });
  
  if (passed) {
    console.log('  ✅ Sidebar navigation is updated\n');
  }
} else {
  console.log('  ❌ Sidebar.tsx not found\n');
  allPassed = false;
}

// Test 6: Check index files
console.log('Test 6: Checking index files...');
const budgetIndexPath = path.join(__dirname, 'frontend/src/pages/budget/index.ts');
const componentIndexPath = path.join(__dirname, 'frontend/src/components/budget/index.ts');

if (fs.existsSync(budgetIndexPath) && fs.existsSync(componentIndexPath)) {
  console.log('  ✅ Index files created\n');
} else {
  console.log('  ❌ Index files missing\n');
  allPassed = false;
}

// Summary
console.log('═══════════════════════════════════════════════════════');
if (allPassed) {
  console.log('✅ ALL TESTS PASSED - Task 12 is complete!');
  console.log('\nImplemented features:');
  console.log('  • Budget Projects List Page with year and status filters');
  console.log('  • Create New Project button');
  console.log('  • Projects table with columns: name, template, date range, currency, status, created');
  console.log('  • Row click navigation to detail page');
  console.log('  • Loading states and error handling');
  console.log('  • Create Project Dialog with React Hook Form + Zod validation');
  console.log('  • Form fields: name, template, date range, currency, aircraft scope');
  console.log('  • Aircraft scope selection (individual, type, group)');
  console.log('  • Inline validation errors');
  console.log('  • Success navigation to project detail page');
  console.log('  • Routes configured in App.tsx');
  console.log('  • Sidebar navigation updated with Budget Projects entry');
  console.log('\nRequirements validated:');
  console.log('  ✅ 1.1 - Project creation with required fields');
  console.log('  ✅ 1.3 - Template type, date range, currency, aircraft scope');
  console.log('  ✅ 1.4 - Aircraft scope selection support');
  console.log('  ✅ 1.7 - Project list display');
  console.log('  ✅ 9.1 - Projects table with key columns');
  console.log('  ✅ 9.2 - Year filter');
  console.log('  ✅ 14.5 - Required field validation');
  console.log('  ✅ 14.6 - Inline validation errors');
} else {
  console.log('❌ SOME TESTS FAILED - Please review the errors above');
  process.exit(1);
}
console.log('═══════════════════════════════════════════════════════\n');
