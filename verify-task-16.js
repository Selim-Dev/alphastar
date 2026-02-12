/**
 * Verification Script for Task 16: Budget Analytics Page
 * 
 * This script verifies that all components and routes are properly implemented.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 16: Budget Analytics Page Implementation\n');

const checks = [];

// Check 1: Main analytics page exists
const analyticsPagePath = 'frontend/src/pages/budget/BudgetAnalyticsPage.tsx';
checks.push({
  name: 'BudgetAnalyticsPage component',
  path: analyticsPagePath,
  exists: fs.existsSync(analyticsPagePath),
});

// Check 2: Chart components exist
const chartComponents = [
  'MonthlySpendByTermChart',
  'CumulativeSpendChart',
  'SpendDistributionChart',
  'BudgetedVsSpentChart',
  'Top5OverspendList',
  'SpendingHeatmap',
];

chartComponents.forEach((component) => {
  const componentPath = `frontend/src/components/budget/charts/${component}.tsx`;
  checks.push({
    name: `${component} chart`,
    path: componentPath,
    exists: fs.existsSync(componentPath),
  });
});

// Check 3: Charts index exists
const chartsIndexPath = 'frontend/src/components/budget/charts/index.ts';
checks.push({
  name: 'Charts index file',
  path: chartsIndexPath,
  exists: fs.existsSync(chartsIndexPath),
});

// Check 4: useDebounce hook exists
const debouncePath = 'frontend/src/hooks/useDebounce.ts';
checks.push({
  name: 'useDebounce hook',
  path: debouncePath,
  exists: fs.existsSync(debouncePath),
});

// Check 5: Route is added to App.tsx
const appPath = 'frontend/src/App.tsx';
if (fs.existsSync(appPath)) {
  const appContent = fs.readFileSync(appPath, 'utf8');
  checks.push({
    name: 'Analytics route in App.tsx',
    path: appPath,
    exists: appContent.includes('/budget-projects/:id/analytics') && 
            appContent.includes('BudgetAnalyticsPage'),
  });
}

// Check 6: Export in pages/budget/index.ts
const pagesIndexPath = 'frontend/src/pages/budget/index.ts';
if (fs.existsSync(pagesIndexPath)) {
  const indexContent = fs.readFileSync(pagesIndexPath, 'utf8');
  checks.push({
    name: 'BudgetAnalyticsPage export',
    path: pagesIndexPath,
    exists: indexContent.includes('BudgetAnalyticsPage'),
  });
}

// Check 7: Verify key features in BudgetAnalyticsPage
if (fs.existsSync(analyticsPagePath)) {
  const pageContent = fs.readFileSync(analyticsPagePath, 'utf8');
  
  checks.push({
    name: 'Filter panel implementation',
    path: analyticsPagePath,
    exists: pageContent.includes('startDate') && 
            pageContent.includes('endDate') && 
            pageContent.includes('aircraftType') && 
            pageContent.includes('termSearch'),
  });
  
  checks.push({
    name: 'KPI cards (6 metrics)',
    path: analyticsPagePath,
    exists: pageContent.includes('Total Budgeted') && 
            pageContent.includes('Total Spent') && 
            pageContent.includes('Remaining Budget') && 
            pageContent.includes('Budget Utilization') && 
            pageContent.includes('Burn Rate') && 
            pageContent.includes('Forecast'),
  });
  
  checks.push({
    name: 'Debounced filter changes',
    path: analyticsPagePath,
    exists: pageContent.includes('useDebounce') && 
            pageContent.includes('300'),
  });
  
  checks.push({
    name: 'Progressive loading',
    path: analyticsPagePath,
    exists: pageContent.includes('kpisLoading') && 
            pageContent.includes('monthlySpendLoading') && 
            pageContent.includes('heatmapLoading'),
  });
  
  checks.push({
    name: 'Export to PDF button',
    path: analyticsPagePath,
    exists: pageContent.includes('Export to PDF') || 
            pageContent.includes('handleExportPDF'),
  });
}

// Print results
console.log('📋 Verification Results:\n');

let allPassed = true;
checks.forEach((check) => {
  const status = check.exists ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (!check.exists) {
    console.log(`   Path: ${check.path}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('✅ All checks passed! Task 16 is complete.');
  console.log('\n📝 Summary:');
  console.log('   - BudgetAnalyticsPage component created');
  console.log('   - 6 chart components created');
  console.log('   - Filter functionality with debouncing');
  console.log('   - Progressive loading implemented');
  console.log('   - Routes and exports configured');
  console.log('\n🚀 Next Steps:');
  console.log('   1. Start the development server: cd frontend && npm run dev');
  console.log('   2. Navigate to a budget project');
  console.log('   3. Click on the Analytics tab or navigate to /budget-projects/{id}/analytics');
  console.log('   4. Test all filters and charts');
  console.log('   5. Proceed to Task 17: PDF Export');
} else {
  console.log('❌ Some checks failed. Please review the missing components.');
  process.exit(1);
}

console.log('='.repeat(60) + '\n');
