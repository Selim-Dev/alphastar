/**
 * Test script for Budget Table Data Operations (Task 5)
 * Tests: getTableData, updatePlanRow, updateActual endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:3003/api';
let authToken = '';
let testProjectId = '';
let testPlanRowId = '';

// Test credentials
const TEST_USER = {
  email: 'editor@alphastarav.com',
  password: 'Editor@123!',
};

async function login() {
  console.log('\n1. Logging in...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    authToken = response.data.accessToken;
    console.log('✓ Login successful');
    return true;
  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createTestProject() {
  console.log('\n2. Creating test budget project...');
  try {
    const projectData = {
      name: `Test Budget Table Data ${Date.now()}`,
      templateType: 'RSAF',
      dateRange: {
        start: '2025-01-01',
        end: '2025-12-31',
      },
      currency: 'USD',
      aircraftScope: {
        type: 'individual',
        aircraftIds: [], // Empty for simplicity
      },
      status: 'draft',
    };

    const response = await axios.post(`${API_URL}/budget-projects`, projectData, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    testProjectId = response.data._id;
    console.log('✓ Project created:', testProjectId);
    return true;
  } catch (error) {
    console.error('✗ Project creation failed:', error.response?.data || error.message);
    return false;
  }
}

async function getTableData() {
  console.log('\n3. Getting table data...');
  try {
    const response = await axios.get(
      `${API_URL}/budget-projects/${testProjectId}/table-data`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const tableData = response.data;
    console.log('✓ Table data retrieved');
    console.log('  - Project ID:', tableData.projectId);
    console.log('  - Periods:', tableData.periods.length, 'months');
    console.log('  - Rows:', tableData.rows.length, 'plan rows');
    console.log('  - Grand Total Budgeted:', tableData.grandTotal.budgeted);
    console.log('  - Grand Total Spent:', tableData.grandTotal.spent);
    console.log('  - Grand Total Remaining:', tableData.grandTotal.remaining);

    // Verify structure
    if (!tableData.projectId || !Array.isArray(tableData.periods) || !Array.isArray(tableData.rows)) {
      throw new Error('Invalid table data structure');
    }

    // Verify periods are in YYYY-MM format
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!tableData.periods.every(p => periodRegex.test(p))) {
      throw new Error('Invalid period format');
    }

    // Verify rows have required fields
    if (tableData.rows.length > 0) {
      const firstRow = tableData.rows[0];
      testPlanRowId = firstRow.rowId;
      
      const requiredFields = ['rowId', 'termId', 'termName', 'termCategory', 'plannedAmount', 'actuals', 'totalSpent', 'remaining', 'variance', 'variancePercent'];
      const missingFields = requiredFields.filter(field => !(field in firstRow));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing fields in row: ${missingFields.join(', ')}`);
      }

      console.log('  - First row term:', firstRow.termName);
      console.log('  - First row planned:', firstRow.plannedAmount);
    }

    // Verify column totals
    if (!tableData.columnTotals || typeof tableData.columnTotals !== 'object') {
      throw new Error('Invalid column totals structure');
    }

    // Verify grand total
    if (!tableData.grandTotal || typeof tableData.grandTotal.budgeted !== 'number') {
      throw new Error('Invalid grand total structure');
    }

    console.log('✓ Table data structure validated');
    return true;
  } catch (error) {
    console.error('✗ Get table data failed:', error.response?.data || error.message);
    return false;
  }
}

async function updatePlanRow() {
  console.log('\n4. Updating plan row...');
  try {
    if (!testPlanRowId) {
      console.log('⊘ Skipping - no plan row available');
      return true;
    }

    const updateData = {
      plannedAmount: 50000,
    };

    const response = await axios.patch(
      `${API_URL}/budget-projects/${testProjectId}/plan-row/${testPlanRowId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✓ Plan row updated:', response.data.message);

    // Verify the update by getting table data again
    const tableResponse = await axios.get(
      `${API_URL}/budget-projects/${testProjectId}/table-data`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const updatedRow = tableResponse.data.rows.find(r => r.rowId === testPlanRowId);
    if (updatedRow && updatedRow.plannedAmount === 50000) {
      console.log('✓ Plan row update verified');
      return true;
    } else {
      throw new Error('Plan row update not reflected in table data');
    }
  } catch (error) {
    console.error('✗ Update plan row failed:', error.response?.data || error.message);
    return false;
  }
}

async function updateActual() {
  console.log('\n5. Updating actual spend...');
  try {
    // Get first row's termId
    const tableResponse = await axios.get(
      `${API_URL}/budget-projects/${testProjectId}/table-data`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (tableResponse.data.rows.length === 0) {
      console.log('⊘ Skipping - no rows available');
      return true;
    }

    const firstRow = tableResponse.data.rows[0];
    const period = '2025-01';

    const updateData = {
      termId: firstRow.termId,
      amount: 12500,
    };

    const response = await axios.patch(
      `${API_URL}/budget-projects/${testProjectId}/actual/${period}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log('✓ Actual updated:', response.data.message);

    // Verify the update by getting table data again
    const verifyResponse = await axios.get(
      `${API_URL}/budget-projects/${testProjectId}/table-data`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const updatedRow = verifyResponse.data.rows.find(r => r.termId === firstRow.termId);
    if (updatedRow && updatedRow.actuals[period] === 12500) {
      console.log('✓ Actual update verified');
      console.log('  - Period:', period);
      console.log('  - Amount:', updatedRow.actuals[period]);
      console.log('  - Total Spent:', updatedRow.totalSpent);
      console.log('  - Remaining:', updatedRow.remaining);
      return true;
    } else {
      throw new Error('Actual update not reflected in table data');
    }
  } catch (error) {
    console.error('✗ Update actual failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCalculations() {
  console.log('\n6. Testing calculations...');
  try {
    // Get table data
    const response = await axios.get(
      `${API_URL}/budget-projects/${testProjectId}/table-data`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const tableData = response.data;

    // Test 1: Row total accuracy
    console.log('  Testing row total accuracy...');
    for (const row of tableData.rows) {
      const calculatedTotal = Object.values(row.actuals).reduce((sum, amt) => sum + amt, 0);
      if (Math.abs(row.totalSpent - calculatedTotal) > 0.01) {
        throw new Error(`Row total mismatch for ${row.termName}: expected ${calculatedTotal}, got ${row.totalSpent}`);
      }
    }
    console.log('  ✓ Row totals accurate');

    // Test 2: Column total accuracy
    console.log('  Testing column total accuracy...');
    for (const period of tableData.periods) {
      const calculatedTotal = tableData.rows.reduce((sum, row) => sum + (row.actuals[period] || 0), 0);
      if (Math.abs(tableData.columnTotals[period] - calculatedTotal) > 0.01) {
        throw new Error(`Column total mismatch for ${period}: expected ${calculatedTotal}, got ${tableData.columnTotals[period]}`);
      }
    }
    console.log('  ✓ Column totals accurate');

    // Test 3: Grand total accuracy
    console.log('  Testing grand total accuracy...');
    const calculatedBudgeted = tableData.rows.reduce((sum, row) => sum + row.plannedAmount, 0);
    const calculatedSpent = tableData.rows.reduce((sum, row) => sum + row.totalSpent, 0);
    const calculatedRemaining = calculatedBudgeted - calculatedSpent;

    if (Math.abs(tableData.grandTotal.budgeted - calculatedBudgeted) > 0.01) {
      throw new Error(`Grand total budgeted mismatch: expected ${calculatedBudgeted}, got ${tableData.grandTotal.budgeted}`);
    }
    if (Math.abs(tableData.grandTotal.spent - calculatedSpent) > 0.01) {
      throw new Error(`Grand total spent mismatch: expected ${calculatedSpent}, got ${tableData.grandTotal.spent}`);
    }
    if (Math.abs(tableData.grandTotal.remaining - calculatedRemaining) > 0.01) {
      throw new Error(`Grand total remaining mismatch: expected ${calculatedRemaining}, got ${tableData.grandTotal.remaining}`);
    }
    console.log('  ✓ Grand totals accurate');

    // Test 4: Remaining budget invariant
    console.log('  Testing remaining budget invariant...');
    for (const row of tableData.rows) {
      const expectedRemaining = row.plannedAmount - row.totalSpent;
      if (Math.abs(row.remaining - expectedRemaining) > 0.01) {
        throw new Error(`Remaining budget mismatch for ${row.termName}: expected ${expectedRemaining}, got ${row.remaining}`);
      }
    }
    console.log('  ✓ Remaining budget invariant holds');

    console.log('✓ All calculations verified');
    return true;
  } catch (error) {
    console.error('✗ Calculation test failed:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n7. Cleaning up...');
  try {
    if (testProjectId) {
      // Login as admin to delete
      const adminResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@alphastarav.com',
        password: 'Admin@123!',
      });
      const adminToken = adminResponse.data.accessToken;

      await axios.delete(`${API_URL}/budget-projects/${testProjectId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log('✓ Test project deleted');
    }
    return true;
  } catch (error) {
    console.error('✗ Cleanup failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Budget Table Data Operations Test (Task 5)');
  console.log('='.repeat(60));

  const results = {
    login: false,
    createProject: false,
    getTableData: false,
    updatePlanRow: false,
    updateActual: false,
    testCalculations: false,
    cleanup: false,
  };

  results.login = await login();
  if (!results.login) {
    console.log('\n✗ Tests aborted - login failed');
    return;
  }

  results.createProject = await createTestProject();
  if (!results.createProject) {
    console.log('\n✗ Tests aborted - project creation failed');
    return;
  }

  results.getTableData = await getTableData();
  results.updatePlanRow = await updatePlanRow();
  results.updateActual = await updateActual();
  results.testCalculations = await testCalculations();
  results.cleanup = await cleanup();

  console.log('\n' + '='.repeat(60));
  console.log('Test Results Summary');
  console.log('='.repeat(60));
  console.log('Login:              ', results.login ? '✓ PASS' : '✗ FAIL');
  console.log('Create Project:     ', results.createProject ? '✓ PASS' : '✗ FAIL');
  console.log('Get Table Data:     ', results.getTableData ? '✓ PASS' : '✗ FAIL');
  console.log('Update Plan Row:    ', results.updatePlanRow ? '✓ PASS' : '✗ FAIL');
  console.log('Update Actual:      ', results.updateActual ? '✓ PASS' : '✗ FAIL');
  console.log('Test Calculations:  ', results.testCalculations ? '✓ PASS' : '✗ FAIL');
  console.log('Cleanup:            ', results.cleanup ? '✓ PASS' : '✗ FAIL');
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r === true);
  if (allPassed) {
    console.log('\n✓ ALL TESTS PASSED - Task 5 implementation verified!');
  } else {
    console.log('\n✗ SOME TESTS FAILED - Review errors above');
  }
}

runTests().catch(console.error);
