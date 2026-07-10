const db = require('./config/db');

db.query("SELECT * FROM users WHERE email = 'vendor@test.com'", (err, rows) => {
  if (err) {
    console.error('Error querying users view:', err);
    process.exit(1);
  }
  if (rows.length === 0) {
    console.log('No user found with email vendor@test.com');
  } else {
    console.log(JSON.stringify(rows[0], null, 2));
  }
  process.exit(0);
});
