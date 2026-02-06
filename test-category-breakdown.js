/**
 * Test script to verify category breakdown endpoint
 * Run with: node test-category-breakdown.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testCategoryBreakdown() {
  console.log('🧪 Testing Category Breakdown Endpoint\n');

  try {
    // Test 1: Get all events to see what categories exist
    console.log('📊 Step 1: Fetching all AOG events...');
    const eventsResponse = await axios.get(`${API_BASE_URL}/aog-events`);
    const events = eventsResponse.data;
    
    console.log(`✅ Found ${events.length} total events`);
    
    // Count categories
    const categoryCounts = {};
    events.forEach(event => {
      const category = event.category || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log('\n📈 Category distribution in raw data:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} events`);
    });

    // Test 2: Call the category breakdown endpoint
    console.log('\n📊 Step 2: Calling category-breakdown endpoint...');
    const breakdownResponse = await axios.get(`${API_BASE_URL}/aog-events/analytics/category-breakdown`);
    const breakdown = breakdownResponse.data;
    
    console.log('\n✅ Category Breakdown Response:');
    console.log(JSON.stringify(breakdown, null, 2));
    
    if (!breakdown || breakdown.length === 0) {
      console.log('\n❌ ERROR: Endpoint returned empty array!');
      console.log('   This means the aggregation pipeline is not matching any documents.');
    } else {
      console.log(`\n✅ SUCCESS: Endpoint returned ${breakdown.length} categories`);
      breakdown.forEach(item => {
        console.log(`   ${item.category}: ${item.count} events (${item.percentage}%) - ${item.totalHours}h`);
      });
    }

    // Test 3: Test with date filters
    console.log('\n📊 Step 3: Testing with date filters (last 30 days)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filteredResponse = await axios.get(`${API_BASE_URL}/aog-events/analytics/category-breakdown`, {
      params: {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      }
    });
    
    console.log('\n✅ Filtered Category Breakdown Response:');
    console.log(JSON.stringify(filteredResponse.data, null, 2));

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testCategoryBreakdown();
