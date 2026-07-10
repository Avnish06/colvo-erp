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
    console.log('Creating CRM Sales Pipeline tables...');

    // 1. Deals Table
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        value DECIMAL(15, 2) DEFAULT 0.00,
        probability INT DEFAULT 10,
        stage ENUM('Lead', 'Proposal', 'Negotiation', 'Won', 'Lost') DEFAULT 'Lead',
        lost_reason TEXT,
        expected_close_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `);
    console.log('Deals table created.');

    // 2. Deal Team Table (Junction)
    await dbPromise.query(`
      CREATE TABLE IF NOT EXISTS deal_team (
        deal_id INT NOT NULL,
        user_id INT NOT NULL,
        PRIMARY KEY (deal_id, user_id),
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Deal Team table created.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    db.end();
  }
}

migrate();
