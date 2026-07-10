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
    fs.writeFileSync('db_verify_log.txt', 'Error connecting to MySQL: ' + err.message);
    process.exit(1);
  }

  db.query('SELECT COUNT(*) as total FROM attendance', (err, countResult) => {
    if (err) {
      fs.writeFileSync('db_verify_log.txt', 'Error counting attendance: ' + err.message);
      process.exit(1);
    }

    db.query('SELECT * FROM attendance ORDER BY id DESC LIMIT 5', (err, recentResults) => {
      if (err) {
        fs.writeFileSync('db_verify_log.txt', 'Error getting recent records: ' + err.message);
        process.exit(1);
      }

      let log = `Total Records: ${countResult[0].total}\n\n`;
      log += '--- LATEST 5 RECORDS ---\n';
      recentResults.forEach(r => {
        log += `ID: ${r.id} | User: ${r.user_id} | Name: ${r.employee_name} | Date: ${r.date} | ClockIn: ${r.clock_in}\n`;
      });

      fs.writeFileSync('db_verify_log.txt', log);
      process.exit(0);
    });
  });
});
