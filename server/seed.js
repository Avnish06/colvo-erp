const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Get Super Admin role ID
  db.query('SELECT id FROM roles WHERE name = "Super Admin"', (err, results) => {
    if (err || results.length === 0) {
      console.error('Error finding role or role not found');
      return;
    }

    const roleId = results[0].id;

    // Check if admin already exists
    db.query('SELECT * FROM users WHERE email = "admin@example.com"', (err, users) => {
      if (users.length === 0) {
        db.query(
          'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
          ['Super Admin', 'admin@example.com', hashedPassword, roleId],
          (err) => {
            if (err) console.error('Error seeding admin:', err);
            else console.log('Super Admin seeded successfully!');
          }
        );
      } else {
        console.log('Admin already exists.');
      }
    });
  });
};

seedAdmin();
