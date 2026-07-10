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

async function verifyLeads() {
  try {
    console.log('Verifying CRM Lead Management API...');

    // 1. Get a test user (CRM Employee or Admin)
    const [users] = await dbPromise.query('SELECT id FROM users WHERE role_id IN (1, 2, 4) LIMIT 1');
    if (users.length === 0) {
      console.log('No eligible user found for lead assignment. Please create a CRM employee first.');
      return;
    }
    const userId = users[0].id;

    // 2. Create a test lead
    const [leadResult] = await dbPromise.query(
      'INSERT INTO leads (name, email, phone, source, status, score, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Test Lead', 'test@example.com', '1234567890', 'Web Form', 'New', 'Hot', userId]
    );
    const leadId = leadResult.insertId;
    console.log(`Test lead created with ID: ${leadId}`);

    // 3. Create a test activity
    await dbPromise.query(
      'INSERT INTO lead_activities (lead_id, user_id, type, content) VALUES (?, ?, ?, ?)',
      [leadId, userId, 'Note', 'Initial verification contact']
    );
    console.log('Test activity created.');

    // 4. Create a test reminder
    await dbPromise.query(
      'INSERT INTO lead_reminders (lead_id, user_id, reminder_date, message) VALUES (?, ?, ?, ?)',
      [leadId, userId, new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' '), 'Follow up tomorrow']
    );
    console.log('Test reminder created.');

    // 5. Verify data retrieval
    const [leads] = await dbPromise.query('SELECT * FROM leads WHERE id = ?', [leadId]);
    console.log('Lead Retrieval:', leads.length > 0 ? 'SUCCESS' : 'FAILED');

    const [activities] = await dbPromise.query('SELECT * FROM lead_activities WHERE lead_id = ?', [leadId]);
    console.log('Activity Retrieval:', activities.length > 0 ? 'SUCCESS' : 'FAILED');

    const [reminders] = await dbPromise.query('SELECT * FROM lead_reminders WHERE lead_id = ?', [leadId]);
    console.log('Reminder Retrieval:', reminders.length > 0 ? 'SUCCESS' : 'FAILED');

    console.log('Verification completed successfully.');

    // Cleanup
    await dbPromise.query('DELETE FROM leads WHERE id = ?', [leadId]);
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    db.end();
  }
}

verifyLeads();
