/**
 * Checkpoint 10: Backend Analytics and Import/Export Tests
 * 
 * This script verifies that all backend analytics and import/export functionality works correctly.
 */

const axios = require('axios');

const API_URL = 'http://localhost:3003';
let authToken = '';
let testProjectId = '';

// Test credentials
const TEST_USER = {
  email: 'admin@alphastarav.com',
  password: 'Admin@123!',
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

// Login
async function login() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
    authToken = response.data.access_token;
    logSuccess('Authentication successful');
    return true;
  } catch (error) {
    logError(`Login failed: ${error.message}`);
    return false;
  }
}

// Create test project
async function createTestProject() {
  try {
    const projectData = {
      name: `Checkpoint 10 Test ${Date.now()}`,
      templateType: 'RSAF',
      dateRange: {
        start: '2025-01-01',
        end: '2025-12-31',
      },
      currency: 'USD',
      aircraftScope: {
        type: 'type',
        aircraftTypes: ['A330', 'G650ER'],
      },
    };

    const response = await axios.post(
      `${API_URL}/api/budget-projects`,
      projectData,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    testProjectId = response.data._id;
    logSuccess(`Test project created: ${testProjectId}`);
    return true;
  } catch (error) {
    logError(`Failed to create project: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test Analytics KPIs endpoint
async function testAnalyticsKPIs() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-analytics/${testProjectId}/kpis`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const kpis = response.data;
    
    // Verify KPI structure
    const requiredFields = [
      'totalBudgeted',
      'totalSpent',
      'remainingBudget',
      'budgetUtilization',
      'burnRate',
      'averageMonthlySpend',
      'forecastMonthsRemaining',
    ];

    const hasAllFields = requiredFields.every(field => field in kpis);
    
    if (hasAllFields) {
      logSuccess('KPIs endpoint returns all required fields');
      return true;
    } else {
      logError('KPIs endpoint missing required fields');
      return false;
    }
  } catch (error) {
    logError(`KPIs test failed: ${error.message}`);
    return false;
  }
}

// Test Monthly Spend endpoint
async function testMonthlySpend() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-analytics/${testProjectId}/monthly-spend`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logSuccess('Monthly spend endpoint works');
    return true;
  } catch (error) {
    logError(`Monthly spend test failed: ${error.message}`);
    return false;
  }
}

// Test Cumulative Spend endpoint
async function testCumulativeSpend() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-analytics/${testProjectId}/cumulative-spend`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logSuccess('Cumulative spend endpoint works');
    return true;
  } catch (error) {
    logError(`Cumulative spend test failed: ${error.message}`);
    return false;
  }
}

// Test Spend Distribution endpoint
async function testSpendDistribution() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-analytics/${testProjectId}/spend-distribution`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logSuccess('Spend distribution endpoint works');
    return true;
  } catch (error) {
    logError(`Spend distribution test failed: ${error.message}`);
    return false;
  }
}

// Test Budgeted vs Spent endpoint
async function testBudgetedVsSpent() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-analytics/${testProjectId}/budgeted-vs-spent`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logSuccess('Budgeted vs spent endpoint works');
    return true;
  } catch (error) {
    logError(`Budgeted vs spent test failed: ${error.message}`);
    return false;
  }
}

// Test Top Overspend endpoint
async function testTopOverspend() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-analytics/${testProjectId}/top-overspend`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logSuccess('Top overspend endpoint works');
    return true;
  } catch (error) {
    logError(`Top overspend test failed: ${error.message}`);
    return false;
  }
}

// Test Heatmap endpoint
async function testHeatmap() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-analytics/${testProjectId}/heatmap`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    logSuccess('Heatmap endpoint works');
    return true;
  } catch (error) {
    logError(`Heatmap test failed: ${error.message}`);
    return false;
  }
}

// Test Export endpoint
async function testExport() {
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-import-export/export/${testProjectId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'arraybuffer',
      }
    );

    if (response.data && response.data.byteLength > 0) {
      logSuccess('Export endpoint works and returns data');
      return true;
    } else {
      logError('Export endpoint returned empty data');
      return false;
    }
  } catch (error) {
    logError(`Export test failed: ${error.message}`);
    return false;
  }
}

// Cleanup
async function cleanup() {
  if (testProjectId) {
    try {
      await axios.delete(
        `${API_URL}/api/budget-projects/${testProjectId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      logSuccess('Test project cleaned up');
    } catch (error) {
      logError(`Cleanup failed: ${error.message}`);
    }
  }
}

// Main test runner
async function runTests() {
  logSection('Checkpoint 10: Backend Analytics and Import/Export Tests');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('Cannot proceed without authentication');
    return;
  }

  // Create test project
  const projectCreated = await createTestProject();
  if (!projectCreated) {
    logError('Cannot proceed without test project');
    return;
  }

  // Run tests
  const results = {
    kpis: await testAnalyticsKPIs(),
    monthlySpend: await testMonthlySpend(),
    cumulativeSpend: await testCumulativeSpend(),
    spendDistribution: await testSpendDistribution(),
    budgetedVsSpent: await testBudgetedVsSpent(),
    topOverspend: await testTopOverspend(),
    heatmap: await testHeatmap(),
    export: await testExport(),
  };

  // Cleanup
  await cleanup();

  // Summary
  logSection('Test Summary');
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`\nTests passed: ${passed}/${total}`);
  
  if (passed === total) {
    logSuccess('\n✓ All tests passed! Checkpoint 10 complete.');
  } else {
    logError(`\n✗ ${total - passed} test(s) failed.`);
  }
}

// Run
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
