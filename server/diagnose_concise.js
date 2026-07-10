const mysql = require('mysql2/promise');
async function run() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'management_system'
  });

  const [reminders] = await db.query('SELECT id, lead_id, user_id, reminder_date, is_completed, message FROM lead_reminders');
  console.log('REMINDERS_DATA:' + JSON.stringify(reminders));

  const [users] = await db.query('SELECT u.id, u.name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');
  console.log('USERS_DATA:' + JSON.stringify(users));

  await db.end();
}
run();
