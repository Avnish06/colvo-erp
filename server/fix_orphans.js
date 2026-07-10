const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function fixOrphans() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management_system',
    multipleStatements: true
  });

  try {
    console.log('Starting orphan user fix...');

    // 1. Correct superadmin@example.com role to 1 (Super Admin)
    console.log('Correcting superadmin@example.com role...');
    await connection.execute('UPDATE user_identities SET role_id = 1 WHERE email = "superadmin@example.com"');

    // 2. Identify all orphans again
    const [orphans] = await connection.execute(`
      SELECT ui.id, ui.email, ui.role_id, ui.password
      FROM user_identities ui
      LEFT JOIN superadmins sa ON ui.id = sa.user_id
      LEFT JOIN admins ad ON ui.id = ad.user_id
      LEFT JOIN employees em ON ui.id = em.user_id
      LEFT JOIN developers dev ON ui.id = dev.user_id
      LEFT JOIN vendors v ON ui.id = v.user_id
      WHERE sa.user_id IS NULL AND ad.user_id IS NULL AND em.user_id IS NULL AND dev.user_id IS NULL AND v.user_id IS NULL
    `);

    console.log(`Found ${orphans.length} orphan users.`);

    for (const orphan of orphans) {
      console.log(`Fixing orphan: ${orphan.email} (Role ID: ${orphan.role_id})`);
      
      let table = '';
      let insertQuery = '';
      let values = [];

      // Determine the correct profile table
      switch (orphan.role_id) {
        case 1:
          table = 'superadmins';
          insertQuery = 'INSERT INTO superadmins (user_id, name, employee_id, status, email, password) VALUES (?, ?, ?, ?, ?, ?)';
          values = [orphan.id, orphan.email.split('@')[0], 'SA-AUTO-' + orphan.id, 'Active', orphan.email, orphan.password];
          break;
        case 2:
          table = 'admins';
          insertQuery = 'INSERT INTO admins (user_id, name, employee_id, status, email, password) VALUES (?, ?, ?, ?, ?, ?)';
          values = [orphan.id, orphan.email.split('@')[0], 'AD-AUTO-' + orphan.id, 'Active', orphan.email, orphan.password];
          break;
        case 3:
        case 4: // Assuming other employee roles use employees table
          table = 'employees';
          insertQuery = 'INSERT INTO employees (user_id, name, employee_id, status, email, password) VALUES (?, ?, ?, ?, ?, ?)';
          values = [orphan.id, orphan.email.split('@')[0], 'EM-AUTO-' + orphan.id, 'Active', orphan.email, orphan.password];
          break;
        case 5:
          table = 'developers';
          // Developers table might have different schema, let's assume it follows the same for name/status
          insertQuery = 'INSERT INTO developers (user_id, name, status, email, password) VALUES (?, ?, ?, ?, ?)';
          values = [orphan.id, orphan.email.split('@')[0], 'Active', orphan.email, orphan.password];
          break;
        case 6:
          table = 'vendors';
          insertQuery = 'INSERT INTO vendors (first_name, last_name, user_id, vendor_id, status, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)';
          values = [orphan.email.split('@')[0], 'Auto', orphan.id, 'VN-AUTO-' + orphan.id, 'Active', orphan.email, orphan.password];
          break;
        default:
          console.log(`Skipping orphan ${orphan.email} with unknown role_id ${orphan.role_id}`);
          continue;
      }

      if (table) {
        try {
          await connection.execute(insertQuery, values);
          console.log(`Successfully restored profile in ${table} for ${orphan.email}`);
        } catch (err) {
          console.error(`Failed to restore profile for ${orphan.email} in ${table}:`, err.message);
        }
      }
    }

    console.log('Orphan fix completed.');

  } catch (err) {
    console.error('Fix failed:', err);
  } finally {
    await connection.end();
  }
}

fixOrphans();
