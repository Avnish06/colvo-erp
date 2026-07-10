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
    console.log('Creating CRM Communication tables...');

    // 1. Email Templates Table
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        type ENUM('Lead', 'Deal', 'General') DEFAULT 'General',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Email Templates table created.');

    // 2. Email Logs Table
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        status ENUM('Sent', 'Failed') DEFAULT 'Sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Email Logs table created.');

    // 3. Email Automation Table
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS email_automation (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trigger_event VARCHAR(255) NOT NULL,
        template_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE CASCADE
      )
    `);
    console.log('Email Automation table created.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.end();
  }
}

migrate();
