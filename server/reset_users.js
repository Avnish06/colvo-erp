const db = require('./config/db');
const bcrypt = require('bcryptjs');

const resetPasswords = async () => {
  try {
    const emails = ['abhi@gmail.com', 'vishu@gmail.com', 'aalu@gmail.com'];
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    for (const email of emails) {
      const [result] = await db.promise().query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      if (result.affectedRows > 0) {
        console.log(`Password reset for ${email}`);
      } else {
        console.log(`User ${email} not found`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

resetPasswords();
