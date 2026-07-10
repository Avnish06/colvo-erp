const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function runTests() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Testing Authentication View...');

    // 1. Check if users view returns email and password
    const [users] = await connection.execute('SELECT id, email, password, role_id FROM users LIMIT 1');
    if (users.length > 0) {
      const u = users[0];
      if (u.email && u.password) {
        console.log(`✅ Users view is successfully returning credentials for user ID ${u.id}`);
      } else {
        console.error('❌ Users view failed to return credentials');
      }
    } else {
      console.log('⚠️ No users found in database to test view.');
    }

    // 2. Check table schemas
    const tables = ['superadmins', 'developers', 'admins', 'employees', 'vendors'];
    let allGood = true;
    for (const table of tables) {
      const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
      const colNames = columns.map(c => c.Field);
      if (colNames.includes('email') && colNames.includes('password')) {
        // Good
      } else {
        console.error(`❌ Table ${table} is missing email or password`);
        allGood = false;
      }
    }

    if (allGood) console.log('✅ All role tables have email and password columns.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await connection.end();
  }
}

runTests();
