const db = require('./config/db');

db.query("SELECT * FROM vendors WHERE email = 'vendor@test.com'", (err, rows) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('Vendor Data:', rows);
  process.exit(0);
});
