const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('Login success');

    const statsRes = await axios.get('http://localhost:5000/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Stats Response:', JSON.stringify(statsRes.data, null, 2));
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

test();
