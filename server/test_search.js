const http = require('http');

// First login to get token
const loginData = JSON.stringify({ email: 'superadmin@example.com', password: 'password123' });
const loginOpts = {
  hostname: 'localhost', port: 5000,
  path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
};

const loginReq = http.request(loginOpts, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    if (!data.success) { console.log('Login failed:', body); process.exit(1); }
    const token = data.token;
    console.log('Login OK. Testing search...\n');

    // Test search
    const searchOpts = {
      hostname: 'localhost', port: 5000,
      path: '/api/search?q=admin', method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    http.request(searchOpts, (sRes) => {
      let sBody = '';
      sRes.on('data', (c) => sBody += c);
      sRes.on('end', () => {
        console.log('Search results:', JSON.stringify(JSON.parse(sBody), null, 2));
        process.exit(0);
      });
    }).end();
  });
});
loginReq.write(loginData);
loginReq.end();
