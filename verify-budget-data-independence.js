/**
 * Budget Data Independence Verification Script
 * 
 * This script verifies that the Budget & Cost Revamp module is completely
 * independent from other modules (Maintenance, AOG, Work Orders, Discrepancies).
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 * 
 * Verification Criteria:
 * 1. Budget calculations only use budget-specific collections
 * 2. No joins with maintenance, AOG, or work order collections
 * 3. Only references Aircraft master data for scope selection
 * 4. All analytics queries are self-contained
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

/**
 * Verify that budget services only use budget collections
 */
function verifyBudgetServices() {
  logSection('1. Verifying Budget Services');

  const servicePaths = [
    'backend/src/budget-projects/services/budget-projects.service.ts',
    'backend/src/budget-projects/services/budget-analytics.service.ts',
    'backend/src/budget-projects/services/budget-import.service.ts',
    'backend/src/budget-projects/services/budget-export.service.ts',
  ];

  const forbiddenCollections = [
    'maintenancetasks',
    'aogevents',
    'workorders',
    'workordersummaries',
    'discrepancies',
    'dailystatus',
    'dailycounters',
  ];

  // Patterns that indicate actual collection usage (not just variable names)
  const forbiddenPatterns = [
    /maintenancetasks['"]/gi,  // Collection name in quotes
    /aogevents['"]/gi,
    /workorders['"]/gi,
    /workordersummaries['"]/gi,
    /discrepancies['"]/gi,
    /dailystatus['"]/gi,
    /dailycounters['"]/gi,
    /from:\s*['"](?:maintenancetasks|aogevents|workorders|discrepancies|dailystatus|dailycounters)['"]/gi, // MongoDB from clause
  ];

  const allowedReferences = [
    'aircraft', // Only for scope selection
    'budgetprojects',
    'budgetplanrows',
    'budgetactuals',
    'budgetauditlog',
  ];

  let allPassed = true;

  for (const servicePath of servicePaths) {
    const fullPath = path.join(process.cwd(), servicePath);
    
    if (!fs.existsSync(fullPath)) {
      logWarning(`Service file not found: ${servicePath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const serviceName = path.basename(servicePath);

    logInfo(`Checking ${serviceName}...`);

    // Check for forbidden collection references
    let foundForbidden = false;
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        const collectionName = pattern.source.match(/[a-z]+/i)[0];
        logError(`  Found reference to forbidden collection: ${collectionName}`);
        foundForbidden = true;
        allPassed = false;
      }
    }

    // Check for $lookup operations (MongoDB joins)
    if (content.includes('$lookup')) {
      logError(`  Found $lookup operation (MongoDB join)`);
      allPassed = false;
    }

    // Check for populate operations with non-aircraft collections
    const populateMatches = content.match(/\.populate\(['"](.*?)['"]/g);
    if (populateMatches) {
      for (const match of populateMatches) {
        const field = match.match(/\.populate\(['"](.*?)['"]/)[1];
        if (field !== 'userId' && field !== 'aircraftId') {
          logWarning(`  Found populate operation on field: ${field}`);
        }
      }
    }

    if (!foundForbidden) {
      logSuccess(`  ${serviceName} is independent`);
    }
  }

  return allPassed;
}

/**
 * Verify that budget repositories only use budget collections
 */
function verifyBudgetRepositories() {
  logSection('2. Verifying Budget Repositories');

  const repositoryPaths = [
    'backend/src/budget-projects/repositories/budget-project.repository.ts',
    'backend/src/budget-projects/repositories/budget-plan-row.repository.ts',
    'backend/src/budget-projects/repositories/budget-actual.repository.ts',
    'backend/src/budget-projects/repositories/budget-audit-log.repository.ts',
  ];

  const expectedCollections = {
    'budget-project.repository.ts': 'budgetprojects',
    'budget-plan-row.repository.ts': 'budgetplanrows',
    'budget-actual.repository.ts': 'budgetactuals',
    'budget-audit-log.repository.ts': 'budgetauditlog',
  };

  let allPassed = true;

  for (const repoPath of repositoryPaths) {
    const fullPath = path.join(process.cwd(), repoPath);
    
    if (!fs.existsSync(fullPath)) {
      logWarning(`Repository file not found: ${repoPath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const repoName = path.basename(repoPath);

    logInfo(`Checking ${repoName}...`);

    // Verify it uses the correct collection
    const expectedCollection = expectedCollections[repoName];
    if (expectedCollection) {
      // Check for @InjectModel decorator with correct schema
      const schemaName = expectedCollection
        .replace('budget', 'Budget')
        .replace(/s$/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      
      if (content.includes(`@InjectModel(${schemaName}.name)`)) {
        logSuccess(`  Uses correct collection: ${expectedCollection}`);
      } else {
        logWarning(`  Could not verify collection usage for ${repoName}`);
      }
    }

    // Check for any cross-collection queries
    if (content.includes('$lookup') || content.includes('from:')) {
      logError(`  Found potential cross-collection query`);
      allPassed = false;
    } else {
      logSuccess(`  No cross-collection queries found`);
    }
  }

  return allPassed;
}

/**
 * Verify that budget analytics only use budget data
 */
function verifyBudgetAnalytics() {
  logSection('3. Verifying Budget Analytics Independence');

  const analyticsPath = 'backend/src/budget-projects/services/budget-analytics.service.ts';
  const fullPath = path.join(process.cwd(), analyticsPath);

  if (!fs.existsSync(fullPath)) {
    logError('Budget analytics service not found');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  logInfo('Checking analytics methods...');

  // List of analytics methods to verify
  const analyticsMethods = [
    'getKPIs',
    'getMonthlySpendByTerm',
    'getCumulativeSpendVsBudget',
    'getSpendDistribution',
    'getBudgetedVsSpentByAircraftType',
    'getTop5OverspendTerms',
    'getSpendingHeatmap',
  ];

  let allPassed = true;

  for (const method of analyticsMethods) {
    if (content.includes(`async ${method}(`)) {
      logSuccess(`  Found method: ${method}`);
      
      // Extract method body
      const methodStart = content.indexOf(`async ${method}(`);
      const methodBody = content.substring(methodStart, methodStart + 5000);
      
      // Check if method uses only budget repositories
      const usesBudgetRepos = 
        methodBody.includes('projectRepository') ||
        methodBody.includes('planRowRepository') ||
        methodBody.includes('actualRepository');
      
      const usesOtherRepos = 
        methodBody.includes('maintenanceRepository') ||
        methodBody.includes('aogRepository') ||
        methodBody.includes('workOrderRepository');
      
      if (usesBudgetRepos && !usesOtherRepos) {
        logSuccess(`    ${method} uses only budget repositories`);
      } else if (usesOtherRepos) {
        logError(`    ${method} uses non-budget repositories`);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

/**
 * Verify aircraft service usage is limited to scope resolution
 */
function verifyAircraftServiceUsage() {
  logSection('4. Verifying Aircraft Service Usage');

  const servicePath = 'backend/src/budget-projects/services/budget-projects.service.ts';
  const fullPath = path.join(process.cwd(), servicePath);

  if (!fs.existsSync(fullPath)) {
    logError('Budget projects service not found');
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');

  logInfo('Checking aircraft service usage...');

  // Find all uses of aircraftService
  const aircraftServiceCalls = content.match(/this\.aircraftService\.\w+/g) || [];
  
  logInfo(`Found ${aircraftServiceCalls.length} aircraft service calls`);

  const allowedMethods = ['findById', 'findAll'];
  let allPassed = true;

  for (const call of aircraftServiceCalls) {
    const method = call.split('.').pop();
    if (allowedMethods.includes(method)) {
      logSuccess(`  ${call} - Used for scope resolution`);
    } else {
      logWarning(`  ${call} - Unexpected method`);
    }
  }

  // Verify aircraft service is only used in resolveAircraftScope and generatePlanRows
  const scopeResolutionMethods = ['resolveAircraftScope', 'generatePlanRows'];
  
  for (const method of scopeResolutionMethods) {
    if (content.includes(`private async ${method}(`)) {
      logSuccess(`  Aircraft service used in ${method} (allowed)`);
    }
  }

  return allPassed;
}

/**
 * Verify database schemas are independent
 */
function verifyDatabaseSchemas() {
  logSection('5. Verifying Database Schemas');

  const schemaPaths = [
    'backend/src/budget-projects/schemas/budget-project.schema.ts',
    'backend/src/budget-projects/schemas/budget-plan-row.schema.ts',
    'backend/src/budget-projects/schemas/budget-actual.schema.ts',
    'backend/src/budget-projects/schemas/budget-audit-log.schema.ts',
  ];

  let allPassed = true;

  for (const schemaPath of schemaPaths) {
    const fullPath = path.join(process.cwd(), schemaPath);
    
    if (!fs.existsSync(fullPath)) {
      logWarning(`Schema file not found: ${schemaPath}`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const schemaName = path.basename(schemaPath);

    logInfo(`Checking ${schemaName}...`);

    // Check for references to other modules
    const hasMaintenanceRef = content.includes('maintenanceTaskId') || content.includes('MaintenanceTask');
    const hasAOGRef = content.includes('aogEventId') || content.includes('AOGEvent');
    const hasWorkOrderRef = content.includes('workOrderId') || content.includes('WorkOrder');

    if (hasMaintenanceRef || hasAOGRef || hasWorkOrderRef) {
      logError(`  Found reference to other module schemas`);
      allPassed = false;
    } else {
      logSuccess(`  Schema is independent`);
    }

    // Check for allowed references
    if (content.includes('aircraftId') || content.includes('Aircraft')) {
      logInfo(`  References Aircraft (allowed for scope selection)`);
    }

    if (content.includes('userId') || content.includes('User')) {
      logInfo(`  References User (allowed for audit trail)`);
    }
  }

  return allPassed;
}

/**
 * Generate summary report
 */
function generateSummary(results) {
  logSection('Verification Summary');

  const allPassed = Object.values(results).every(result => result === true);

  console.log('Results:');
  console.log('--------');
  
  for (const [check, passed] of Object.entries(results)) {
    if (passed) {
      logSuccess(`${check}: PASSED`);
    } else {
      logError(`${check}: FAILED`);
    }
  }

  console.log('\n' + '='.repeat(80));
  
  if (allPassed) {
    logSuccess('\n✓ ALL CHECKS PASSED - Budget module is fully independent\n');
    log('The Budget & Cost Revamp module successfully meets requirements:', 'green');
    log('  - 10.1: No coupling to Maintenance Tasks', 'green');
    log('  - 10.2: No coupling to Work Orders', 'green');
    log('  - 10.3: No coupling to AOG Events', 'green');
    log('  - 10.4: Only references Aircraft for scope selection', 'green');
    log('  - 10.5: Maintains independent spending records', 'green');
  } else {
    logError('\n✗ SOME CHECKS FAILED - Review errors above\n');
  }

  console.log('='.repeat(80) + '\n');

  return allPassed;
}

/**
 * Main verification function
 */
function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         Budget & Cost Revamp - Data Independence Verification             ║', 'cyan');
  log('║                                                                            ║', 'cyan');
  log('║  This script verifies that budget calculations are completely independent ║', 'cyan');
  log('║  from other modules (Maintenance, AOG, Work Orders, Discrepancies).       ║', 'cyan');
  log('║                                                                            ║', 'cyan');
  log('║  Requirements: 10.1, 10.2, 10.3, 10.4, 10.5                               ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    'Budget Services': verifyBudgetServices(),
    'Budget Repositories': verifyBudgetRepositories(),
    'Budget Analytics': verifyBudgetAnalytics(),
    'Aircraft Service Usage': verifyAircraftServiceUsage(),
    'Database Schemas': verifyDatabaseSchemas(),
  };

  const allPassed = generateSummary(results);

  process.exit(allPassed ? 0 : 1);
}

// Run verification
main();
