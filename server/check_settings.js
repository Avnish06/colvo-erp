const db = require('./config/db');
db.query('SELECT * FROM system_settings', (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('--- SYSTEM SETTINGS ---');
  results.forEach(row => {
    console.log(`${row.setting_key}: ${row.setting_value}`);
  });
  console.log('-----------------------');
  process.exit(0);
});
