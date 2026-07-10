const mysql = require('mysql2/promise');
const fs = require('fs');

async function run() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'management_system'
  });

  const [reminders] = await db.query('SELECT r.*, l.name as lead_name, u.name as user_name FROM lead_reminders r JOIN leads l ON r.lead_id = l.id JOIN users u ON r.user_id = u.id');
  const [users] = await db.query('SELECT u.id, u.name, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');

  const report = {
    timestamp: new Date().toISOString(),
    reminders,
    users
  };

  fs.writeFileSync('db_report.json', JSON.stringify(report, null, 2));
  console.log('Report written to db_report.json');
  await db.end();
}
run();
