const db = require('./config/db');

db.query("UPDATE users SET status = 'Pending' WHERE status = '' OR status IS NULL", (err, r) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Updated rows:', r.affectedRows);
  process.exit(0);
});
