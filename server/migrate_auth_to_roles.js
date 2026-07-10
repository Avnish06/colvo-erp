const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateAuthData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Starting authentication data migration...');

    // 1. Add email and password columns if they don't exist
    const tables = ['superadmins', 'developers', 'admins', 'employees'];

    for (const table of tables) {
      console.log(`Checking columns for ${table}...`);
      const [columns] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
      const columnNames = columns.map(c => c.Field);

      let alterQuery = '';
      if (!columnNames.includes('email')) {
        alterQuery += `ADD COLUMN email VARCHAR(255), `;
      }
      if (!columnNames.includes('password')) {
        alterQuery += `ADD COLUMN password VARCHAR(255), `;
      }

      if (alterQuery) {
        alterQuery = alterQuery.slice(0, -2); // Remove trailing comma and space
        console.log(`Altering table ${table} to add missing columns...`);
        await connection.execute(`ALTER TABLE ${table} ${alterQuery}`);
      } else {
        console.log(`Columns already exist in ${table}.`);
      }
    }

    // 2. Backfill data from user_identities
    console.log('\nBackfilling data from user_identities...');
    for (const table of tables) {
      console.log(`Updating ${table}...`);
      await connection.execute(`
        UPDATE ${table} t
        JOIN user_identities ui ON t.user_id = ui.id
        SET t.email = ui.email, t.password = ui.password
      `);
      console.log(`Data backed up for ${table}.`);
    }

    // 3. Update the users view to fetch from role tables
    console.log('\nUpdating the users view...');
    await connection.execute(`
      CREATE OR REPLACE VIEW users AS
      SELECT 
        ui.id,
        COALESCE(sa.email, ad.email, em.email, dev.email, v.email, ui.email) as email,
        COALESCE(sa.password, ad.password, em.password, dev.password, v.password, ui.password) as password,
        ui.role_id,
        ui.created_at as joined_at,
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

    console.log('\nMigration completed successfully!');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrateAuthData();
