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

async function migrateStatuses() {
  try {
    console.log('Migrating legacy \"Approved\" statuses to \"Active\"...');
    const [result] = await dbPromise.query("UPDATE users SET status = 'Active' WHERE status = 'Approved'");
    console.log(`Successfully migrated ${result.affectedRows} users to Active status.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.end();
  }
}

migrateStatuses();
