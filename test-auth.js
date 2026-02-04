const axios = require('axios');

const API_URL = 'http://localhost:3003/api';

async function testAuth() {
  try {
    // Login
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@alphastarav.com',
      password: 'Admin@123!'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✓ Token received:', token.substring(0, 20) + '...');
    
    // Test authenticated endpoint
    console.log('\nTesting /api/aircraft endpoint...');
    const aircraftResponse = await axios.get(`${API_URL}/aircraft`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Aircraft endpoint works!');
    console.log(`  Found ${aircraftResponse.data.length} aircraft`);
    
    // Test import types endpoint
    console.log('\nTesting /api/import/types endpoint...');
    const typesResponse = await axios.get(`${API_URL}/import/types`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Import types endpoint works!');
    console.log('  Available types:', typesResponse.data.map(t => t.type).join(', '));
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAuth();
