/**
 * Test Budget Project CRUD Operations
 * 
 * This script tests the budget project CRUD endpoints to verify:
 * - Project creation with aircraft scope resolution
 * - Project listing with filters
 * - Project retrieval
 * - Project update
 * - Project deletion (Admin only)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@alphastarav.com',
  password: 'Admin@123!',
};

let adminToken = '';
let testProjectId = '';

async function login() {
  console.log('\n=== Logging in as Admin ===');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    adminToken = response.data.accessToken;
    console.log('✅ Login successful');
    console.log('   Token:', adminToken ? adminToken.substring(0, 50) + '...' : 'MISSING');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createProject() {
  console.log('\n=== Creating Budget Project ===');
  try {
    const projectData = {
      name: `Test Budget Project ${Date.now()}`,
      templateType: 'RSAF',
      dateRange: {
        start: '2025-01-01',
        end: '2025-12-31',
      },
      currency: 'USD',
      aircraftScope: {
        type: 'group',
        fleetGroups: ['A330', 'G650ER'],
      },
      status: 'draft',
    };

    const response = await axios.post(`${BASE_URL}/budget-projects`, projectData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    testProjectId = response.data._id;
    console.log('✅ Project created successfully');
    console.log('   Project ID:', testProjectId);
    console.log('   Project Name:', response.data.name);
    console.log('   Template Type:', response.data.templateType);
    console.log('   Aircraft Scope:', response.data.aircraftScope.type);
    return true;
  } catch (error) {
    console.error('❌ Project creation failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   Token:', adminToken.substring(0, 50) + '...');
    }
    return false;
  }
}

async function listProjects() {
  console.log('\n=== Listing Budget Projects ===');
  try {
    const response = await axios.get(`${BASE_URL}/budget-projects`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { year: 2025 },
    });

    console.log('✅ Projects listed successfully');
    console.log(`   Found ${response.data.length} project(s) for year 2025`);
    
    if (response.data.length > 0) {
      console.log('   First project:', response.data[0].name);
    }
    return true;
  } catch (error) {
    console.error('❌ Project listing failed:', error.response?.data || error.message);
    return false;
  }
}

async function getProject() {
  console.log('\n=== Getting Project Details ===');
  try {
    const response = await axios.get(`${BASE_URL}/budget-projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('✅ Project retrieved successfully');
    console.log('   Project Name:', response.data.name);
    console.log('   Status:', response.data.status);
    console.log('   Date Range:', response.data.dateRange.start, 'to', response.data.dateRange.end);
    return true;
  } catch (error) {
    console.error('❌ Project retrieval failed:', error.response?.data || error.message);
    return false;
  }
}

async function updateProject() {
  console.log('\n=== Updating Project ===');
  try {
    const updateData = {
      status: 'active',
    };

    const response = await axios.put(
      `${BASE_URL}/budget-projects/${testProjectId}`,
      updateData,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    console.log('✅ Project updated successfully');
    console.log('   New Status:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Project update failed:', error.response?.data || error.message);
    return false;
  }
}

async function deleteProject() {
  console.log('\n=== Deleting Project ===');
  try {
    await axios.delete(`${BASE_URL}/budget-projects/${testProjectId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('✅ Project deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Project deletion failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Budget Project CRUD Operations Test                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = {
    login: false,
    create: false,
    list: false,
    get: false,
    update: false,
    delete: false,
  };

  // Run tests in sequence
  results.login = await login();
  if (!results.login) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  results.create = await createProject();
  if (!results.create) {
    console.log('\n❌ Cannot proceed without a test project');
    return;
  }

  results.list = await listProjects();
  results.get = await getProject();
  results.update = await updateProject();
  results.delete = await deleteProject();

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Test Results Summary                                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`Login:          ${results.login ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Create Project: ${results.create ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`List Projects:  ${results.list ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Get Project:    ${results.get ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Update Project: ${results.update ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Delete Project: ${results.delete ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every((r) => r === true);
  console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'));
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
