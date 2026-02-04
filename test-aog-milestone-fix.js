/**
 * Test Script: Verify AOG Milestone Fix
 * 
 * This script tests that:
 * 1. Imported events have milestone timestamps
 * 2. Computed metrics are calculated correctly
 * 3. Charts will show data (metrics > 0)
 * 
 * Usage: node test-aog-milestone-fix.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpis';

async function testMilestoneFix() {
  console.log('🧪 Testing AOG Milestone Fix...\n');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const AOGEvent = mongoose.model('AOGEvent', new mongoose.Schema({}, { strict: false }), 'aogevents');
    
    // Test 1: Check imported events have milestones
    console.log('📋 Test 1: Checking imported events have milestones...');
    const importedEvents = await AOGEvent.find({ isImported: true }).limit(5);
    
    let milestonesOk = 0;
    let milestonesMissing = 0;
    
    for (const event of importedEvents) {
      const hasReported = !!event.reportedAt;
      const hasUpAndRunning = !!event.upAndRunningAt || !event.clearedAt; // Active events don't need upAndRunning
      
      if (hasReported && (hasUpAndRunning || !event.clearedAt)) {
        milestonesOk++;
      } else {
        milestonesMissing++;
        console.log(`   ⚠️  Event ${event._id} missing milestones`);
      }
    }
    
    console.log(`   ✅ ${milestonesOk}/${importedEvents.length} events have milestones`);
    if (milestonesMissing > 0) {
      console.log(`   ⚠️  ${milestonesMissing} events missing milestones - run migration script`);
    }
    
    // Test 2: Check computed metrics
    console.log('\n📊 Test 2: Checking computed metrics...');
    const eventsWithMetrics = await AOGEvent.find({
      isImported: true,
      clearedAt: { $exists: true },
      totalDowntimeHours: { $gt: 0 }
    }).limit(5);
    
    console.log(`   Found ${eventsWithMetrics.length} resolved imported events with metrics`);
    
    for (const event of eventsWithMetrics) {
      const total = event.totalDowntimeHours || 0;
      const technical = event.technicalTimeHours || 0;
      const procurement = event.procurementTimeHours || 0;
      const ops = event.opsTimeHours || 0;
      
      console.log(`   Event ${event._id.toString().slice(-8)}:`);
      console.log(`      Total: ${total.toFixed(2)}h`);
      console.log(`      Technical: ${technical.toFixed(2)}h`);
      console.log(`      Procurement: ${procurement.toFixed(2)}h`);
      console.log(`      Ops: ${ops.toFixed(2)}h`);
      
      if (total > 0) {
        console.log(`      ✅ Metrics computed correctly`);
      } else {
        console.log(`      ⚠️  Total downtime is 0 - check milestone timestamps`);
      }
    }
    
    // Test 3: Check analytics will work
    console.log('\n📈 Test 3: Checking analytics data...');
    
    const analyticsData = await AOGEvent.aggregate([
      {
        $match: {
          isImported: true,
          clearedAt: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          totalDowntime: { $sum: '$totalDowntimeHours' },
          totalTechnical: { $sum: '$technicalTimeHours' },
          totalProcurement: { $sum: '$procurementTimeHours' },
          totalOps: { $sum: '$opsTimeHours' },
          avgDowntime: { $avg: '$totalDowntimeHours' }
        }
      }
    ]);
    
    if (analyticsData.length > 0) {
      const data = analyticsData[0];
      console.log(`   Total Events: ${data.totalEvents}`);
      console.log(`   Total Downtime: ${data.totalDowntime.toFixed(2)}h`);
      console.log(`   Avg Downtime: ${data.avgDowntime.toFixed(2)}h`);
      console.log(`   Technical Time: ${data.totalTechnical.toFixed(2)}h (${((data.totalTechnical / data.totalDowntime) * 100).toFixed(1)}%)`);
      console.log(`   Procurement Time: ${data.totalProcurement.toFixed(2)}h (${((data.totalProcurement / data.totalDowntime) * 100).toFixed(1)}%)`);
      console.log(`   Ops Time: ${data.totalOps.toFixed(2)}h (${((data.totalOps / data.totalDowntime) * 100).toFixed(1)}%)`);
      
      if (data.totalDowntime > 0) {
        console.log(`   ✅ Analytics data available - charts will show data`);
      } else {
        console.log(`   ⚠️  No downtime data - run migration script`);
      }
    } else {
      console.log(`   ⚠️  No analytics data found - check if events exist`);
    }
    
    // Test 4: Check upAndRunningAt equals clearedAt
    console.log('\n🔄 Test 4: Checking upAndRunningAt = clearedAt...');
    const mismatchEvents = await AOGEvent.find({
      isImported: true,
      clearedAt: { $exists: true },
      $expr: {
        $ne: ['$upAndRunningAt', '$clearedAt']
      }
    }).limit(5);
    
    if (mismatchEvents.length === 0) {
      console.log(`   ✅ All resolved events have upAndRunningAt = clearedAt`);
    } else {
      console.log(`   ⚠️  Found ${mismatchEvents.length} events where upAndRunningAt ≠ clearedAt`);
      for (const event of mismatchEvents) {
        console.log(`      Event ${event._id.toString().slice(-8)}: upAndRunning=${event.upAndRunningAt?.toISOString()}, cleared=${event.clearedAt?.toISOString()}`);
      }
      console.log(`   Run migration script to fix`);
    }
    
    // Summary
    console.log('\n📋 Test Summary:');
    console.log(`   ✅ Milestone timestamps: ${milestonesOk > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Computed metrics: ${eventsWithMetrics.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Analytics data: ${analyticsData.length > 0 && analyticsData[0].totalDowntime > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ upAndRunningAt = clearedAt: ${mismatchEvents.length === 0 ? 'PASS' : 'FAIL'}`);
    
    const allPass = milestonesOk > 0 && eventsWithMetrics.length > 0 && 
                    analyticsData.length > 0 && analyticsData[0].totalDowntime > 0 &&
                    mismatchEvents.length === 0;
    
    if (allPass) {
      console.log('\n🎉 All tests passed! Charts should show data.');
    } else {
      console.log('\n⚠️  Some tests failed. Run migration script: node fix-imported-aog-milestones.js');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

testMilestoneFix()
  .then(() => {
    console.log('\n✅ Testing complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
