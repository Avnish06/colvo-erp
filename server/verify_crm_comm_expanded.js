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

async function verify() {
  try {
    console.log('Verifying Expanded CRM Communication API...');

    // 1. Check Tables
    const tables = ['call_logs', 'call_reminders', 'message_logs'];
    for (const table of tables) {
      const [res] = await dbPromise.query(`SHOW TABLES LIKE '${table}'`);
      if (res.length === 0) throw new Error(`${table} missing`);
      console.log(`✅ ${table} exists`);
    }

    // 2. Test Call Logging
    const [userRes] = await dbPromise.query('SELECT id FROM users LIMIT 1');
    const userId = userRes[0].id;

    await dbPromise.query(
      'INSERT INTO call_logs (contact_id, contact_type, duration, notes, user_id) VALUES (?, ?, ?, ?, ?)',
      [1, 'Lead', '10m', 'Test call note', userId]
    );
    console.log('✅ Call logged successfully');

    // 3. Test Call Reminder
    await dbPromise.query(
      'INSERT INTO call_reminders (contact_id, contact_type, remind_at, notes, user_id) VALUES (?, ?, ?, ?, ?)',
      [1, 'Lead', '2026-12-31 10:00:00', 'Follow up test', userId]
    );
    console.log('✅ Call reminder set');

    // 4. Test Message Logging
    await dbPromise.query(
      'INSERT INTO message_logs (recipient, platform, message, user_id) VALUES (?, ?, ?, ?)',
      ['+919999999999', 'WhatsApp', 'Test WhatsApp message', userId]
    );
    console.log('✅ Message logged successfully');

    console.log('\nExpansion Verification Successful!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    db.end();
  }
}

verify();
