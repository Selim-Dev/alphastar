/**
 * Fix Imported AOG Events - Recalculate Bucket Times
 * 
 * This script fixes imported AOG events that have milestone timestamps set
 * but show 0 hours in all buckets. It recalculates the bucket times based
 * on the actual milestone timestamps.
 * 
 * For events without procurement milestones (no parts needed):
 * - Technical Time = reportedAt → installationCompleteAt
 * - Procurement Time = 0
 * - Ops Time = 0 (if no testStartAt)
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpi';

/**
 * Computes hours between two dates
 */
function computeHoursBetween(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }
  const durationMs = new Date(endDate).getTime() - new Date(startDate).getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return Math.max(0, Math.round(durationHours * 100) / 100);
}

/**
 * Recalculates bucket times for an event
 */
function recalculateBucketTimes(event) {
  const reportedAt = event.reportedAt || event.detectedAt;
  const procurementRequestedAt = event.procurementRequestedAt;
  const availableAtStoreAt = event.availableAtStoreAt;
  const installationCompleteAt = event.installationCompleteAt;
  const testStartAt = event.testStartAt;
  const upAndRunningAt = event.upAndRunningAt || event.clearedAt;

  let technicalTimeHours = 0;
  let procurementTimeHours = 0;
  let opsTimeHours = 0;

  // Case 1: No procurement needed (no procurementRequestedAt)
  if (!procurementRequestedAt) {
    // All time from reported to installation complete is technical time
    technicalTimeHours = computeHoursBetween(reportedAt, installationCompleteAt);
  } else {
    // Case 2: Procurement was needed
    // Technical Time = (Reported → Procurement Requested) + (Available at Store → Installation Complete)
    const technicalSegment1 = computeHoursBetween(reportedAt, procurementRequestedAt);
    const technicalSegment2 = computeHoursBetween(availableAtStoreAt, installationCompleteAt);
    technicalTimeHours = technicalSegment1 + technicalSegment2;

    // Procurement Time = (Procurement Requested → Available at Store)
    procurementTimeHours = computeHoursBetween(procurementRequestedAt, availableAtStoreAt);
  }

  // Ops Time = (Test Start → Up & Running)
  opsTimeHours = computeHoursBetween(testStartAt, upAndRunningAt);

  // Total Downtime = (Reported → Up & Running)
  const totalDowntimeHours = computeHoursBetween(reportedAt, upAndRunningAt);

  return {
    technicalTimeHours,
    procurementTimeHours,
    opsTimeHours,
    totalDowntimeHours,
  };
}

async function fixImportedAOGBucketTimes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();
    const aogeventsCollection = db.collection('aogevents');

    // Find all imported events with 0 bucket times but have milestone timestamps
    const eventsToFix = await aogeventsCollection
      .find({
        isImported: true,
        reportedAt: { $exists: true },
        installationCompleteAt: { $exists: true },
        $or: [
          { technicalTimeHours: 0 },
          { technicalTimeHours: { $exists: false } },
        ],
      })
      .toArray();

    console.log(`\nFound ${eventsToFix.length} events to fix\n`);

    if (eventsToFix.length === 0) {
      console.log('No events need fixing. All bucket times are already calculated.');
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const event of eventsToFix) {
      try {
        // Recalculate bucket times
        const newMetrics = recalculateBucketTimes(event);

        // Update the event
        const result = await aogeventsCollection.updateOne(
          { _id: event._id },
          {
            $set: {
              technicalTimeHours: newMetrics.technicalTimeHours,
              procurementTimeHours: newMetrics.procurementTimeHours,
              opsTimeHours: newMetrics.opsTimeHours,
              totalDowntimeHours: newMetrics.totalDowntimeHours,
              updatedAt: new Date(),
            },
          }
        );

        if (result.modifiedCount > 0) {
          fixedCount++;
          console.log(`✓ Fixed event ${event._id}:`);
          console.log(`  Aircraft: ${event.aircraftId}`);
          console.log(`  Reason: ${event.reasonCode}`);
          console.log(`  Technical: ${newMetrics.technicalTimeHours}hrs`);
          console.log(`  Procurement: ${newMetrics.procurementTimeHours}hrs`);
          console.log(`  Ops: ${newMetrics.opsTimeHours}hrs`);
          console.log(`  Total: ${newMetrics.totalDowntimeHours}hrs\n`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Error fixing event ${event._id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total events found: ${eventsToFix.length}`);
    console.log(`Successfully fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Verify the fix
    console.log('\nVerifying fix...');
    const remainingIssues = await aogeventsCollection.countDocuments({
      isImported: true,
      reportedAt: { $exists: true },
      installationCompleteAt: { $exists: true },
      technicalTimeHours: 0,
      totalDowntimeHours: { $gt: 0 },
    });

    if (remainingIssues === 0) {
      console.log('✓ All imported events now have correct bucket times!');
    } else {
      console.log(`⚠ Warning: ${remainingIssues} events still have issues`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the fix
fixImportedAOGBucketTimes()
  .then(() => {
    console.log('\n✓ Fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Fix failed:', error);
    process.exit(1);
  });
