const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

const dbPromise = db.promise();

async function migrate() {
  try {
    console.log('Expanding CRM Communication tables (Calls & Messages)...');

    // 1. Call Logs Table
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT NOT NULL,
        contact_type ENUM('Lead', 'Customer') NOT NULL,
        duration VARCHAR(50),
        notes TEXT,
        user_id INT,
        called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Call Logs table created.');

    // 2. Call Reminders Table
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS call_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT NOT NULL,
        contact_type ENUM('Lead', 'Customer') NOT NULL,
        remind_at DATETIME NOT NULL,
        notes TEXT,
        status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Call Reminders table created.');

    // 3. Message Logs Table (WhatsApp / SMS)
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient VARCHAR(255) NOT NULL,
        platform ENUM('WhatsApp', 'SMS') NOT NULL,
        message TEXT NOT NULL,
        status ENUM('Sent', 'Failed') DEFAULT 'Sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Message Logs table created.');

    console.log('Expansion migration completed successfully.');
  } catch (err) {
    console.error('Expansion migration failed:', err);
  } finally {
    db.end();
  }
}

migrate();
