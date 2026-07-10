const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const hash = await bcrypt.hash('password123', 10);
  const email = 'aditya@gmail.com';

  db.query('UPDATE user_identities SET password = ? WHERE email = ?', [hash, email], (err) => {
    if (err) throw err;
    db.query('UPDATE admins SET password = ? WHERE email = ?', [hash, email], (err2) => {
      if (err2) throw err2;
      console.log('Successfully reset password to password123 with hash:', hash);
      process.exit(0);
    });
  });
}

resetAdminPassword();
