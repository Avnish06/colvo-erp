const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'management_system' });

db.connect(err => {
  if (err) { console.error('DB Error:', err.message); process.exit(1); }

  bcrypt.hash('developer123', 10, (err, hash) => {
    if (err) { console.error('Hash error:', err.message); process.exit(1); }

    db.query(
      "UPDATE user_identities SET password = ? WHERE email = 'developer@system.local'",
      [hash],
      (err, result) => {
        if (err) console.error('Update error:', err.message);
        else console.log('Password reset successfully. Rows affected:', result.affectedRows);
        db.end();
      }
    );
  });
});
