const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'management_system'
});

db.connect();

async function run() {
  const [reminders] = await db.promise().query('SELECT * FROM lead_reminders');
  console.log('--- ALL REMINDERS ---');
  console.table(reminders);

  const [users] = await db.promise().query('SELECT users.id, users.name, roles.name as role FROM users JOIN roles ON users.role_id = roles.id');
  console.log('--- ALL USERS ---');
  console.table(users);

  db.end();
}

run().catch(console.error);
