/**
 * Test script to verify Budget Audit Trail implementation
 * 
 * Tests:
 * 1. Audit log creation on project create
 * 2. Audit log creation on project update (with field-level tracking)
 * 3. Audit log creation on plan row update
 * 4. Audit log creation on actual update
 * 5. Audit log retrieval with filters
 * 6. Audit log summary
 */

const axios = require('axios');

const API_URL = 'http://localhost:3003';
let authToken = '';
let projectId = '';
let planRowId = '';
let userId = '';

// Helper function to make authenticated requests
async function apiRequest(method, url, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${url}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

async function login() {
  console.log('\n1. Logging in...');
  const response = await axios.post(`${API_URL}/api/auth/login`, {
    email: 'admin@alphastarav.com',
    password: 'Admin@123!',
  });
  authToken = response.data.accessToken;
  userId = response.data.user.id;
  console.log('✓ Logged in successfully');
  console.log(`  User ID: ${userId}`);
}

async function testProjectCreateAudit() {
  console.log('\n2. Testing audit log on project create...');
  
  const projectData = {
    name: `Audit Test Project ${Date.now()}`,
    templateType: 'RSAF',
    dateRange: {
      start: '2025-01-01',
      end: '2025-12-31',
    },
    currency: 'USD',
    aircraftScope: {
      type: 'individual',
      aircraftIds: [],
    },
    status: 'draft',
  };

  const project = await apiRequest('POST', '/api/budget-projects', projectData);
  projectId = project._id;
  console.log('✓ Project created');
  console.log(`  Project ID: ${projectId}`);

  // Wait a moment for audit log to be created
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check audit log
  const auditLog = await apiRequest('GET', `/api/budget-audit/${projectId}`);
  console.log(`✓ Audit log retrieved: ${auditLog.totalCount} entries`);

  const createEntry = auditLog.logs.find(log => log.action === 'create' && log.entityType === 'project');
  if (createEntry) {
    console.log('✓ Project create audit entry found');
    console.log(`  User: ${createEntry.userName}`);
    console.log(`  Timestamp: ${createEntry.timestamp}`);
  } else {
    console.error('✗ Project create audit entry NOT found');
  }
}

async function testProjectUpdateAudit() {
  console.log('\n3. Testing audit log on project update...');
  
  const updateData = {
    name: `Updated Audit Test Project ${Date.now()}`,
    status: 'active',
  };

  await apiRequest('PUT', `/api/budget-projects/${projectId}`, updateData);
  console.log('✓ Project updated');

  // Wait a moment for audit log to be created
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check audit log
  const auditLog = await apiRequest('GET', `/api/budget-audit/${projectId}`);
  console.log(`✓ Audit log retrieved: ${auditLog.totalCount} entries`);

  const nameUpdateEntry = auditLog.logs.find(
    log => log.action === 'update' && log.fieldChanged === 'name'
  );
  const statusUpdateEntry = auditLog.logs.find(
    log => log.action === 'update' && log.fieldChanged === 'status'
  );

  if (nameUpdateEntry) {
    console.log('✓ Name update audit entry found');
    console.log(`  Old value: ${nameUpdateEntry.oldValue}`);
    console.log(`  New value: ${nameUpdateEntry.newValue}`);
  } else {
    console.error('✗ Name update audit entry NOT found');
  }

  if (statusUpdateEntry) {
    console.log('✓ Status update audit entry found');
    console.log(`  Old value: ${statusUpdateEntry.oldValue}`);
    console.log(`  New value: ${statusUpdateEntry.newValue}`);
  } else {
    console.error('✗ Status update audit entry NOT found');
  }
}

async function testPlanRowUpdateAudit() {
  console.log('\n4. Testing audit log on plan row update...');
  
  // Get table data to find a plan row
  const tableData = await apiRequest('GET', `/api/budget-projects/${projectId}/table-data`);
  if (tableData.rows.length === 0) {
    console.log('⚠ No plan rows found, skipping test');
    return;
  }

  planRowId = tableData.rows[0].rowId;
  console.log(`  Using plan row: ${planRowId}`);

  // Update plan row
  await apiRequest('PATCH', `/api/budget-projects/${projectId}/plan-row/${planRowId}`, {
    plannedAmount: 50000,
  });
  console.log('✓ Plan row updated');

  // Wait a moment for audit log to be created
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check audit log
  const auditLog = await apiRequest('GET', `/api/budget-audit/${projectId}`);
  console.log(`✓ Audit log retrieved: ${auditLog.totalCount} entries`);

  const planRowEntry = auditLog.logs.find(
    log => log.action === 'update' && log.entityType === 'planRow' && log.fieldChanged === 'plannedAmount'
  );

  if (planRowEntry) {
    console.log('✓ Plan row update audit entry found');
    console.log(`  Old value: ${planRowEntry.oldValue}`);
    console.log(`  New value: ${planRowEntry.newValue}`);
  } else {
    console.error('✗ Plan row update audit entry NOT found');
  }
}

async function testActualUpdateAudit() {
  console.log('\n5. Testing audit log on actual update...');
  
  // Get table data to find a term
  const tableData = await apiRequest('GET', `/api/budget-projects/${projectId}/table-data`);
  if (tableData.rows.length === 0) {
    console.log('⚠ No plan rows found, skipping test');
    return;
  }

  const termId = tableData.rows[0].termId;
  const period = '2025-01';
  console.log(`  Using term: ${termId}, period: ${period}`);

  // Update actual
  await apiRequest('PATCH', `/api/budget-projects/${projectId}/actual/${period}`, {
    termId,
    amount: 15000,
  });
  console.log('✓ Actual updated');

  // Wait a moment for audit log to be created
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check audit log
  const auditLog = await apiRequest('GET', `/api/budget-audit/${projectId}`);
  console.log(`✓ Audit log retrieved: ${auditLog.totalCount} entries`);

  const actualEntry = auditLog.logs.find(
    log => log.entityType === 'actual' && log.fieldChanged === 'amount'
  );

  if (actualEntry) {
    console.log('✓ Actual update audit entry found');
    console.log(`  Action: ${actualEntry.action}`);
    console.log(`  Old value: ${actualEntry.oldValue}`);
    console.log(`  New value: ${actualEntry.newValue}`);
  } else {
    console.error('✗ Actual update audit entry NOT found');
  }
}

async function testAuditLogFilters() {
  console.log('\n6. Testing audit log filters...');
  
  // Test filter by action
  const createLogs = await apiRequest('GET', `/api/budget-audit/${projectId}?action=create`);
  console.log(`✓ Filter by action=create: ${createLogs.totalCount} entries`);

  const updateLogs = await apiRequest('GET', `/api/budget-audit/${projectId}?action=update`);
  console.log(`✓ Filter by action=update: ${updateLogs.totalCount} entries`);

  // Test filter by entity type
  const projectLogs = await apiRequest('GET', `/api/budget-audit/${projectId}?entityType=project`);
  console.log(`✓ Filter by entityType=project: ${projectLogs.totalCount} entries`);

  const planRowLogs = await apiRequest('GET', `/api/budget-audit/${projectId}?entityType=planRow`);
  console.log(`✓ Filter by entityType=planRow: ${planRowLogs.totalCount} entries`);

  const actualLogs = await apiRequest('GET', `/api/budget-audit/${projectId}?entityType=actual`);
  console.log(`✓ Filter by entityType=actual: ${actualLogs.totalCount} entries`);

  // Test filter by user
  const userLogs = await apiRequest('GET', `/api/budget-audit/${projectId}?userId=${userId}`);
  console.log(`✓ Filter by userId: ${userLogs.totalCount} entries`);
}

async function testAuditSummary() {
  console.log('\n7. Testing audit log summary...');
  
  const summary = await apiRequest('GET', `/api/budget-audit/${projectId}/summary`);
  console.log('✓ Audit summary retrieved');
  console.log(`  Total changes: ${summary.totalChanges}`);
  console.log(`  Changes by user:`);
  summary.changesByUser.forEach(user => {
    console.log(`    - ${user.userName}: ${user.changeCount} changes`);
  });
  console.log(`  Changes by type:`);
  summary.changesByType.forEach(type => {
    console.log(`    - ${type.action}: ${type.count} changes`);
  });
  console.log(`  Recent changes: ${summary.recentChanges.length} entries`);
}

async function cleanup() {
  console.log('\n8. Cleaning up...');
  try {
    await apiRequest('DELETE', `/api/budget-projects/${projectId}`);
    console.log('✓ Test project deleted');
  } catch (error) {
    console.log('⚠ Could not delete test project (may not exist)');
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Budget Audit Trail Test Suite');
  console.log('='.repeat(60));

  try {
    await login();
    await testProjectCreateAudit();
    await testProjectUpdateAudit();
    await testPlanRowUpdateAudit();
    await testActualUpdateAudit();
    await testAuditLogFilters();
    await testAuditSummary();
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ All audit trail tests completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('✗ Test suite failed:', error.message);
    console.error('='.repeat(60));
  } finally {
    await cleanup();
  }
}

// Run tests
runTests();
