const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1);
  }

  db.query('SELECT id, email, role_id, status FROM users', (err, results) => {
    if (err) {
      console.error('Error querying users:', err.message);
      process.exit(1);
    }
    console.log('--- USERS ---');
    results.forEach(u => {
      console.log(`${u.id} | ${u.email} | Role: ${u.role_id} | Status: ${u.status}`);
    });
    process.exit(0);
  });
});
