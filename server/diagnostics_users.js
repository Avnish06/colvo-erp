const db = require('./config/db');
const fs = require('fs');

db.query('SELECT id, email, role_id, status FROM users', (err, results) => {
  if (err) { console.error(err); process.exit(1); }
  const output = results.map(u => `${u.id}|${u.email}|${u.role_id}|"${u.status}"`).join('\n');
  fs.writeFileSync(__dirname + '/users_dump.txt', output);
  console.log('Written to users_dump.txt');
  process.exit(0);
});
