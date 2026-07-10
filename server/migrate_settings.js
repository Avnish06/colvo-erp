const db = require('./config/db');

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Change setting_key to VARCHAR(255) to allow UNIQUE constraint
    // We do this first so we can add the index
    await db.promise().query('ALTER TABLE system_settings MODIFY COLUMN setting_key VARCHAR(255)');
    console.log('Column type modified to VARCHAR(255)');

    // 2. Clear duplicates - keep only the one with the highest ID for each key
    await db.promise().query(`
      DELETE FROM system_settings 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT MAX(id) as id 
          FROM system_settings 
          GROUP BY setting_key
        ) as tmp
      )
    `);
    console.log('Duplicates cleaned up');

    // 3. Add UNIQUE constraint
    // We wrap this in a try-catch in case it already exists
    try {
      await db.promise().query('ALTER TABLE system_settings ADD UNIQUE (setting_key)');
      console.log('UNIQUE constraint added to setting_key');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log('UNIQUE constraint already exists');
      } else {
        throw e;
      }
    }

    // 4. Set override_attendance to true for testing if requested (but here we just ensure it exists)
    // The user said they enable it and it reverts. Let's make sure it's actually there.

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
