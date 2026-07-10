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
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }

  db.query('DESCRIBE attendance', (err, results) => {
    if (err) {
      console.error('Error describing attendance:', err);
      process.exit(1);
    }
    console.log('--- ATTENDANCE TABLE SCHEMA ---');
    results.forEach(row => {
      console.log(`${row.Field} | ${row.Type} | Null: ${row.Null} | Key: ${row.Key} | Default: ${row.Default}`);
    });
    console.log('--- END SCHEMA ---');
    process.exit(0);
  });
});
