const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1);
  }

  const query = `
    SELECT ui.id, ui.email, ui.role_id 
    FROM user_identities ui
    LEFT JOIN superadmins sa ON ui.id = sa.user_id
    LEFT JOIN admins ad ON ui.id = ad.user_id
    LEFT JOIN employees em ON ui.id = em.user_id
    LEFT JOIN developers dev ON ui.id = dev.user_id
    LEFT JOIN vendors v ON ui.id = v.user_id
    WHERE sa.user_id IS NULL AND ad.user_id IS NULL AND em.user_id IS NULL AND dev.user_id IS NULL AND v.user_id IS NULL
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error identifying orphan users:', err.message);
      process.exit(1);
    }
    console.log('--- ORPHAN USERS (Missing Profile) ---');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  });
});
