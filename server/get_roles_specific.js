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

  db.query('SELECT id, name FROM roles WHERE id IN (1, 2, 3)', (err, results) => {
    if (results) {
        results.forEach(r => console.log(`${r.id}: ${r.name}`));
    }
    process.exit(0);
  });
});
