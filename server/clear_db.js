const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function clearDB() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'management_system'
  });

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all BASE tables (ignore views like `users`)
    const [tables] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      
      // Do not truncate roles, permissions, or role_permissions so the system retains its structure
      if (!['roles', 'permissions', 'role_permissions', 'departments', 'system_settings'].includes(tableName)) {
        console.log(`Truncating ${tableName}...`);
        await conn.query(`TRUNCATE TABLE ${tableName}`);
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('All transactional and user data cleared.');

    const salt = await bcrypt.genSalt(10);

    // 1. Insert Super Admin
    const superAdminPassword = await bcrypt.hash('superadmin123', salt);
    const [saRes] = await conn.query(
      'INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, ?)',
      ['superadmin@example.com', superAdminPassword, 1]
    );
    await conn.query(
      'INSERT INTO superadmins (user_id, name, employee_id, status) VALUES (?, ?, ?, ?)',
      [saRes.insertId, 'Super Admin User', 'SA-001', 'Active']
    );

    // 2. Insert Admin
    const adminPassword = await bcrypt.hash('admin123', salt);
    const [adRes] = await conn.query(
      'INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, ?)',
      ['admin@example.com', adminPassword, 2]
    );
    await conn.query(
      'INSERT INTO admins (user_id, name, employee_id, status) VALUES (?, ?, ?, ?)',
      [adRes.insertId, 'Admin User', 'AD-001', 'Active']
    );

    console.log('Inserted new Super Admin (superadmin@example.com / superadmin123)');
    console.log('Inserted new Admin (admin@example.com / admin123)');

  } catch (err) {
    console.error('Error clearing DB:', err);
  } finally {
    await conn.end();
  }
}

clearDB();
