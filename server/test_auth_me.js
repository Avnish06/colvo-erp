const axios = require('axios');

async function testMe() {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'developer@system.local',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('Login success, token received.');
    
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Me Response:', JSON.stringify(meRes.data, null, 2));
    
    if (meRes.data.success && meRes.data.user.role === 'Developer') {
      console.log('VERIFICATION SUCCESS: /api/auth/me is working!');
    } else {
      console.log('VERIFICATION FAILED: Unexpected response structure or role.');
    }
  } catch (err) {
    console.error('VERIFICATION ERROR:', err.response ? err.response.data : err.message);
  }
}

testMe();
