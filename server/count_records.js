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

  const tables = ['superadmins', 'admins', 'employees', 'developers', 'vendors', 'user_identities'];
  
  const checkTable = (index) => {
    if (index >= tables.length) {
      process.exit(0);
      return;
    }
    const table = tables[index];
    db.query(`SELECT COUNT(*) as count FROM ${table}`, (err, results) => {
      if (err) {
        console.log(`${table}: Table doesn't exist or error: ${err.message}`);
      } else {
        console.log(`${table}: ${results[0].count} records`);
      }
      checkTable(index + 1);
    });
  };

  checkTable(0);
});
