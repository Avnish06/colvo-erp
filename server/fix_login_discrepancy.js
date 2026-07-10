const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function fixLoginDiscrepancy() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Starting credentials synchronization...');

    const tables = ['superadmins', 'developers', 'admins', 'employees'];

    // 1. Sync data from user_identities to role tables to be safe
    for (const table of tables) {
      console.log(`Syncing ${table}...`);
      await connection.execute(`
        UPDATE ${table} t
        JOIN user_identities ui ON t.user_id = ui.id
        SET t.email = ui.email, t.password = ui.password
      `);
    }

    // 2. Drop existing users table if it exists as a base table
    console.log('\nDropping existing users table (if any)...');
    await connection.execute('DROP TABLE IF EXISTS users');

    // 3. Update the users view to PRIORITIZE user_identities for email and password
    // This makes login robust to discrepancies because auth.js queries based on user_identities values
    console.log('\nCreating the users view to prioritize user_identities...');
    await connection.execute(`
      CREATE OR REPLACE VIEW users AS
      SELECT 
        ui.id,
        ui.email as email,
        ui.password as password,
        ui.role_id,
        ui.created_at as joined_at,
        ui.profile_image,
        COALESCE(sa.name, ad.name, em.name, dev.name, CONCAT(v.first_name, ' ', v.last_name)) as name,
        COALESCE(sa.employee_id, ad.employee_id, em.employee_id, dev.employee_id, v.vendor_id) as employee_id,
        v.vendor_id as vendor_id,
        COALESCE(sa.status, ad.status, em.status, dev.status, v.status) as status,
        em.department_id as department_id,
        COALESCE(sa.phone, v.phone) as phone,
        COALESCE(sa.company_name, v.company_name) as company_name
      FROM user_identities ui
      LEFT JOIN superadmins sa ON ui.id = sa.user_id
      LEFT JOIN admins ad ON ui.id = ad.user_id
      LEFT JOIN employees em ON ui.id = em.user_id
      LEFT JOIN developers dev ON ui.id = dev.user_id
      LEFT JOIN vendors v ON ui.id = v.user_id
    `);

    console.log('View users updated successfully.');
    console.log('\nFix completed successfully!');

  } catch (err) {
    console.error('Fix failed:', err);
  } finally {
    await connection.end();
  }
}

fixLoginDiscrepancy();
