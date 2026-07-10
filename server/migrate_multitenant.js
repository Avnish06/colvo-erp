const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'management_system'
  });

  try {
    const [tables] = await conn.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      
      // Skip core roles and permissions tables
      if (['roles', 'permissions', 'role_permissions', 'system_settings'].includes(tableName)) continue;
      
      const [cols] = await conn.query('SHOW COLUMNS FROM ' + tableName);
      const hasCompany = cols.some(c => c.Field === 'company_name');
      
      if (!hasCompany) {
        // If it has 'company' instead of 'company_name', rename it? No, wait, earlier I checked and only a few had 'company_name'.
        // Let's just try to add company_name.
        try {
          console.log(`Adding company_name to ${tableName}...`);
          await conn.query(`ALTER TABLE ${tableName} ADD COLUMN company_name VARCHAR(255) DEFAULT 'Colvo Corporation'`);
        } catch (err) {
          if (err.code !== 'ER_DUP_FIELDNAME') {
            console.error(`Error adding to ${tableName}:`, err.message);
          }
        }
      }
    }
    console.log('Migration complete: added company_name to all transactional tables.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await conn.end();
  }
}

migrate();
