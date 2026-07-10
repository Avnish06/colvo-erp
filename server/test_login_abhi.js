const db = require('./config/db');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
  const email = 'abhi@gmail.com';
  const password = 'password123';
  
  const query = `
        SELECT users.*, roles.name as role
        FROM users 
        JOIN roles ON users.role_id = roles.id
        WHERE users.email = ?
    `;

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.log('Error:', err);
      process.exit();
    }
    
    if (results.length === 0) {
      console.log('User not found in users join roles');
      process.exit();
    }

    const user = results[0];
    console.log('Found user:', user.email, 'Status:', user.status, 'Role:', user.role);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    // Check user_identities
    db.query('SELECT * FROM user_identities WHERE email = ?', [email], (err, idResults) => {
      console.log('User identities found:', idResults.length);
      process.exit();
    });
  });
};

testLogin();
