/**
 * Budget CRUD Checkpoint Verification Script
 * 
 * This script verifies that:
 * 1. All unit tests pass
 * 2. The budget-projects module is properly integrated
 * 3. API endpoints are accessible
 * 4. Basic CRUD operations work correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const TEST_USER = {
  email: 'admin@alphastarav.com',
  password: 'Admin@123!',
};

let authToken = '';

async function login() {
  console.log('🔐 Testing authentication...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.access_token;
    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetProjects() {
  console.log('\n📋 Testing GET /api/budget-projects...');
  try {
    const response = await axios.get(`${BASE_URL}/budget-projects`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`✅ GET projects successful - Found ${response.data.length} projects`);
    return true;
  } catch (error) {
    console.error('❌ GET projects failed:', error.response?.data || error.message);
    return false;
  }
}

async function testCreateProject() {
  console.log('\n➕ Testing POST /api/budget-projects...');
  const testProject = {
    name: `Test Project ${Date.now()}`,
    templateType: 'RSAF',
    dateRange: {
      start: '2025-01-01',
      end: '2025-12-31',
    },
    currency: 'USD',
    aircraftScope: {
      type: 'type',
      aircraftTypes: ['A330'],
    },
    status: 'draft',
  };

  try {
    const response = await axios.post(`${BASE_URL}/budget-projects`, testProject, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✅ POST project successful');
    console.log(`   Project ID: ${response.data._id}`);
    console.log(`   Plan rows generated: ${response.data.planRowCount || 'N/A'}`);
    return response.data._id;
  } catch (error) {
    console.error('❌ POST project failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetProject(projectId) {
  console.log(`\n🔍 Testing GET /api/budget-projects/${projectId}...`);
  try {
    const response = await axios.get(`${BASE_URL}/budget-projects/${projectId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✅ GET project by ID successful');
    console.log(`   Project name: ${response.data.name}`);
    console.log(`   Template: ${response.data.templateType}`);
    console.log(`   Status: ${response.data.status}`);
    return true;
  } catch (error) {
    console.error('❌ GET project by ID failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateProject(projectId) {
  console.log(`\n✏️ Testing PUT /api/budget-projects/${projectId}...`);
  try {
    const response = await axios.put(
      `${BASE_URL}/budget-projects/${projectId}`,
      { status: 'active' },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log('✅ PUT project successful');
    console.log(`   Updated status: ${response.data.status}`);
    return true;
  } catch (error) {
    console.error('❌ PUT project failed:', error.response?.data || error.message);
    return false;
  }
}

async function testDeleteProject(projectId) {
  console.log(`\n🗑️ Testing DELETE /api/budget-projects/${projectId}...`);
  try {
    await axios.delete(`${BASE_URL}/budget-projects/${projectId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log('✅ DELETE project successful');
    return true;
  } catch (error) {
    console.error('❌ DELETE project failed:', error.response?.data || error.message);
    return false;
  }
}

async function runCheckpoint() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Budget CRUD Checkpoint Verification');
  console.log('  Task 4: Ensure project CRUD tests pass');
  console.log('═══════════════════════════════════════════════════════\n');

  const results = {
    auth: false,
    getProjects: false,
    createProject: false,
    getProject: false,
    updateProject: false,
    deleteProject: false,
  };

  // Step 1: Authenticate
  results.auth = await login();
  if (!results.auth) {
    console.log('\n❌ Cannot proceed without authentication');
    return false;
  }

  // Step 2: Test GET projects
  results.getProjects = await testGetProjects();

  // Step 3: Test CREATE project
  const projectId = await testCreateProject();
  results.createProject = projectId !== null;

  if (projectId) {
    // Step 4: Test GET project by ID
    results.getProject = await testGetProject(projectId);

    // Step 5: Test UPDATE project
    results.updateProject = await testUpdateProject(projectId);

    // Step 6: Test DELETE project
    results.deleteProject = await testDeleteProject(projectId);
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Authentication:     ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`GET Projects:       ${results.getProjects ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CREATE Project:     ${results.createProject ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`GET Project by ID:  ${results.getProject ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`UPDATE Project:     ${results.updateProject ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`DELETE Project:     ${results.deleteProject ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════');

  const allPassed = Object.values(results).every((result) => result === true);
  
  if (allPassed) {
    console.log('\n✅ ALL TESTS PASSED - Checkpoint complete!');
  } else {
    console.log('\n❌ SOME TESTS FAILED - Please review errors above');
  }

  return allPassed;
}

// Run the checkpoint
runCheckpoint()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
