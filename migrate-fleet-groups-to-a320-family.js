/**
 * Migration Script: Merge A318, A319, A320 fleet groups into "A320 Family"
 *
 * This script updates all aircraft records that have fleetGroup set to
 * "A318", "A319", or "A320" to use "A320 Family" instead.
 *
 * Usage:
 *   node migrate-fleet-groups-to-a320-family.js
 *
 * Requires MONGODB_URI env variable or defaults to localhost.
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpi';
const OLD_GROUPS = ['A318', 'A319', 'A320', 'AIRBUS 320 FAMILY'];
const NEW_GROUP = 'AIRBUS A320 FAMILY';

async function migrate() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    console.log('=== Fleet Group Migration: A318/A319/A320 → A320 Family ===\n');

    // 1. Update aircraft collection
    const aircraftResult = await db.collection('aircrafts').updateMany(
      { fleetGroup: { $in: OLD_GROUPS } },
      { $set: { fleetGroup: NEW_GROUP } },
    );
    console.log(`aircrafts: ${aircraftResult.modifiedCount} records updated`);

    // 2. Update budget plans (aircraftGroup field)
    const budgetResult = await db.collection('budgetplans').updateMany(
      { aircraftGroup: { $in: OLD_GROUPS } },
      { $set: { aircraftGroup: NEW_GROUP } },
    );
    console.log(`budgetplans: ${budgetResult.modifiedCount} records updated`);

    // 3. Update actual spend (aircraftGroup field)
    const spendResult = await db.collection('actualspends').updateMany(
      { aircraftGroup: { $in: OLD_GROUPS } },
      { $set: { aircraftGroup: NEW_GROUP } },
    );
    console.log(`actualspends: ${spendResult.modifiedCount} records updated`);

    // Verify
    const remaining = await db.collection('aircrafts').countDocuments({
      fleetGroup: { $in: OLD_GROUPS },
    });
    console.log(`\nVerification: ${remaining} aircraft still have old fleet groups (should be 0)`);

    const a320FamilyCount = await db.collection('aircrafts').countDocuments({
      fleetGroup: NEW_GROUP,
    });
    console.log(`Total aircraft in "A320 Family": ${a320FamilyCount}`);

    console.log('\nMigration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
