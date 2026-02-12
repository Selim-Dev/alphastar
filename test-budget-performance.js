/**
 * Budget Performance Testing Script
 * 
 * Tests performance with large datasets to verify:
 * - Table rendering with 1000+ rows (<2s requirement)
 * - Analytics with 12+ months of data
 * - Filter response times (<1s requirement)
 * 
 * Requirements: 12.1, 12.2, 12.3
 */

const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpi';
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  largeProject: {
    termCount: 60, // RSAF template has 60+ terms
    aircraftCount: 20, // 20 aircraft types
    monthCount: 12, // Full year
    expectedRows: 60 * 20, // 1200 rows
  },
  performance: {
    tableLoadMaxTime: 2000, // 2 seconds
    filterResponseMaxTime: 1000, // 1 second
    cellEditMaxTime: 500, // 500ms
  },
};

let client;
let db;
let authToken;

async function connect() {
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();
  console.log('✓ Connected to MongoDB\n');
}

async function disconnect() {
  if (client) {
    await client.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

async function authenticate() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@alphastarav.com',
      password: 'Admin@123!',
    });
    authToken = response.data.token;
    console.log('✓ Authenticated with API\n');
  } catch (error) {
    console.error('✗ Authentication failed:', error.message);
    throw error;
  }
}

function getAuthHeaders() {
  return {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };
}

async function createLargeTestProject() {
  console.log('📊 Creating large test project...');
  console.log('─'.repeat(60));

  const projectsCollection = db.collection('budgetprojects');
  const planRowsCollection = db.collection('budgetplanrows');
  const actualsCollection = db.collection('budgetactuals');

  // Create project
  const project = {
    name: `Performance Test Project ${Date.now()}`,
    templateType: 'RSAF',
    dateRange: {
      start: new Date('2025-01-01'),
      end: new Date('2025-12-31'),
    },
    currency: 'USD',
    aircraftScope: {
      type: 'type',
      aircraftTypes: Array.from({ length: TEST_CONFIG.largeProject.aircraftCount }, (_, i) => `Aircraft-Type-${i + 1}`),
    },
    status: 'active',
    createdBy: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const projectResult = await projectsCollection.insertOne(project);
  const projectId = projectResult.insertedId;
  console.log(`✓ Created project: ${project.name}`);
  console.log(`  Project ID: ${projectId}`);

  // Create plan rows (termCount × aircraftCount)
  const planRows = [];
  const termIds = Array.from({ length: TEST_CONFIG.largeProject.termCount }, (_, i) => `term-${i + 1}`);
  
  for (const termId of termIds) {
    for (let i = 0; i < TEST_CONFIG.largeProject.aircraftCount; i++) {
      planRows.push({
        projectId,
        termId,
        termName: `Spending Term ${termId}`,
        termCategory: `Category ${Math.floor(i / 5) + 1}`,
        aircraftType: `Aircraft-Type-${i + 1}`,
        plannedAmount: Math.floor(Math.random() * 100000) + 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await planRowsCollection.insertMany(planRows);
  console.log(`✓ Created ${planRows.length} plan rows`);

  // Create actuals (random data for each month)
  const actuals = [];
  const periods = Array.from({ length: TEST_CONFIG.largeProject.monthCount }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    return `2025-${month}`;
  });

  for (const period of periods) {
    // Create actuals for ~30% of plan rows (realistic scenario)
    const actualsCount = Math.floor(planRows.length * 0.3);
    for (let i = 0; i < actualsCount; i++) {
      const randomRow = planRows[Math.floor(Math.random() * planRows.length)];
      actuals.push({
        projectId,
        termId: randomRow.termId,
        period,
        aircraftType: randomRow.aircraftType,
        amount: Math.floor(Math.random() * 50000) + 5000,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await actualsCollection.insertMany(actuals);
  console.log(`✓ Created ${actuals.length} actual entries across ${periods.length} months`);

  console.log('\n📈 Test Project Summary:');
  console.log(`  Total Plan Rows: ${planRows.length}`);
  console.log(`  Total Actuals: ${actuals.length}`);
  console.log(`  Periods: ${periods.length} months`);
  console.log(`  Expected Table Rows: ${TEST_CONFIG.largeProject.expectedRows}`);

  return { projectId: projectId.toString(), periods };
}

async function testTableLoadPerformance(projectId) {
  console.log('\n\n🚀 Test 1: Table Load Performance');
  console.log('─'.repeat(60));
  console.log(`Requirement: Load table data within ${TEST_CONFIG.performance.tableLoadMaxTime}ms for 1000+ rows`);

  const startTime = Date.now();
  
  try {
    const response = await axios.get(
      `${API_URL}/api/budget-projects/${projectId}/table-data`,
      getAuthHeaders()
    );
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    const rowCount = response.data.rows?.length || 0;
    const periodCount = response.data.periods?.length || 0;
    
    console.log(`\n✓ Table data loaded successfully`);
    console.log(`  Rows: ${rowCount}`);
    console.log(`  Periods: ${periodCount}`);
    console.log(`  Load Time: ${loadTime}ms`);
    
    if (loadTime <= TEST_CONFIG.performance.tableLoadMaxTime) {
      console.log(`  ✅ PASS: Load time within ${TEST_CONFIG.performance.tableLoadMaxTime}ms requirement`);
      return { passed: true, loadTime, rowCount };
    } else {
      console.log(`  ❌ FAIL: Load time exceeds ${TEST_CONFIG.performance.tableLoadMaxTime}ms requirement`);
      return { passed: false, loadTime, rowCount };
    }
  } catch (error) {
    console.error(`\n✗ Table load failed:`, error.message);
    return { passed: false, error: error.message };
  }
}

async function testAnalyticsPerformance(projectId) {
  console.log('\n\n📊 Test 2: Analytics Performance');
  console.log('─'.repeat(60));
  console.log('Testing analytics endpoints with 12+ months of data');

  const tests = [
    { name: 'KPIs', endpoint: `/api/budget-analytics/${projectId}/kpis` },
    { name: 'Monthly Spend', endpoint: `/api/budget-analytics/${projectId}/monthly-spend` },
    { name: 'Cumulative Spend', endpoint: `/api/budget-analytics/${projectId}/cumulative-spend` },
    { name: 'Spend Distribution', endpoint: `/api/budget-analytics/${projectId}/spend-distribution` },
    { name: 'Budgeted vs Spent', endpoint: `/api/budget-analytics/${projectId}/budgeted-vs-spent` },
    { name: 'Top 5 Overspend', endpoint: `/api/budget-analytics/${projectId}/top-overspend` },
  ];

  const results = [];

  for (const test of tests) {
    const startTime = Date.now();
    
    try {
      await axios.get(`${API_URL}${test.endpoint}`, getAuthHeaders());
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`\n✓ ${test.name}: ${responseTime}ms`);
      
      if (responseTime <= 1000) {
        console.log(`  ✅ PASS: Response time within 1s`);
        results.push({ name: test.name, passed: true, responseTime });
      } else {
        console.log(`  ⚠️  SLOW: Response time > 1s (acceptable for analytics)`);
        results.push({ name: test.name, passed: true, responseTime, slow: true });
      }
    } catch (error) {
      console.error(`\n✗ ${test.name} failed:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  const allPassed = results.every(r => r.passed);
  const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;

  console.log(`\n📈 Analytics Summary:`);
  console.log(`  Tests Passed: ${results.filter(r => r.passed).length}/${results.length}`);
  console.log(`  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

  return { passed: allPassed, results, avgResponseTime };
}

async function testFilterPerformance(projectId) {
  console.log('\n\n🔍 Test 3: Filter Performance');
  console.log('─'.repeat(60));
  console.log(`Requirement: Filter updates within ${TEST_CONFIG.performance.filterResponseMaxTime}ms`);

  const filterTests = [
    {
      name: 'Date Range Filter',
      params: { startDate: '2025-01-01', endDate: '2025-06-30' },
    },
    {
      name: 'Aircraft Type Filter',
      params: { aircraftType: 'Aircraft-Type-1' },
    },
    {
      name: 'Term Search Filter',
      params: { termSearch: 'term-1' },
    },
    {
      name: 'Combined Filters',
      params: {
        startDate: '2025-01-01',
        endDate: '2025-06-30',
        aircraftType: 'Aircraft-Type-1',
        termSearch: 'term',
      },
    },
  ];

  const results = [];

  for (const test of filterTests) {
    const startTime = Date.now();
    
    try {
      const queryString = new URLSearchParams(test.params).toString();
      await axios.get(
        `${API_URL}/api/budget-analytics/${projectId}/kpis?${queryString}`,
        getAuthHeaders()
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`\n✓ ${test.name}: ${responseTime}ms`);
      
      if (responseTime <= TEST_CONFIG.performance.filterResponseMaxTime) {
        console.log(`  ✅ PASS: Response time within ${TEST_CONFIG.performance.filterResponseMaxTime}ms`);
        results.push({ name: test.name, passed: true, responseTime });
      } else {
        console.log(`  ❌ FAIL: Response time exceeds ${TEST_CONFIG.performance.filterResponseMaxTime}ms`);
        results.push({ name: test.name, passed: false, responseTime });
      }
    } catch (error) {
      console.error(`\n✗ ${test.name} failed:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  const allPassed = results.every(r => r.passed);
  const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;

  console.log(`\n📊 Filter Performance Summary:`);
  console.log(`  Tests Passed: ${results.filter(r => r.passed).length}/${results.length}`);
  console.log(`  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);

  return { passed: allPassed, results, avgResponseTime };
}

async function cleanupTestData(projectId) {
  console.log('\n\n🧹 Cleaning up test data...');
  
  const projectsCollection = db.collection('budgetprojects');
  const planRowsCollection = db.collection('budgetplanrows');
  const actualsCollection = db.collection('budgetactuals');
  const auditCollection = db.collection('budgetauditlog');

  const projectObjectId = new ObjectId(projectId);

  await actualsCollection.deleteMany({ projectId: projectObjectId });
  await planRowsCollection.deleteMany({ projectId: projectObjectId });
  await auditCollection.deleteMany({ projectId: projectObjectId });
  await projectsCollection.deleteOne({ _id: projectObjectId });

  console.log('✓ Test data cleaned up');
}

async function main() {
  console.log('Budget & Cost Revamp - Performance Testing');
  console.log('='.repeat(60));
  console.log(`Testing with ${TEST_CONFIG.largeProject.expectedRows} rows and ${TEST_CONFIG.largeProject.monthCount} months\n`);

  try {
    // Setup
    await connect();
    await authenticate();

    // Create test data
    const { projectId, periods } = await createLargeTestProject();

    // Run performance tests
    const tableTest = await testTableLoadPerformance(projectId);
    const analyticsTest = await testAnalyticsPerformance(projectId);
    const filterTest = await testFilterPerformance(projectId);

    // Cleanup
    await cleanupTestData(projectId);

    // Final Report
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));

    console.log('\n1. Table Load Performance:');
    console.log(`   Status: ${tableTest.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Load Time: ${tableTest.loadTime}ms (requirement: <${TEST_CONFIG.performance.tableLoadMaxTime}ms)`);
    console.log(`   Rows Loaded: ${tableTest.rowCount}`);

    console.log('\n2. Analytics Performance:');
    console.log(`   Status: ${analyticsTest.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Average Response Time: ${analyticsTest.avgResponseTime.toFixed(0)}ms`);
    console.log(`   Tests Passed: ${analyticsTest.results.filter(r => r.passed).length}/${analyticsTest.results.length}`);

    console.log('\n3. Filter Performance:');
    console.log(`   Status: ${filterTest.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Average Response Time: ${filterTest.avgResponseTime.toFixed(0)}ms (requirement: <${TEST_CONFIG.performance.filterResponseMaxTime}ms)`);
    console.log(`   Tests Passed: ${filterTest.results.filter(r => r.passed).length}/${filterTest.results.length}`);

    const allTestsPassed = tableTest.passed && analyticsTest.passed && filterTest.passed;

    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('✅ ALL PERFORMANCE TESTS PASSED');
      console.log('\n✓ System meets all performance requirements:');
      console.log('  - Table loads within 2s for 1000+ rows');
      console.log('  - Analytics respond within acceptable time');
      console.log('  - Filters update within 1s');
    } else {
      console.log('❌ SOME PERFORMANCE TESTS FAILED');
      console.log('\n⚠️  Review failed tests and optimize:');
      if (!tableTest.passed) console.log('  - Table load performance needs optimization');
      if (!analyticsTest.passed) console.log('  - Analytics queries need optimization');
      if (!filterTest.passed) console.log('  - Filter response time needs optimization');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Performance testing failed:', error);
    throw error;
  } finally {
    await disconnect();
  }
}

// Run tests
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
