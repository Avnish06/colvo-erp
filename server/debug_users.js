const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

db.connect((err) => {
  if (err) {
    fs.writeFileSync('users_schema_log.txt', 'Error connecting to MySQL: ' + err.message);
    process.exit(1);
  }

  db.query('DESCRIBE users', (err, results) => {
    if (err) {
      fs.writeFileSync('users_schema_log.txt', 'Error describing users: ' + err.message);
      process.exit(1);
    }
    let output = '--- USERS SCHEMA ---\n';
    results.forEach(row => {
      output += `${row.Field} | ${row.Type}\n`;
    });
    fs.writeFileSync('users_schema_log.txt', output);
    process.exit(0);
  });
});
