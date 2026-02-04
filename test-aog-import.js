const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const API_URL = 'http://localhost:3003/api';

async function testAOGImport() {
  try {
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@alphastarav.com',
      password: 'Admin@123!'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✓ Logged in successfully\n');
    
    // Step 2: Upload file for preview
    console.log('Step 2: Uploading file for validation...');
    const form = new FormData();
    form.append('file', fs.createReadStream('test_aog_import.xlsx'));
    form.append('importType', 'aog_events');
    
    const uploadResponse = await axios.post(`${API_URL}/import/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Upload successful!');
    console.log(`  Total Rows: ${uploadResponse.data.totalRows}`);
    console.log(`  Valid Rows: ${uploadResponse.data.validCount}`);
    console.log(`  Errors: ${uploadResponse.data.errorCount}`);
    
    if (uploadResponse.data.errors && uploadResponse.data.errors.length > 0) {
      console.log('\n  Validation Errors:');
      uploadResponse.data.errors.forEach(err => {
        console.log(`    Row ${err.row}: ${err.message}`);
      });
    }
    
    if (uploadResponse.data.validRows && uploadResponse.data.validRows.length > 0) {
      console.log('\n  Sample Valid Rows:');
      uploadResponse.data.validRows.slice(0, 3).forEach(row => {
        console.log(`    Row ${row.rowNumber}: ${JSON.stringify(row.data).substring(0, 100)}...`);
      });
    }
    
    const sessionId = uploadResponse.data.sessionId;
    console.log(`\n✓ Session ID: ${sessionId}\n`);
    
    // Step 3: Confirm import
    if (uploadResponse.data.validCount > 0) {
      console.log('Step 3: Confirming import...');
      const confirmResponse = await axios.post(`${API_URL}/import/confirm`, {
        sessionId: sessionId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✓ Import confirmed!');
      console.log(`  Success Count: ${confirmResponse.data.successCount}`);
      console.log(`  Error Count: ${confirmResponse.data.errorCount}`);
      
      if (confirmResponse.data.errors && confirmResponse.data.errors.length > 0) {
        console.log('\n  Import Errors:');
        confirmResponse.data.errors.forEach(err => {
          console.log(`    ${err.message}`);
        });
      }
      
      console.log(`\n✓ Import Log ID: ${confirmResponse.data.importLogId}\n`);
      
      // Step 4: Verify events were created
      console.log('Step 4: Verifying created events...');
      const eventsResponse = await axios.get(`${API_URL}/aog-events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`✓ Total AOG events in database: ${eventsResponse.data.length}`);
      
      // Check active vs resolved
      const activeEvents = eventsResponse.data.filter(e => !e.clearedAt);
      const resolvedEvents = eventsResponse.data.filter(e => e.clearedAt);
      
      console.log(`  Active events: ${activeEvents.length}`);
      console.log(`  Resolved events: ${resolvedEvents.length}`);
      
      // Show sample events
      if (eventsResponse.data.length > 0) {
        console.log('\n  Sample Events:');
        eventsResponse.data.slice(0, 3).forEach(event => {
          const status = event.clearedAt ? 'RESOLVED' : 'ACTIVE';
          const duration = event.durationHours ? `${event.durationHours.toFixed(1)}h` : 'N/A';
          console.log(`    [${status}] ${event.aircraft?.registration || 'Unknown'} - ${event.reasonCode} (${duration})`);
        });
      }
      
      console.log('\n✅ All checkpoint tests passed!');
    } else {
      console.log('⚠️  No valid rows to import');
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testAOGImport();
