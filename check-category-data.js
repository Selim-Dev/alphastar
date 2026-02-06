/**
 * Check category data directly in MongoDB
 * Run with: node check-category-data.js
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alphastar-kpi';

async function checkCategoryData() {
  console.log('🔍 Checking AOG Event Categories in MongoDB\n');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('aogevents');
    
    // Count total events
    const totalCount = await collection.countDocuments();
    console.log(`\n📊 Total AOG Events: ${totalCount}`);
    
    // Get distinct categories
    const categories = await collection.distinct('category');
    console.log(`\n📋 Distinct Categories Found: ${JSON.stringify(categories)}`);
    
    // Count by category
    console.log('\n📈 Category Distribution:');
    const categoryCounts = await collection.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    categoryCounts.forEach(item => {
      console.log(`   ${item._id || 'null/undefined'}: ${item.count} events`);
    });
    
    // Sample a few events to see their structure
    console.log('\n📄 Sample Events (first 3):');
    const samples = await collection.find().limit(3).toArray();
    samples.forEach((event, index) => {
      console.log(`\n   Event ${index + 1}:`);
      console.log(`   - _id: ${event._id}`);
      console.log(`   - category: ${event.category}`);
      console.log(`   - detectedAt: ${event.detectedAt}`);
      console.log(`   - reasonCode: ${event.reasonCode}`);
    });
    
    // Test the aggregation pipeline that the backend uses
    console.log('\n🧪 Testing Backend Aggregation Pipeline:');
    const pipeline = [
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalHours: { $sum: { $ifNull: ['$totalDowntimeHours', 0] } },
        },
      },
      {
        $group: {
          _id: null,
          categories: {
            $push: {
              category: '$_id',
              count: '$count',
              totalHours: '$totalHours',
            },
          },
          totalCount: { $sum: '$count' },
        },
      },
      {
        $unwind: '$categories',
      },
      {
        $project: {
          _id: 0,
          category: '$categories.category',
          count: '$categories.count',
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$categories.count', '$totalCount'] },
                  100,
                ],
              },
              2,
            ],
          },
          totalHours: { $round: ['$categories.totalHours', 2] },
        },
      },
      {
        $sort: { count: -1 },
      },
    ];
    
    const result = await collection.aggregate(pipeline).toArray();
    console.log('\n✅ Aggregation Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.length === 0) {
      console.log('\n❌ WARNING: Aggregation returned empty array!');
      console.log('   This could mean:');
      console.log('   1. No events in database');
      console.log('   2. All events have null/undefined category field');
      console.log('   3. Issue with aggregation pipeline');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkCategoryData();
