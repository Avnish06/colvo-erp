const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

const dbPromise = db.promise();

async function migrate() {
  try {
    console.log('Migrating roles...');
    // Update Role 3
    await dbPromise.query("UPDATE roles SET name = 'Employee ERP' WHERE id = 3");
    // Add Role 4
    await dbPromise.query("INSERT IGNORE INTO roles (id, name) VALUES (4, 'Employee CRM')");
    console.log('Roles updated successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.end();
  }
}

migrate();
