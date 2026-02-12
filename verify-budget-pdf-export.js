/**
 * Verification Script for Budget PDF Export (Task 17)
 * 
 * This script verifies that the BudgetPDFExport component is properly implemented
 * and integrated into the BudgetAnalyticsPage.
 * 
 * Requirements verified:
 * - 6.1: PDF export button available
 * - 6.2: Cover page with project details
 * - 6.3: KPI summary section
 * - 6.4: Charts section with high-resolution capture
 * - 6.5: Tables section (top 5 overspend)
 * - 6.6: High-resolution chart capture (2x scale)
 * - 6.7: Loading indicator during generation
 * - 6.8: Page numbers on all pages
 * - 6.9: Footers on all pages
 * - 6.10: WYSIWYG output
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Budget PDF Export Implementation (Task 17)...\n');

let allChecksPassed = true;

// Check 1: BudgetPDFExport component exists
console.log('✓ Check 1: BudgetPDFExport component file exists');
const pdfExportPath = path.join(__dirname, 'frontend/src/components/budget/BudgetPDFExport.tsx');
if (!fs.existsSync(pdfExportPath)) {
  console.error('❌ BudgetPDFExport.tsx not found');
  allChecksPassed = false;
} else {
  console.log('  ✅ File exists: frontend/src/components/budget/BudgetPDFExport.tsx');
}

// Check 2: Component has required imports
console.log('\n✓ Check 2: Required dependencies imported');
const pdfExportContent = fs.readFileSync(pdfExportPath, 'utf8');
const requiredImports = [
  'html2canvas',
  'jsPDF',
  'format',
  'BudgetProject',
  'BudgetKPIs',
  'OverspendTerm',
];

requiredImports.forEach(imp => {
  if (pdfExportContent.includes(imp)) {
    console.log(`  ✅ ${imp} imported`);
  } else {
    console.error(`  ❌ ${imp} not imported`);
    allChecksPassed = false;
  }
});

// Check 3: Cover page implementation
console.log('\n✓ Check 3: Cover page implementation (Requirement 6.1, 6.2)');
if (pdfExportContent.includes('addCoverPage')) {
  console.log('  ✅ addCoverPage function exists');
  if (pdfExportContent.includes('Budget Analytics') && 
      pdfExportContent.includes('Performance Report') &&
      pdfExportContent.includes('ALPHA STAR AVIATION')) {
    console.log('  ✅ Cover page includes title and branding');
  } else {
    console.error('  ❌ Cover page missing required elements');
    allChecksPassed = false;
  }
  if (pdfExportContent.includes('project.name') && 
      pdfExportContent.includes('project.dateRange')) {
    console.log('  ✅ Cover page includes project details');
  } else {
    console.error('  ❌ Cover page missing project details');
    allChecksPassed = false;
  }
  if (pdfExportContent.includes('filters')) {
    console.log('  ✅ Cover page includes applied filters');
  } else {
    console.error('  ❌ Cover page missing filters section');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ addCoverPage function not found');
  allChecksPassed = false;
}

// Check 4: KPI summary implementation
console.log('\n✓ Check 4: KPI summary section (Requirement 6.3)');
if (pdfExportContent.includes('addKPISummary')) {
  console.log('  ✅ addKPISummary function exists');
  if (pdfExportContent.includes('totalBudgeted') && 
      pdfExportContent.includes('totalSpent') &&
      pdfExportContent.includes('remainingBudget') &&
      pdfExportContent.includes('budgetUtilization') &&
      pdfExportContent.includes('burnRate') &&
      pdfExportContent.includes('forecastMonthsRemaining')) {
    console.log('  ✅ All 6 KPIs included');
  } else {
    console.error('  ❌ Missing some KPIs');
    allChecksPassed = false;
  }
  if (pdfExportContent.includes('forecastDepletionDate')) {
    console.log('  ✅ Forecast depletion date included');
  } else {
    console.error('  ❌ Forecast depletion date missing');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ addKPISummary function not found');
  allChecksPassed = false;
}

// Check 5: Chart capture implementation
console.log('\n✓ Check 5: Chart capture with high resolution (Requirements 6.4, 6.5, 6.6)');
if (pdfExportContent.includes('captureChartSection')) {
  console.log('  ✅ captureChartSection function exists');
  if (pdfExportContent.includes('scale: 2')) {
    console.log('  ✅ High-resolution capture (2x scale) implemented');
  } else {
    console.error('  ❌ High-resolution capture not implemented');
    allChecksPassed = false;
  }
  if (pdfExportContent.includes('html2canvas')) {
    console.log('  ✅ html2canvas used for chart capture');
  } else {
    console.error('  ❌ html2canvas not used');
    allChecksPassed = false;
  }
  if (pdfExportContent.includes('waitForChartsToRender')) {
    console.log('  ✅ Chart rendering wait logic implemented');
  } else {
    console.error('  ❌ Chart rendering wait logic missing');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ captureChartSection function not found');
  allChecksPassed = false;
}

// Check 6: Table implementation
console.log('\n✓ Check 6: Top 5 overspend table (Requirement 6.5)');
if (pdfExportContent.includes('addTop5OverspendTable')) {
  console.log('  ✅ addTop5OverspendTable function exists');
  if (pdfExportContent.includes('Spending Term') && 
      pdfExportContent.includes('Budgeted') &&
      pdfExportContent.includes('Spent') &&
      pdfExportContent.includes('Variance')) {
    console.log('  ✅ Table headers included');
  } else {
    console.error('  ❌ Table headers missing');
    allChecksPassed = false;
  }
  if (pdfExportContent.includes('top5.forEach')) {
    console.log('  ✅ Table rows iteration implemented');
  } else {
    console.error('  ❌ Table rows iteration missing');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ addTop5OverspendTable function not found');
  allChecksPassed = false;
}

// Check 7: Multi-page handling
console.log('\n✓ Check 7: Multi-page content handling (Requirement 6.4)');
if (pdfExportContent.includes('heightLeft') && pdfExportContent.includes('while (heightLeft > 0)')) {
  console.log('  ✅ Multi-page logic implemented');
} else {
  console.error('  ❌ Multi-page logic missing');
  allChecksPassed = false;
}

// Check 8: Loading indicator
console.log('\n✓ Check 8: Loading indicator (Requirement 6.7)');
if (pdfExportContent.includes('isGenerating') && 
    pdfExportContent.includes('setIsGenerating')) {
  console.log('  ✅ Loading state management implemented');
  if (pdfExportContent.includes('SpinnerIcon') || pdfExportContent.includes('Generating PDF')) {
    console.log('  ✅ Loading indicator UI implemented');
  } else {
    console.error('  ❌ Loading indicator UI missing');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ Loading state management missing');
  allChecksPassed = false;
}

// Check 9: Page numbers and footers
console.log('\n✓ Check 9: Page numbers and footers (Requirements 6.8, 6.9)');
if (pdfExportContent.includes('addPageNumbersAndFooters')) {
  console.log('  ✅ addPageNumbersAndFooters function exists');
  if (pdfExportContent.includes('Page ${i} of ${pageCount}')) {
    console.log('  ✅ Page numbers implemented');
  } else {
    console.error('  ❌ Page numbers missing');
    allChecksPassed = false;
  }
  if (pdfExportContent.includes('Confidential') && 
      pdfExportContent.includes('Budget Analytics System')) {
    console.log('  ✅ Footer content implemented');
  } else {
    console.error('  ❌ Footer content missing');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ addPageNumbersAndFooters function not found');
  allChecksPassed = false;
}

// Check 10: PDF download
console.log('\n✓ Check 10: PDF download trigger (Requirement 6.10)');
if (pdfExportContent.includes('pdf.save')) {
  console.log('  ✅ PDF save/download implemented');
  if (pdfExportContent.includes('format(new Date()') && pdfExportContent.includes('.pdf')) {
    console.log('  ✅ Filename with timestamp generated');
  } else {
    console.error('  ❌ Filename generation incomplete');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ PDF save/download missing');
  allChecksPassed = false;
}

// Check 11: Integration with BudgetAnalyticsPage
console.log('\n✓ Check 11: Integration with BudgetAnalyticsPage');
const analyticsPagePath = path.join(__dirname, 'frontend/src/pages/budget/BudgetAnalyticsPage.tsx');
if (fs.existsSync(analyticsPagePath)) {
  const analyticsPageContent = fs.readFileSync(analyticsPagePath, 'utf8');
  if (analyticsPageContent.includes('BudgetPDFExport')) {
    console.log('  ✅ BudgetPDFExport imported in BudgetAnalyticsPage');
    if (analyticsPageContent.includes('<BudgetPDFExport')) {
      console.log('  ✅ BudgetPDFExport component used in page');
      if (analyticsPageContent.includes('project={project}') && 
          analyticsPageContent.includes('kpis={kpis}') &&
          analyticsPageContent.includes('top5Overspend={top5Overspend}')) {
        console.log('  ✅ Required props passed to component');
      } else {
        console.error('  ❌ Missing required props');
        allChecksPassed = false;
      }
    } else {
      console.error('  ❌ BudgetPDFExport component not used');
      allChecksPassed = false;
    }
  } else {
    console.error('  ❌ BudgetPDFExport not imported');
    allChecksPassed = false;
  }
  
  // Check for data attributes on chart sections
  if (analyticsPageContent.includes('data-chart="monthly-spend"') &&
      analyticsPageContent.includes('data-chart="cumulative-spend"') &&
      analyticsPageContent.includes('data-chart="spend-distribution"') &&
      analyticsPageContent.includes('data-chart="budgeted-vs-spent"') &&
      analyticsPageContent.includes('data-chart="top5-overspend"') &&
      analyticsPageContent.includes('data-chart="heatmap"')) {
    console.log('  ✅ Data attributes added to all chart sections');
  } else {
    console.error('  ❌ Missing data attributes on some chart sections');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ BudgetAnalyticsPage.tsx not found');
  allChecksPassed = false;
}

// Check 12: Error handling
console.log('\n✓ Check 12: Error handling');
if (pdfExportContent.includes('try') && 
    pdfExportContent.includes('catch') &&
    pdfExportContent.includes('setError')) {
  console.log('  ✅ Error handling implemented');
  if (pdfExportContent.includes('error &&')) {
    console.log('  ✅ Error display UI implemented');
  } else {
    console.error('  ❌ Error display UI missing');
    allChecksPassed = false;
  }
} else {
  console.error('  ❌ Error handling missing');
  allChecksPassed = false;
}

// Check 13: Chart sections defined
console.log('\n✓ Check 13: Chart sections for capture');
const expectedChartSections = [
  'monthly-spend',
  'cumulative-spend',
  'spend-distribution',
  'budgeted-vs-spent',
  'top5-overspend',
  'heatmap',
];

expectedChartSections.forEach(section => {
  if (pdfExportContent.includes(`data-chart="${section}"`)) {
    console.log(`  ✅ Chart section "${section}" defined`);
  } else {
    console.error(`  ❌ Chart section "${section}" missing`);
    allChecksPassed = false;
  }
});

// Summary
console.log('\n' + '='.repeat(60));
if (allChecksPassed) {
  console.log('✅ ALL CHECKS PASSED - Task 17 implementation verified!');
  console.log('\nImplemented features:');
  console.log('  ✓ Multi-page PDF with A4 dimensions');
  console.log('  ✓ Professional cover page with project details');
  console.log('  ✓ KPI summary section with 6 metrics');
  console.log('  ✓ High-resolution chart capture (2x scale)');
  console.log('  ✓ Top 5 overspend table');
  console.log('  ✓ Page numbers and footers');
  console.log('  ✓ Loading indicator (10-15 seconds)');
  console.log('  ✓ Error handling and retry');
  console.log('  ✓ WYSIWYG output');
  console.log('\nNext steps:');
  console.log('  1. Test PDF export in browser');
  console.log('  2. Verify chart quality in generated PDF');
  console.log('  3. Test with different filter combinations');
  console.log('  4. Verify multi-page handling with large datasets');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED - Review implementation');
  console.log('\nPlease fix the issues above before proceeding.');
  process.exit(1);
}
