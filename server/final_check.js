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
    fs.writeFileSync('final_check.txt', 'Error connecting: ' + err.message);
    process.exit(1);
  }

  // Look for ANY record from today Feb 28
  db.query("SELECT * FROM attendance WHERE date >= '2026-02-28' OR id > 390", (err, results) => {
    if (err) {
      fs.writeFileSync('final_check.txt', 'Error querying: ' + err.message);
      process.exit(1);
    }

    let out = '--- RECORDS FROM TODAY (OR ID > 390) ---\n';
    results.forEach(r => {
      out += `ID: ${r.id} | User: ${r.user_id} | Name: ${r.employee_name} | Date: ${r.date} | ClockIn: ${r.clock_in} | Image: ${r.image_url}\n`;
    });

    fs.writeFileSync('final_check.txt', out);
    process.exit(0);
  });
});
