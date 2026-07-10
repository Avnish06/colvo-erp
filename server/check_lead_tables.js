const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

db.query("SHOW TABLES", (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const tables = results.map(r => Object.values(r)[0]);
  console.log('Existing Tables:', tables);

  const expected = ['leads', 'lead_activities', 'lead_reminders'];
  const missing = expected.filter(t => !tables.includes(t));

  if (missing.length > 0) {
    console.log('Missing Tables:', missing);
  } else {
    console.log('All CRM lead tables exist.');
  }
  db.end();
});
