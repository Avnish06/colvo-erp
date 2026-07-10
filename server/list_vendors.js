const db = require('./config/db');

db.query(`
  SELECT ui.email, ui.id, v.vendor_id, v.company_name, r.name as role
  FROM user_identities ui
  JOIN roles r ON ui.role_id = r.id
  LEFT JOIN vendors v ON ui.id = v.user_id
  WHERE r.name = 'Vendor'
`, (err, rows) => {
  if (err) {
    console.error('Error fetching vendors:', err);
    process.exit(1);
  }
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
});
