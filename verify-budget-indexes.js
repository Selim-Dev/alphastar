/**
 * Verify Budget Database Indexes
 * 
 * This script verifies that all required indexes for the Budget & Cost Revamp
 * feature are properly created in MongoDB.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpi';

const REQUIRED_INDEXES = {
  budgetprojects: [
    { key: { name: 1 }, unique: true, name: 'name_1' },
    { key: { templateType: 1, status: 1 }, name: 'templateType_1_status_1' },
    { key: { 'dateRange.start': 1, 'dateRange.end': 1 }, name: 'dateRange.start_1_dateRange.end_1' },
  ],
  budgetplanrows: [
    { key: { projectId: 1, termId: 1, aircraftId: 1 }, unique: true, name: 'projectId_1_termId_1_aircraftId_1' },
    { key: { projectId: 1 }, name: 'projectId_1' },
    { key: { termId: 1 }, name: 'termId_1' },
  ],
  budgetactuals: [
    { key: { projectId: 1, termId: 1, period: 1 }, name: 'projectId_1_termId_1_period_1' },
    { key: { projectId: 1, period: 1 }, name: 'projectId_1_period_1' },
    { key: { period: 1 }, name: 'period_1' },
  ],
  budgetauditlog: [
    { key: { projectId: 1, timestamp: -1 }, name: 'projectId_1_timestamp_-1' },
    { key: { userId: 1, timestamp: -1 }, name: 'userId_1_timestamp_-1' },
    { key: { entityType: 1, entityId: 1 }, name: 'entityType_1_entityId_1' },
  ],
};

function keysMatch(key1, key2) {
  const keys1 = Object.keys(key1).sort();
  const keys2 = Object.keys(key2).sort();
  
  if (keys1.length !== keys2.length) return false;
  
  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i] || key1[keys1[i]] !== key2[keys2[i]]) {
      return false;
    }
  }
  
  return true;
}

async function verifyIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db();
    let allIndexesValid = true;
    
    for (const [collectionName, requiredIndexes] of Object.entries(REQUIRED_INDEXES)) {
      console.log(`\n📊 Checking collection: ${collectionName}`);
      console.log('─'.repeat(60));
      
      const collection = db.collection(collectionName);
      const existingIndexes = await collection.indexes();
      
      for (const requiredIndex of requiredIndexes) {
        const found = existingIndexes.find(idx => keysMatch(idx.key, requiredIndex.key));
        
        if (found) {
          const uniqueMatch = requiredIndex.unique ? found.unique === true : true;
          if (uniqueMatch) {
            console.log(`✓ Index found: ${JSON.stringify(requiredIndex.key)}`);
            if (requiredIndex.unique) {
              console.log(`  └─ Unique: Yes`);
            }
          } else {
            console.log(`✗ Index found but unique constraint mismatch: ${JSON.stringify(requiredIndex.key)}`);
            allIndexesValid = false;
          }
        } else {
          console.log(`✗ Missing index: ${JSON.stringify(requiredIndex.key)}`);
          allIndexesValid = false;
        }
      }
      
      console.log(`\nTotal indexes in ${collectionName}: ${existingIndexes.length}`);
    }
    
    console.log('\n' + '='.repeat(60));
    if (allIndexesValid) {
      console.log('✓ All required indexes are present and valid');
      console.log('\n📈 Performance Optimization: COMPLETE');
    } else {
      console.log('✗ Some indexes are missing or invalid');
      console.log('\n⚠️  Run the application to auto-create missing indexes');
      console.log('   or manually create them using the MongoDB shell');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error verifying indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function explainQuery() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('\n\n🔍 Query Performance Analysis');
    console.log('='.repeat(60));
    
    // Test query 1: Find projects by year
    console.log('\n1. Find projects by year (2025):');
    const projectsCollection = db.collection('budgetprojects');
    const explain1 = await projectsCollection.find({
      'dateRange.start': { $lte: new Date('2025-12-31') },
      'dateRange.end': { $gte: new Date('2025-01-01') }
    }).explain('executionStats');
    
    console.log(`   Execution time: ${explain1.executionStats.executionTimeMillis}ms`);
    console.log(`   Documents examined: ${explain1.executionStats.totalDocsExamined}`);
    console.log(`   Documents returned: ${explain1.executionStats.nReturned}`);
    console.log(`   Index used: ${explain1.executionStats.executionStages.indexName || 'NONE (collection scan)'}`);
    
    // Test query 2: Get plan rows for project
    console.log('\n2. Get plan rows for a project:');
    const planRowsCollection = db.collection('budgetplanrows');
    const projects = await projectsCollection.find().limit(1).toArray();
    
    if (projects.length > 0) {
      const explain2 = await planRowsCollection.find({
        projectId: projects[0]._id
      }).explain('executionStats');
      
      console.log(`   Execution time: ${explain2.executionStats.executionTimeMillis}ms`);
      console.log(`   Documents examined: ${explain2.executionStats.totalDocsExamined}`);
      console.log(`   Documents returned: ${explain2.executionStats.nReturned}`);
      console.log(`   Index used: ${explain2.executionStats.executionStages.indexName || 'NONE (collection scan)'}`);
    } else {
      console.log('   No projects found to test');
    }
    
    // Test query 3: Get actuals by period
    console.log('\n3. Get actuals for a specific period:');
    const actualsCollection = db.collection('budgetactuals');
    const explain3 = await actualsCollection.find({
      period: '2025-01'
    }).explain('executionStats');
    
    console.log(`   Execution time: ${explain3.executionStats.executionTimeMillis}ms`);
    console.log(`   Documents examined: ${explain3.executionStats.totalDocsExamined}`);
    console.log(`   Documents returned: ${explain3.executionStats.nReturned}`);
    console.log(`   Index used: ${explain3.executionStats.executionStages.indexName || 'NONE (collection scan)'}`);
    
    // Test query 4: Get audit log for project
    console.log('\n4. Get audit log for a project (sorted by timestamp):');
    const auditCollection = db.collection('budgetauditlog');
    
    if (projects.length > 0) {
      const explain4 = await auditCollection.find({
        projectId: projects[0]._id
      }).sort({ timestamp: -1 }).explain('executionStats');
      
      console.log(`   Execution time: ${explain4.executionStats.executionTimeMillis}ms`);
      console.log(`   Documents examined: ${explain4.executionStats.totalDocsExamined}`);
      console.log(`   Documents returned: ${explain4.executionStats.nReturned}`);
      console.log(`   Index used: ${explain4.executionStats.executionStages.indexName || 'NONE (collection scan)'}`);
    } else {
      console.log('   No projects found to test');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ Query performance analysis complete');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error analyzing query performance:', error);
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('Budget & Cost Revamp - Database Index Verification');
  console.log('='.repeat(60));
  
  await verifyIndexes();
  await explainQuery();
  
  console.log('\n✓ Verification complete\n');
}

main().catch(console.error);
