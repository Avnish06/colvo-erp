const db = require('./config/db').promise();

async function syncCredentials() {
  try {
    console.log('--- Database Synchronization ---');

    // 1. Add email and password columns to vendors if they don't exist
    console.log('Checking vendors table for email/password columns...');
    const [columns] = await db.query('DESCRIBE vendors');
    const columnNames = columns.map(c => c.Field);

    if (!columnNames.includes('email')) {
      console.log('Adding email column to vendors...');
      await db.query('ALTER TABLE vendors ADD COLUMN email VARCHAR(255) AFTER status');
    }
    if (!columnNames.includes('password')) {
      console.log('Adding password column to vendors...');
      await db.query('ALTER TABLE vendors ADD COLUMN password VARCHAR(255) AFTER email');
    }

    // 2. Sync all profile tables from user_identities
    const tables = ['employees', 'admins', 'superadmins', 'developers', 'vendors'];
    
    for (const table of tables) {
      console.log(`Syncing credentials for ${table}...`);
      
      // Use user_id for most tables, but check if it's 'id' for some (developers had id/user_id)
      // Reference: employees(user_id), admins(user_id), superadmins(user_id), developers(user_id), vendors(user_id)
      
      const updateQuery = `
        UPDATE ${table} t
        JOIN user_identities ui ON t.user_id = ui.id
        SET t.email = ui.email, t.password = ui.password
      `;
      
      const [result] = await db.query(updateQuery);
      console.log(`Successfully synced ${result.affectedRows} rows in ${table}.`);
    }

    console.log('\nAll profile credentials synchronized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

syncCredentials();
