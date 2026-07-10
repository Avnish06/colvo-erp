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
    fs.writeFileSync('schema_log.txt', 'Error connecting to MySQL: ' + err.message);
    process.exit(1);
  }

  db.query('DESCRIBE attendance', (err, results) => {
    if (err) {
      fs.writeFileSync('schema_log.txt', 'Error describing attendance: ' + err.message);
      process.exit(1);
    }
    let output = '--- ATTENDANCE TABLE SCHEMA ---\n';
    results.forEach(row => {
      output += `${row.Field} | ${row.Type} | Null: ${row.Null} | Key: ${row.Key} | Default: ${row.Default}\n`;
    });
    output += '--- END SCHEMA ---';
    fs.writeFileSync('schema_log.txt', output);
    process.exit(0);
  });
});
