/**
 * Verification Script: Task 23 - Mobile Responsive Design
 * 
 * This script verifies that responsive design has been implemented correctly
 * across all Budget & Cost Revamp pages.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Task 23: Mobile Responsive Design Implementation\n');

// Files to check
const filesToCheck = [
  {
    path: 'frontend/src/pages/budget/BudgetProjectsListPage.tsx',
    name: 'Projects List Page',
    patterns: [
      /flex-col sm:flex-row/,
      /text-2xl sm:text-3xl/,
      /w-full sm:w-auto/,
      /hidden md:block/,
      /md:hidden/,
      /divide-y divide-gray/,
    ]
  },
  {
    path: 'frontend/src/components/budget/BudgetTable.tsx',
    name: 'Budget Table',
    patterns: [
      /grid-cols-1 sm:grid-cols-2 lg:grid-cols-4/,
      /p-3 sm:p-4/,
      /text-xs sm:text-sm/,
      /text-xl sm:text-2xl/,
      /hidden md:block/,
      /md:hidden/,
      /overflow-x-auto/,
      /max-h-48/,
    ]
  },
  {
    path: 'frontend/src/pages/budget/BudgetAnalyticsPage.tsx',
    name: 'Analytics Page',
    patterns: [
      /py-4 sm:py-6/,
      /px-4 sm:px-6/,
      /space-y-4 sm:space-y-6/,
      /grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/,
      /gap-3 sm:gap-4/,
      /text-base sm:text-lg/,
      /p-2 sm:p-6/,
      /h-64 sm:h-80/,
    ]
  }
];

let allChecksPass = true;

filesToCheck.forEach(file => {
  console.log(`\n📄 Checking: ${file.name}`);
  console.log(`   File: ${file.path}`);
  
  try {
    const content = fs.readFileSync(file.path, 'utf8');
    let filePass = true;
    
    file.patterns.forEach((pattern, index) => {
      const found = pattern.test(content);
      const status = found ? '✅' : '❌';
      console.log(`   ${status} Pattern ${index + 1}: ${pattern.source.substring(0, 50)}...`);
      
      if (!found) {
        filePass = false;
        allChecksPass = false;
      }
    });
    
    if (filePass) {
      console.log(`   ✅ All patterns found in ${file.name}`);
    } else {
      console.log(`   ❌ Some patterns missing in ${file.name}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
    allChecksPass = false;
  }
});

// Check for responsive breakpoints documentation
console.log('\n\n📚 Checking Documentation');
const docPath = 'docs/TASK-23-RESPONSIVE-DESIGN-COMPLETE.md';
try {
  const docExists = fs.existsSync(docPath);
  if (docExists) {
    console.log(`   ✅ Documentation exists: ${docPath}`);
    const docContent = fs.readFileSync(docPath, 'utf8');
    
    const requiredSections = [
      'Task 23.1',
      'Task 23.2',
      'Task 23.3',
      'Responsive Design Patterns',
      'Testing Recommendations',
      'Requirements Validation'
    ];
    
    requiredSections.forEach(section => {
      const found = docContent.includes(section);
      const status = found ? '✅' : '❌';
      console.log(`   ${status} Section: ${section}`);
      if (!found) allChecksPass = false;
    });
  } else {
    console.log(`   ❌ Documentation missing: ${docPath}`);
    allChecksPass = false;
  }
} catch (error) {
  console.log(`   ❌ Error checking documentation: ${error.message}`);
  allChecksPass = false;
}

// Summary
console.log('\n\n' + '='.repeat(60));
if (allChecksPass) {
  console.log('✅ SUCCESS: All responsive design checks passed!');
  console.log('\nImplementation Summary:');
  console.log('  • Projects List: Responsive grid + card layout');
  console.log('  • Budget Table: Responsive KPIs + dual view system');
  console.log('  • Analytics Page: Responsive layout + chart scaling');
  console.log('\nBreakpoints Used:');
  console.log('  • Mobile: < 640px (default)');
  console.log('  • Small (sm): ≥ 640px');
  console.log('  • Medium (md): ≥ 768px');
  console.log('  • Large (lg): ≥ 1024px');
  console.log('\nNext Steps:');
  console.log('  1. Test on actual mobile devices');
  console.log('  2. Verify touch interactions');
  console.log('  3. Test with different screen sizes');
  console.log('  4. Validate accessibility on mobile');
} else {
  console.log('❌ FAILURE: Some responsive design checks failed');
  console.log('\nPlease review the errors above and ensure all patterns are implemented.');
}
console.log('='.repeat(60) + '\n');

process.exit(allChecksPass ? 0 : 1);
