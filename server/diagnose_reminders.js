const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'management_system'
});

db.connect();

db.query('SELECT * FROM lead_reminders', (err, results) => {
  if (err) console.error(err);
  else console.log('All Reminders:', JSON.stringify(results, null, 2));

  db.query('SELECT users.id, users.name, roles.name as role FROM users JOIN roles ON users.role_id = roles.id', (err, users) => {
    if (err) console.error(err);
    else console.log('Users:', JSON.stringify(users, null, 2));
    db.end();
  });
});
