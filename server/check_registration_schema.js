const db = require('./config/db');

db.query('DESC employees', (err, results) => {
  if (err) {
    console.error('Error describing employees table:', err);
  } else {
    console.log('Employees table schema:');
    console.table(results);
  }

  db.query('DESC user_identities', (err, results) => {
    if (err) {
      console.error('Error describing user_identities table:', err);
    } else {
      console.log('user_identities table schema:');
      console.table(results);
    }
    process.exit();
  });
});
