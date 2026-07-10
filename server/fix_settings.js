const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

const run = async () => {
  try {
    const promiseDb = db.promise();
    await promiseDb.query('CREATE TABLE IF NOT EXISTS system_settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(255) UNIQUE, setting_value TEXT)');
    console.log('system_settings table created');

    await promiseDb.query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('company_name', 'ERP-CRM Pro'), ('company_email', 'admin@erp-crm.com') ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)");
    console.log('Initial settings seeded');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
