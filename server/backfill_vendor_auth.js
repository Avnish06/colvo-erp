const mysql = require('mysql2/promise');
require('dotenv').config();

async function backfillVendors() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Backfilling vendors password from user_identities...');
    const [result] = await connection.execute(`
      UPDATE vendors v
      JOIN user_identities ui ON v.user_id = ui.id
      SET v.password = ui.password
      WHERE v.password IS NULL OR v.password = ''
    `);
    console.log(`Updated ${result.affectedRows} vendors.`);

    const [check] = await connection.execute('SELECT email, password FROM vendors');
    console.table(check);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

backfillVendors();
