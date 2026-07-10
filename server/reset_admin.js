const db = require('./config/db');
const bcrypt = require('bcryptjs');

const checkUser = async () => {
  try {
    const email = 'admin@example.com';
    const newPassword = 'admin123';

    // 1. Check if user exists
    const [users] = await db.promise.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      console.log('User not found! Creating Super Admin...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.promise.query(
        'INSERT INTO users (name, email, password, role_id, department_id) VALUES (?, ?, ?, ?, ?)',
        ['Super Admin', email, hashedPassword, 1, 1]
      );
      console.log('Super Admin created successfully.');
    } else {
      console.log('User found. Resetting password...');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.promise.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
      console.log('Password reset successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkUser();
