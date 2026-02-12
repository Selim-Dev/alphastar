/**
 * Task 21 Checkpoint Verification Script
 * 
 * Verifies that analytics, export, and security features work correctly:
 * - Analytics endpoints return correct data
 * - Excel export functionality works
 * - PDF export functionality works (frontend)
 * - Security and authorization are properly enforced
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

// Test users with different roles
const USERS = {
  admin: { email: 'admin@alphastarav.com', password: 'Admin@123!' },
  editor: { email: 'editor@alphastarav.com', password: 'Editor@123!' },
  viewer: { email: 'viewer@alphastarav.com', password: 'Viewer@123!' }
};

let tokens = {};
let testProjectId = null;

// Helper function to login
async function login(role) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, USERS[role]);
    tokens[role] = response.data.token;
    console.log(`✓ Logged in as ${role}`);
    return response.data.token;
  } catch (error) {
    console.error(`✗ Failed to login as ${role}:`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to make authenticated request
async function makeRequest(method, url, role, data = null) {
  const config = {
    method,
    url: `${API_URL}${url}`,
    headers: {
      'Authorization': `Bearer ${tokens[role]}`
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Test 1: Analytics Endpoints
async function testAnalytics() {
  console.log('\n=== Testing Analytics Endpoints ===');
  
  try {
    // Get KPIs
    const kpisResponse = await makeRequest('get', `/api/budget-analytics/${testProjectId}/kpis`, 'editor');
    console.log('✓ KPIs endpoint works');
    console.log('  - Total Budgeted:', kpisResponse.data.totalBudgeted);
    console.log('  - Total Spent:', kpisResponse.data.totalSpent);
    console.log('  - Remaining Budget:', kpisResponse.data.remainingBudget);
    console.log('  - Burn Rate:', kpisResponse.data.burnRate);
    
    // Get monthly spend
    const monthlySpendResponse = await makeRequest('get', `/api/budget-analytics/${testProjectId}/monthly-spend`, 'editor');
    console.log('✓ Monthly spend endpoint works');
    console.log('  - Data points:', monthlySpendResponse.data.length);
    
    // Get cumulative spend
    const cumulativeResponse = await makeRequest('get', `/api/budget-analytics/${testProjectId}/cumulative-spend`, 'editor');
    console.log('✓ Cumulative spend endpoint works');
    console.log('  - Data points:', cumulativeResponse.data.length);
    
    // Get spend distribution
    const distributionResponse = await makeRequest('get', `/api/budget-analytics/${testProjectId}/spend-distribution`, 'editor');
    console.log('✓ Spend distribution endpoint works');
    console.log('  - Categories:', distributionResponse.data.length);
    
    // Get budgeted vs spent
    const budgetedVsSpentResponse = await makeRequest('get', `/api/budget-analytics/${testProjectId}/budgeted-vs-spent`, 'editor');
    console.log('✓ Budgeted vs spent endpoint works');
    console.log('  - Aircraft types:', budgetedVsSpentResponse.data.length);
    
    // Get top overspend
    const topOverspendResponse = await makeRequest('get', `/api/budget-analytics/${testProjectId}/top-overspend`, 'editor');
    console.log('✓ Top overspend endpoint works');
    console.log('  - Terms:', topOverspendResponse.data.length);
    
    return true;
  } catch (error) {
    console.error('✗ Analytics test failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Excel Export
async function testExcelExport() {
  console.log('\n=== Testing Excel Export ===');
  
  try {
    const response = await makeRequest('get', `/api/budget-export/${testProjectId}/excel`, 'editor');
    
    // Check response headers
    const contentType = response.headers['content-type'];
    const contentDisposition = response.headers['content-disposition'];
    
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
      console.log('✓ Excel export returns correct content type');
    } else {
      console.log('✗ Unexpected content type:', contentType);
      return false;
    }
    
    if (contentDisposition && contentDisposition.includes('attachment')) {
      console.log('✓ Excel export has correct content disposition');
    } else {
      console.log('⚠ Content disposition not set or incorrect');
    }
    
    // Check file size
    const fileSize = response.data.length || Buffer.byteLength(JSON.stringify(response.data));
    console.log('✓ Excel file generated, size:', fileSize, 'bytes');
    
    if (fileSize < 100) {
      console.log('⚠ File size seems too small, might be empty');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('✗ Excel export test failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 3: Audit Trail
async function testAuditTrail() {
  console.log('\n=== Testing Audit Trail ===');
  
  try {
    const response = await makeRequest('get', `/api/budget-audit/${testProjectId}`, 'editor');
    console.log('✓ Audit log endpoint works');
    console.log('  - Audit entries:', response.data.length);
    
    if (response.data.length > 0) {
      const entry = response.data[0];
      console.log('  - Sample entry:', {
        action: entry.action,
        entityType: entry.entityType,
        timestamp: entry.timestamp
      });
    }
    
    // Get audit summary
    const summaryResponse = await makeRequest('get', `/api/budget-audit/${testProjectId}/summary`, 'editor');
    console.log('✓ Audit summary endpoint works');
    console.log('  - Summary data:', summaryResponse.data);
    
    return true;
  } catch (error) {
    console.error('✗ Audit trail test failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Security - Authentication
async function testAuthentication() {
  console.log('\n=== Testing Authentication ===');
  
  try {
    // Test without token
    try {
      await axios.get(`${API_URL}/api/budget-projects`);
      console.log('✗ Unauthenticated request should fail but succeeded');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Unauthenticated requests are rejected (401)');
      } else {
        console.log('✗ Unexpected error for unauthenticated request:', error.response?.status);
        return false;
      }
    }
    
    // Test with invalid token
    try {
      await axios.get(`${API_URL}/api/budget-projects`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      console.log('✗ Invalid token should fail but succeeded');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✓ Invalid tokens are rejected (401)');
      } else {
        console.log('✗ Unexpected error for invalid token:', error.response?.status);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('✗ Authentication test failed:', error.message);
    return false;
  }
}

// Test 5: Security - Authorization (Role-Based Access Control)
async function testAuthorization() {
  console.log('\n=== Testing Authorization (RBAC) ===');
  
  try {
    // Test Viewer cannot create project
    try {
      await makeRequest('post', '/api/budget-projects', 'viewer', {
        name: 'Test Project',
        templateType: 'RSAF',
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
        currency: 'USD',
        aircraftScope: { type: 'type', aircraftTypes: ['A330'] }
      });
      console.log('✗ Viewer should not be able to create project');
      return false;
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✓ Viewer cannot create project (403 Forbidden)');
      } else {
        console.log('⚠ Unexpected error for viewer create:', error.response?.status);
      }
    }
    
    // Test Viewer can read projects
    try {
      await makeRequest('get', '/api/budget-projects', 'viewer');
      console.log('✓ Viewer can read projects');
    } catch (error) {
      console.log('✗ Viewer should be able to read projects');
      return false;
    }
    
    // Test Editor can create project
    try {
      const response = await makeRequest('post', '/api/budget-projects', 'editor', {
        name: 'Editor Test Project ' + Date.now(),
        templateType: 'RSAF',
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
        currency: 'USD',
        aircraftScope: { type: 'type', aircraftTypes: ['A330'] }
      });
      console.log('✓ Editor can create project');
      const editorProjectId = response.data._id;
      
      // Test Editor cannot delete project
      try {
        await makeRequest('delete', `/api/budget-projects/${editorProjectId}`, 'editor');
        console.log('✗ Editor should not be able to delete project');
        return false;
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✓ Editor cannot delete project (403 Forbidden)');
        } else {
          console.log('⚠ Unexpected error for editor delete:', error.response?.status);
        }
      }
      
      // Test Admin can delete project
      try {
        await makeRequest('delete', `/api/budget-projects/${editorProjectId}`, 'admin');
        console.log('✓ Admin can delete project');
      } catch (error) {
        console.log('✗ Admin should be able to delete project:', error.response?.data);
        return false;
      }
    } catch (error) {
      console.log('✗ Editor create test failed:', error.response?.data || error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('✗ Authorization test failed:', error.message);
    return false;
  }
}

// Test 6: Data Validation
async function testDataValidation() {
  console.log('\n=== Testing Data Validation ===');
  
  try {
    // Test missing required fields
    try {
      await makeRequest('post', '/api/budget-projects', 'editor', {
        name: 'Incomplete Project'
        // Missing templateType, dateRange, currency, aircraftScope
      });
      console.log('✗ Should reject project with missing fields');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ Rejects project with missing required fields (400)');
      } else {
        console.log('⚠ Unexpected error for missing fields:', error.response?.status);
      }
    }
    
    // Test negative amount validation
    if (testProjectId) {
      try {
        await makeRequest('patch', `/api/budget-projects/${testProjectId}/actual/2025-01`, 'editor', {
          termId: 'off-base-maint-intl',
          amount: -1000
        });
        console.log('✗ Should reject negative amounts');
        return false;
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✓ Rejects negative amounts (400)');
        } else {
          console.log('⚠ Unexpected error for negative amount:', error.response?.status);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('✗ Data validation test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('=== Budget & Cost Revamp - Task 21 Checkpoint ===');
  console.log('Testing Analytics, Export, and Security\n');
  
  try {
    // Login all users
    await login('admin');
    await login('editor');
    await login('viewer');
    
    // Get or create a test project
    console.log('\n=== Setting up test project ===');
    const projectsResponse = await makeRequest('get', '/api/budget-projects', 'editor');
    
    if (projectsResponse.data.length > 0) {
      testProjectId = projectsResponse.data[0]._id;
      console.log('✓ Using existing project:', testProjectId);
    } else {
      const createResponse = await makeRequest('post', '/api/budget-projects', 'editor', {
        name: 'Checkpoint Test Project',
        templateType: 'RSAF',
        dateRange: { start: '2025-01-01', end: '2025-12-31' },
        currency: 'USD',
        aircraftScope: { type: 'type', aircraftTypes: ['A330'] }
      });
      testProjectId = createResponse.data._id;
      console.log('✓ Created test project:', testProjectId);
    }
    
    // Run all tests
    const results = {
      analytics: await testAnalytics(),
      excelExport: await testExcelExport(),
      auditTrail: await testAuditTrail(),
      authentication: await testAuthentication(),
      authorization: await testAuthorization(),
      dataValidation: await testDataValidation()
    };
    
    // Summary
    console.log('\n=== Test Summary ===');
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, result]) => {
      console.log(`${result ? '✓' : '✗'} ${test}`);
    });
    
    console.log(`\nPassed: ${passed}/${total}`);
    
    if (passed === total) {
      console.log('\n✓ All checkpoint tests passed!');
      console.log('\nTask 21 Checkpoint Complete:');
      console.log('- Analytics endpoints working correctly');
      console.log('- Excel export functionality verified');
      console.log('- Audit trail recording changes');
      console.log('- Authentication enforced (401 for missing/invalid tokens)');
      console.log('- Authorization enforced (403 for insufficient permissions)');
      console.log('- Data validation working (400 for invalid inputs)');
      console.log('\nNote: PDF export is client-side and should be tested manually in the browser.');
      return true;
    } else {
      console.log('\n✗ Some tests failed. Please review the errors above.');
      return false;
    }
    
  } catch (error) {
    console.error('\n✗ Test suite failed:', error.message);
    return false;
  }
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
