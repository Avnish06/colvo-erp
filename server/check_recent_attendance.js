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
    fs.writeFileSync('attendance_check_log.txt', 'Error connecting to MySQL: ' + err.message);
    process.exit(1);
  }

  // Check for the most recent 10 records
  db.query('SELECT * FROM attendance ORDER BY id DESC LIMIT 10', (err, results) => {
    if (err) {
      fs.writeFileSync('attendance_check_log.txt', 'Error querying attendance: ' + err.message);
      process.exit(1);
    }

    let output = '--- MOST RECENT ATTENDANCE RECORDS ---\n';
    if (results.length === 0) {
      output += 'No records found.\n';
    } else {
      results.forEach(row => {
        output += `ID: ${row.id} | UserID: ${row.user_id} | Name: ${row.employee_name} | Date: ${row.date} | ClockIn: ${row.clock_in} | Image: ${row.image_url}\n`;
      });
    }
    output += '--- END RECORDS ---';
    fs.writeFileSync('attendance_check_log.txt', output);
    process.exit(0);
  });
});
