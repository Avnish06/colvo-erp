const db = require('./config/db');

const queries = [
  'ALTER TABLE customers ADD COLUMN health_score INT DEFAULT 100;',
  'ALTER TABLE customers ADD COLUMN renewal_date DATE;',
  'ALTER TABLE customers ADD COLUMN portal_access_enabled BOOLEAN DEFAULT FALSE;',
  'ALTER TABLE customers ADD COLUMN password VARCHAR(255);',
  'ALTER TABLE proposals ADD COLUMN details TEXT;',
  'ALTER TABLE proposals ADD COLUMN client_approved BOOLEAN DEFAULT FALSE;',
  'ALTER TABLE contracts ADD COLUMN client_signature LONGTEXT;',
  'ALTER TABLE contracts ADD COLUMN admin_signature LONGTEXT;',
  "ALTER TABLE contracts ADD COLUMN status VARCHAR(50) DEFAULT 'Pending';"
];

let completed = 0;
for (const q of queries) {
  db.query(q, (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
      console.log('Error executing query:', q, err.message);
    }
    completed++;
    if (completed === queries.length) {
      console.log('Done altering tables.');
      process.exit(0);
    }
  });
}
