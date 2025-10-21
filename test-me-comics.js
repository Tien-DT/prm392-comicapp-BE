const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123456';

async function testMeComicsEndpoint() {
  console.log('🧪 Testing /api/me/comics endpoint\n');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthRes.data);
    
    // Step 2: Login
    console.log('\n2️⃣ Logging in...');
    console.log(`Email: ${TEST_EMAIL}`);
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (!loginRes.data.accessToken) {
      throw new Error('No access token received');
    }
    
    const token = loginRes.data.accessToken;
    const user = loginRes.data.user;
    console.log('✅ Login successful');
    console.log('User:', { id: user.id, email: user.email, username: user.username });
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Step 3: Test /me/comics
    console.log('\n3️⃣ Testing GET /api/me/comics...');
    const comicsRes = await axios.get(`${BASE_URL}/me/comics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('✅ Response received');
    console.log('Status:', comicsRes.status);
    console.log('\n📊 Response Data:');
    console.log(JSON.stringify(comicsRes.data, null, 2));
    
    const { data, pagination } = comicsRes.data;
    console.log('\n📈 Summary:');
    console.log(`Total Comics: ${pagination.totalComics}`);
    console.log(`Comics in Response: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\n📚 Comics:');
      data.forEach((comic, index) => {
        console.log(`  ${index + 1}. ${comic.title}`);
        console.log(`     ID: ${comic.id}`);
        console.log(`     Visibility: ${comic.visibility}`);
        console.log(`     Chapters: ${comic._count?.chapters || 0}`);
        console.log(`     Status: ${comic.status}`);
      });
    } else {
      console.log('\n⚠️  No comics found. Create a comic first!');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('\n' + '='.repeat(50));
    console.error('❌ Test failed!');
    
    if (error.response) {
      console.error('\nResponse Error:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\nRequest Error:');
      console.error('No response received from server');
      console.error('Is the backend running at', BASE_URL, '?');
    } else {
      console.error('\nError:', error.message);
    }
    
    process.exit(1);
  }
}

// Run test
testMeComicsEndpoint();
