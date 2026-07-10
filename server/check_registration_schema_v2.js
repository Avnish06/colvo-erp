const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
  }

  console.log('✅ Connected to database');

  const tables = ['employees', 'user_identities', 'users'];
  let completed = 0;

  tables.forEach(table => {
    db.query(`DESC ${table}`, (err, results) => {
      if (err) {
        console.error(`❌ Error describing ${table}:`, err.message);
      } else {
        console.log(`\n--- Schema for ${table} ---`);
        console.table(results.map(r => ({ Field: r.Field, Type: r.Type, Null: r.Null, Key: r.Key })));
      }

      completed++;
      if (completed === tables.length) {
        process.exit();
      }
    });
  });
});
