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

  db.query('SELECT id, email, role_id, status FROM users WHERE status IS NULL', (err, results) => {
    if (err) {
      console.error('Error querying users view:', err.message);
      process.exit(1);
    }
    console.log('--- USERS WITH NULL STATUS ---');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  });
});
