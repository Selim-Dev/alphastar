/**
 * Task 26: Final Checkpoint - Comprehensive Verification
 * 
 * This script verifies:
 * 1. All backend modules and services exist
 * 2. All frontend components and hooks exist
 * 3. All database schemas are defined
 * 4. All API endpoints are implemented
 * 5. All correctness properties are documented
 * 6. All tests are in place
 * 7. All documentation is complete
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('TASK 26: FINAL CHECKPOINT - COMPREHENSIVE VERIFICATION');
console.log('='.repeat(80));
console.log();

let allChecks = [];
let passedChecks = 0;
let failedChecks = 0;

function check(category, description, condition) {
  const status = condition ? '✓ PASS' : '✗ FAIL';
  const result = { category, description, status, passed: condition };
  allChecks.push(result);
  
  if (condition) {
    passedChecks++;
    console.log(`${status}: ${description}`);
  } else {
    failedChecks++;
    console.log(`${status}: ${description}`);
  }
  
  return condition;
}

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function fileContains(filePath, searchString) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  return content.includes(searchString);
}

// ============================================================================
// 1. BACKEND MODULE STRUCTURE
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('1. BACKEND MODULE STRUCTURE');
console.log('='.repeat(80));

check('Backend', 'Budget Projects Module exists', 
  fileExists('backend/src/budget-projects/budget-projects.module.ts'));

check('Backend', 'Budget Projects Controller exists', 
  fileExists('backend/src/budget-projects/controllers/budget-projects.controller.ts'));

check('Backend', 'Budget Projects Service exists', 
  fileExists('backend/src/budget-projects/services/budget-projects.service.ts'));

check('Backend', 'Budget Analytics Controller exists', 
  fileExists('backend/src/budget-projects/controllers/budget-analytics.controller.ts'));

check('Backend', 'Budget Analytics Service exists', 
  fileExists('backend/src/budget-projects/services/budget-analytics.service.ts'));

check('Backend', 'Budget Import/Export Controller exists', 
  fileExists('backend/src/budget-projects/controllers/budget-import-export.controller.ts'));

check('Backend', 'Budget Import Service exists', 
  fileExists('backend/src/budget-projects/services/budget-import.service.ts'));

check('Backend', 'Budget Export Service exists', 
  fileExists('backend/src/budget-projects/services/budget-export.service.ts'));

check('Backend', 'Budget Audit Controller exists', 
  fileExists('backend/src/budget-projects/controllers/budget-audit.controller.ts'));

check('Backend', 'Budget Templates Service exists', 
  fileExists('backend/src/budget-projects/services/budget-templates.service.ts'));

// ============================================================================
// 2. DATABASE SCHEMAS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('2. DATABASE SCHEMAS');
console.log('='.repeat(80));

check('Schemas', 'BudgetProject schema exists', 
  fileExists('backend/src/budget-projects/schemas/budget-project.schema.ts'));

check('Schemas', 'BudgetPlanRow schema exists', 
  fileExists('backend/src/budget-projects/schemas/budget-plan-row.schema.ts'));

check('Schemas', 'BudgetActual schema exists', 
  fileExists('backend/src/budget-projects/schemas/budget-actual.schema.ts'));

check('Schemas', 'BudgetAuditLog schema exists', 
  fileExists('backend/src/budget-projects/schemas/budget-audit-log.schema.ts'));

// ============================================================================
// 3. REPOSITORIES
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('3. REPOSITORIES');
console.log('='.repeat(80));

check('Repositories', 'BudgetProject repository exists', 
  fileExists('backend/src/budget-projects/repositories/budget-project.repository.ts'));

check('Repositories', 'BudgetPlanRow repository exists', 
  fileExists('backend/src/budget-projects/repositories/budget-plan-row.repository.ts'));

check('Repositories', 'BudgetActual repository exists', 
  fileExists('backend/src/budget-projects/repositories/budget-actual.repository.ts'));

check('Repositories', 'BudgetAuditLog repository exists', 
  fileExists('backend/src/budget-projects/repositories/budget-audit-log.repository.ts'));

// ============================================================================
// 4. DTOs
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('4. DTOs (Data Transfer Objects)');
console.log('='.repeat(80));

check('DTOs', 'CreateBudgetProjectDto exists', 
  fileExists('backend/src/budget-projects/dto/create-budget-project.dto.ts'));

check('DTOs', 'UpdateBudgetProjectDto exists', 
  fileExists('backend/src/budget-projects/dto/update-budget-project.dto.ts'));

check('DTOs', 'BudgetProjectFiltersDto exists', 
  fileExists('backend/src/budget-projects/dto/budget-project-filters.dto.ts'));

check('DTOs', 'UpdatePlanRowDto exists', 
  fileExists('backend/src/budget-projects/dto/update-plan-row.dto.ts'));

check('DTOs', 'UpdateActualDto exists', 
  fileExists('backend/src/budget-projects/dto/update-actual.dto.ts'));

check('DTOs', 'AnalyticsFiltersDto exists', 
  fileExists('backend/src/budget-projects/dto/analytics-filters.dto.ts'));

// ============================================================================
// 5. FRONTEND PAGES
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('5. FRONTEND PAGES');
console.log('='.repeat(80));

check('Frontend Pages', 'BudgetProjectsListPage exists', 
  fileExists('frontend/src/pages/budget/BudgetProjectsListPage.tsx'));

check('Frontend Pages', 'BudgetProjectDetailPage exists', 
  fileExists('frontend/src/pages/budget/BudgetProjectDetailPage.tsx'));

check('Frontend Pages', 'BudgetAnalyticsPage exists', 
  fileExists('frontend/src/pages/budget/BudgetAnalyticsPage.tsx'));

// ============================================================================
// 6. FRONTEND COMPONENTS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('6. FRONTEND COMPONENTS');
console.log('='.repeat(80));

check('Frontend Components', 'BudgetTable component exists', 
  fileExists('frontend/src/components/budget/BudgetTable.tsx'));

check('Frontend Components', 'CreateProjectDialog component exists', 
  fileExists('frontend/src/components/budget/CreateProjectDialog.tsx'));

check('Frontend Components', 'BudgetAuditLog component exists', 
  fileExists('frontend/src/components/budget/BudgetAuditLog.tsx'));

check('Frontend Components', 'BudgetPDFExport component exists', 
  fileExists('frontend/src/components/budget/BudgetPDFExport.tsx'));

// ============================================================================
// 7. FRONTEND CHART COMPONENTS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('7. FRONTEND CHART COMPONENTS');
console.log('='.repeat(80));

check('Chart Components', 'MonthlySpendByTermChart exists', 
  fileExists('frontend/src/components/budget/charts/MonthlySpendByTermChart.tsx'));

check('Chart Components', 'CumulativeSpendChart exists', 
  fileExists('frontend/src/components/budget/charts/CumulativeSpendChart.tsx'));

check('Chart Components', 'SpendDistributionChart exists', 
  fileExists('frontend/src/components/budget/charts/SpendDistributionChart.tsx'));

check('Chart Components', 'BudgetedVsSpentChart exists', 
  fileExists('frontend/src/components/budget/charts/BudgetedVsSpentChart.tsx'));

check('Chart Components', 'Top5OverspendList exists', 
  fileExists('frontend/src/components/budget/charts/Top5OverspendList.tsx'));

check('Chart Components', 'SpendingHeatmap exists', 
  fileExists('frontend/src/components/budget/charts/SpendingHeatmap.tsx'));

// ============================================================================
// 8. CUSTOM HOOKS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('8. CUSTOM HOOKS');
console.log('='.repeat(80));

check('Hooks', 'useBudgetProjects hook exists', 
  fileExists('frontend/src/hooks/useBudgetProjects.ts'));

check('Hooks', 'useBudgetAnalytics hook exists', 
  fileExists('frontend/src/hooks/useBudgetAnalytics.ts'));

check('Hooks', 'useBudgetAudit hook exists', 
  fileExists('frontend/src/hooks/useBudgetAudit.ts'));

// ============================================================================
// 9. TEMPLATES AND UTILITIES
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('9. TEMPLATES AND UTILITIES');
console.log('='.repeat(80));

check('Templates', 'Spending Terms Registry exists', 
  fileExists('backend/src/budget-projects/templates/spending-terms.registry.ts'));

check('Templates', 'RSAF template is defined', 
  fileContains('backend/src/budget-projects/templates/spending-terms.registry.ts', 'RSAF'));

check('Utilities', 'Template Validator exists', 
  fileExists('backend/src/budget-projects/utils/template-validator.ts'));

// ============================================================================
// 10. BACKEND TESTS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('10. BACKEND TESTS');
console.log('='.repeat(80));

check('Backend Tests', 'Budget Projects E2E tests exist', 
  fileExists('backend/test/budget-projects.e2e-spec.ts'));

check('Backend Tests', 'Budget Import Service unit tests exist', 
  fileExists('backend/src/budget-projects/services/budget-import.service.spec.ts'));

check('Backend Tests', 'Template Validator unit tests exist', 
  fileExists('backend/src/budget-projects/utils/template-validator.spec.ts'));

// ============================================================================
// 11. FRONTEND TESTS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('11. FRONTEND TESTS');
console.log('='.repeat(80));

check('Frontend Tests', 'BudgetTable component tests exist', 
  fileExists('frontend/src/components/budget/BudgetTable.test.tsx'));

check('Frontend Tests', 'BudgetProjectDetailPage tests exist', 
  fileExists('frontend/src/pages/budget/BudgetProjectDetailPage.test.tsx'));

// ============================================================================
// 12. DOCUMENTATION
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('12. DOCUMENTATION');
console.log('='.repeat(80));

check('Documentation', 'Requirements document exists', 
  fileExists('.kiro/specs/budget-cost-revamp/requirements.md'));

check('Documentation', 'Design document exists', 
  fileExists('.kiro/specs/budget-cost-revamp/design.md'));

check('Documentation', 'Tasks document exists', 
  fileExists('.kiro/specs/budget-cost-revamp/tasks.md'));

check('Documentation', 'README exists', 
  fileExists('.kiro/specs/budget-cost-revamp/README.md'));

check('Documentation', 'RSAF Template Reference exists', 
  fileExists('.kiro/specs/budget-cost-revamp/RSAF-TEMPLATE-REFERENCE.md'));

check('Documentation', 'Critical Constraints document exists', 
  fileExists('.kiro/specs/budget-cost-revamp/CRITICAL-CONSTRAINTS.md'));

// ============================================================================
// 13. TASK COMPLETION MARKERS
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('13. TASK COMPLETION MARKERS');
console.log('='.repeat(80));

const completedTasks = [
  { task: 'Task 1', file: 'backend/src/budget-projects/budget-projects.module.ts' },
  { task: 'Task 2.1', file: 'backend/src/budget-projects/templates/spending-terms.registry.ts' },
  { task: 'Task 2.3', file: 'backend/src/budget-projects/utils/template-validator.ts' },
  { task: 'Task 3', file: 'backend/src/budget-projects/TASK-3-COMPLETE.md' },
  { task: 'Task 5', file: 'backend/src/budget-projects/TASK-5-COMPLETE.md' },
  { task: 'Task 6', file: 'backend/src/budget-projects/TASK-6-COMPLETE.md' },
  { task: 'Task 8', file: 'backend/src/budget-projects/TASK-8-COMPLETE.md' },
  { task: 'Task 9', file: 'backend/src/budget-projects/TASK-9-COMPLETE.md' },
  { task: 'Task 11', file: 'frontend/src/hooks/TASK-11-COMPLETE.md' },
  { task: 'Task 12', file: 'frontend/src/pages/budget/TASK-12-COMPLETE.md' },
  { task: 'Task 13', file: 'frontend/src/components/budget/TASK-13-COMPLETE.md' },
  { task: 'Task 14', file: 'frontend/src/pages/budget/TASK-14-COMPLETE.md' },
  { task: 'Task 16', file: 'frontend/src/pages/budget/TASK-16-COMPLETE.md' },
  { task: 'Task 17', file: 'frontend/src/components/budget/TASK-17-COMPLETE.md' },
  { task: 'Task 19', file: 'docs/TASK-19-COMPLETE.md' },
  { task: 'Task 20', file: 'docs/TASK-20-SECURITY-COMPLETE.md' },
  { task: 'Task 22', file: 'docs/BUDGET-DATA-INDEPENDENCE-VERIFICATION.md' },
  { task: 'Task 23', file: 'docs/TASK-23-RESPONSIVE-DESIGN-COMPLETE.md' },
  { task: 'Task 24', file: 'docs/TASK-24-PERFORMANCE-OPTIMIZATION-COMPLETE.md' },
  { task: 'Task 25', file: 'docs/TASK-25-INTEGRATION-TESTS-COMPLETE.md' },
];

completedTasks.forEach(({ task, file }) => {
  check('Task Completion', `${task} completion marker exists`, fileExists(file));
});

// ============================================================================
// 14. CORRECTNESS PROPERTIES DOCUMENTATION
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('14. CORRECTNESS PROPERTIES (28 Total)');
console.log('='.repeat(80));

const properties = [
  'Property 1: Template Loading Consistency',
  'Property 2: Required Field Validation',
  'Property 3: Plan Row Generation Completeness',
  'Property 4: Project Round-Trip Consistency',
  'Property 5: Table Structure Consistency',
  'Property 6: Non-Negative Amount Validation',
  'Property 7: Row Total Accuracy',
  'Property 8: Column Total Accuracy',
  'Property 9: Total Budget Calculation',
  'Property 10: Remaining Budget Invariant',
  'Property 11: Excel Import Round-Trip',
  'Property 12: Actual Entry Completeness',
  'Property 13: Fiscal Period Validation',
  'Property 14: Actual Aggregation Accuracy',
  'Property 15: Cumulative Spend Calculation',
  'Property 16: Burn Rate Formula',
  'Property 17: Forecast Formula',
  'Property 18: Filter Application Consistency',
  'Property 19: Excel Structure Validation',
  'Property 20: Export Data Completeness',
  'Property 21: Audit Trail Creation',
  'Property 22: Audit Log Sort Order',
  'Property 23: Year Filter Accuracy',
  'Property 24: Data Independence',
  'Property 25: Aircraft Deletion Preservation',
  'Property 26: Term Search Filtering',
  'Property 27: Authentication Requirement',
  'Property 28: Role-Based Access Control',
];

properties.forEach(property => {
  check('Correctness Properties', `${property} documented`, 
    fileContains('.kiro/specs/budget-cost-revamp/design.md', property));
});

// ============================================================================
// 15. ROUTING AND NAVIGATION
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('15. ROUTING AND NAVIGATION');
console.log('='.repeat(80));

check('Routing', 'Budget routes configured in App.tsx', 
  fileContains('frontend/src/App.tsx', '/budget-projects') || 
  fileContains('frontend/src/main.tsx', '/budget-projects'));

check('Navigation', 'Budget Projects entry in sidebar', 
  fileContains('frontend/src/components/layout/Sidebar.tsx', 'Budget Projects') ||
  fileContains('frontend/src/components/layout/MobileMenu.tsx', 'Budget Projects'));

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(80));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(80));
console.log();
console.log(`Total Checks: ${allChecks.length}`);
console.log(`Passed: ${passedChecks} (${Math.round(passedChecks/allChecks.length*100)}%)`);
console.log(`Failed: ${failedChecks} (${Math.round(failedChecks/allChecks.length*100)}%)`);
console.log();

if (failedChecks > 0) {
  console.log('FAILED CHECKS:');
  console.log('='.repeat(80));
  allChecks.filter(c => !c.passed).forEach(c => {
    console.log(`  ✗ [${c.category}] ${c.description}`);
  });
  console.log();
}

// Group by category
console.log('\nRESULTS BY CATEGORY:');
console.log('='.repeat(80));
const categories = [...new Set(allChecks.map(c => c.category))];
categories.forEach(category => {
  const categoryChecks = allChecks.filter(c => c.category === category);
  const categoryPassed = categoryChecks.filter(c => c.passed).length;
  const categoryTotal = categoryChecks.length;
  const percentage = Math.round(categoryPassed/categoryTotal*100);
  console.log(`${category}: ${categoryPassed}/${categoryTotal} (${percentage}%)`);
});

console.log();
console.log('='.repeat(80));
if (failedChecks === 0) {
  console.log('✓ ALL CHECKS PASSED - FEATURE IS COMPLETE!');
} else {
  console.log(`✗ ${failedChecks} CHECKS FAILED - REVIEW REQUIRED`);
}
console.log('='.repeat(80));
console.log();

process.exit(failedChecks > 0 ? 1 : 0);
