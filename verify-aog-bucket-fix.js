/**
 * Verify AOG Bucket Times Fix
 * 
 * This script verifies that the bucket times are now correctly calculated
 * for all imported AOG events.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpi';

async function verifyBucketFix() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();
    const aogeventsCollection = db.collection('aogevents');
    const aircraftCollection = db.collection('aircraft');

    // Get all imported events
    const events = await aogeventsCollection
      .find({ isImported: true })
      .sort({ totalDowntimeHours: -1 })
      .toArray();

    console.log('='.repeat(80));
    console.log('AOG EVENTS - BUCKET TIMES VERIFICATION');
    console.log('='.repeat(80));
    console.log(`Total imported events: ${events.length}\n`);

    // Calculate totals
    let totalTechnical = 0;
    let totalProcurement = 0;
    let totalOps = 0;
    let totalDowntime = 0;

    console.log('Event Details:');
    console.log('-'.repeat(80));

    for (const event of events) {
      // Get aircraft registration
      const aircraft = await aircraftCollection.findOne({ _id: event.aircraftId });
      const registration = aircraft ? aircraft.registration : 'Unknown';

      console.log(`\nAircraft: ${registration}`);
      console.log(`Reason: ${event.reasonCode}`);
      console.log(`Detected: ${event.detectedAt.toISOString()}`);
      console.log(`Cleared: ${event.clearedAt ? event.clearedAt.toISOString() : 'Still active'}`);
      console.log(`Technical Time: ${event.technicalTimeHours || 0}hrs`);
      console.log(`Procurement Time: ${event.procurementTimeHours || 0}hrs`);
      console.log(`Ops Time: ${event.opsTimeHours || 0}hrs`);
      console.log(`Total Downtime: ${event.totalDowntimeHours || 0}hrs`);

      totalTechnical += event.technicalTimeHours || 0;
      totalProcurement += event.procurementTimeHours || 0;
      totalOps += event.opsTimeHours || 0;
      totalDowntime += event.totalDowntimeHours || 0;
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Technical Time: ${totalTechnical.toFixed(2)}hrs`);
    console.log(`Total Procurement Time: ${totalProcurement.toFixed(2)}hrs`);
    console.log(`Total Ops Time: ${totalOps.toFixed(2)}hrs`);
    console.log(`Total Downtime: ${totalDowntime.toFixed(2)}hrs`);
    console.log('='.repeat(80));

    // Calculate percentages
    if (totalDowntime > 0) {
      const techPercent = (totalTechnical / totalDowntime) * 100;
      const procPercent = (totalProcurement / totalDowntime) * 100;
      const opsPercent = (totalOps / totalDowntime) * 100;

      console.log('\nBucket Distribution:');
      console.log(`Technical: ${techPercent.toFixed(1)}%`);
      console.log(`Procurement: ${procPercent.toFixed(1)}%`);
      console.log(`Ops: ${opsPercent.toFixed(1)}%`);
    }

    // Check for any remaining issues
    const issuesCount = await aogeventsCollection.countDocuments({
      isImported: true,
      totalDowntimeHours: { $gt: 0 },
      technicalTimeHours: 0,
      procurementTimeHours: 0,
      opsTimeHours: 0,
    });

    console.log('\n' + '='.repeat(80));
    if (issuesCount === 0) {
      console.log('✓ SUCCESS: All imported events have correct bucket times!');
    } else {
      console.log(`⚠ WARNING: ${issuesCount} events still have all buckets at 0`);
    }
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the verification
verifyBucketFix()
  .then(() => {
    console.log('\n✓ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Verification failed:', error);
    process.exit(1);
  });
