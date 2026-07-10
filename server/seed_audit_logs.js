const db = require('./config/db');

const seedAuditLogs = async () => {
  try {
    const [users] = await db.promise().query('SELECT id FROM users LIMIT 1');
    const userId = users.length > 0 ? users[0].id : null;

    const sampleLogs = [
      [userId, 'LOGIN', 'Admin logged in from 192.168.1.1'],
      [userId, 'UPDATE_PROFILE', 'User updated their billing information'],
      [userId, 'CREATE_TASK', 'A new task was assigned to the development team']
    ];

    await db.promise().query('INSERT INTO audit_logs (user_id, action, details) VALUES ?', [sampleLogs]);
    console.log('Audit logs seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding audit logs:', err);
    process.exit(1);
  }
};

seedAuditLogs();
