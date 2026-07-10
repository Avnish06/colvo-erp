const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

const updateSchema = async () => {
  try {
    const dbPromise = db.promise();

    console.log('Updating users table schema...');

    // 1. Add employee_id (unique identifier)
    const [cols] = await dbPromise.query('SHOW COLUMNS FROM users LIKE "employee_id"');
    if (cols.length === 0) {
      await dbPromise.query('ALTER TABLE users ADD COLUMN employee_id VARCHAR(20) UNIQUE AFTER id');
      console.log('Added column: employee_id');
    }

    // 2. Update status column to be an ENUM with Pending/Approved/Rejected
    // First check if it exists and what type it is
    const [statusCols] = await dbPromise.query('SHOW COLUMNS FROM users LIKE "status"');
    if (statusCols.length > 0) {
      // Modify existing column
      await dbPromise.query("ALTER TABLE users MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending'");
      console.log('Modified column: status');
    } else {
      // Add if it doesn't exist
      await dbPromise.query("ALTER TABLE users ADD COLUMN status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending'");
      console.log('Added column: status');
    }

    // 3. Set existing users to 'Approved'
    await dbPromise.query("UPDATE users SET status = 'Approved' WHERE status IS NULL OR status = '' OR status = 'Pending'");
    console.log('Updated existing users to Approved status');

    // 4. Generate some dummy employee_ids for existing users if they are NULL
    const [users] = await dbPromise.query('SELECT id, role_id FROM users WHERE employee_id IS NULL');
    for (const user of users) {
      const prefix = user.role_id === 1 || user.role_id === 2 ? 'ADM' : 'EMP';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const uniqueId = `${prefix}-${randomNum}`;
      await dbPromise.query('UPDATE users SET employee_id = ? WHERE id = ?', [uniqueId, user.id]);
    }
    console.log(`Generated employee_ids for ${users.length} existing users`);

    console.log('Schema update completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Schema update failed:', err);
    process.exit(1);
  } finally {
    db.end();
  }
};

updateSchema();
