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

  const query = 'ALTER TABLE attendance ADD COLUMN employee_name VARCHAR(255) AFTER user_id';

  db.query(query, (err) => {
    if (err) {
      if (err.code === 'ER_DUP_COLUMN_NAME') {
        console.log('Column employee_name already exists.');
        process.exit(0);
      }
      console.error('Error adding column:', err);
      process.exit(1);
    }
    console.log('Column employee_name added successfully to attendance table.');
    process.exit(0);
  });
});
