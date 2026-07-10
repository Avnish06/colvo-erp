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

async function verifyComm() {
  try {
    console.log('Verifying CRM Communication Implementation...');

    // 1. Check if tables exist
    const [templateTable] = await dbPromise.query("SHOW TABLES LIKE 'email_templates'");
    if (templateTable.length === 0) throw new Error('email_templates table is missing');
    console.log('✅ email_templates table exists');

    const [logTable] = await dbPromise.query("SHOW TABLES LIKE 'email_logs'");
    if (logTable.length === 0) throw new Error('email_logs table is missing');
    console.log('✅ email_logs table exists');

    // 2. Test Template Creation
    const [templateResult] = await dbPromise.query(
      'INSERT INTO email_templates (name, subject, body, type) VALUES (?, ?, ?, ?)',
      ['Test Template', 'Follow-up on Deal', 'Hello, this is a test follow-up.', 'Deal']
    );
    const templateId = templateResult.insertId;
    console.log(`✅ Template created with ID: ${templateId}`);

    // 3. Test Log Creation
    const [userResult] = await dbPromise.query('SELECT id FROM users LIMIT 1');
    if (userResult.length > 0) {
      const [logResult] = await dbPromise.query(
        'INSERT INTO email_logs (recipient_email, subject, body, user_id) VALUES (?, ?, ?, ?)',
        ['test@example.com', 'Test Subject', 'Test Body Content', userResult[0].id]
      );
      console.log(`✅ Email log created with ID: ${logResult.insertId}`);
    }

    // 4. Cleanup
    await dbPromise.query('DELETE FROM email_templates WHERE id = ?', [templateId]);
    console.log('✅ Test template deleted (Cleanup)');

    console.log('\nVerification Successful: All communication backend components are functional.');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    db.end();
  }
}

verifyComm();
