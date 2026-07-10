const db = require('./config/db');

db.query("SELECT name, status, role_id FROM users WHERE email = 'vendor@test.com'", (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Results:', rows);
  process.exit(0);
});
