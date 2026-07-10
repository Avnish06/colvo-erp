const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createDummyAdmin() {
  const email = 'dummyadmin2@gmail.com';
  const password = 'dummyPassword123!';
  const name = 'Dummy Admin 2';
  const employeeId = 'DUMMY002';

  try {
    const hash = await bcrypt.hash(password, 10);
    
    // 1. Insert into user_identities
    db.query('INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, 1)', [email, hash], (err, result) => {
      if (err) {
        console.error('Error creating user identity:', err);
        process.exit(1);
      }
      
      const userId = result.insertId;
      
      // 2. Insert into admins
      db.query('INSERT INTO admins (user_id, name, employee_id, status) VALUES (?, ?, ?, ?)', 
        [userId, name, employeeId, 'Active'], (err2) => {
        if (err2) {
          console.error('Error creating admin profile:', err2);
          process.exit(1);
        }
        
        console.log('Successfully created a new dummy admin!');
        console.log('Email:', email);
        console.log('Password:', password);
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    process.exit(1);
  }
}

createDummyAdmin();
