const db = require('./config/db');

const queries = [
  `CREATE TABLE IF NOT EXISTS available_tools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tool_name VARCHAR(255) NOT NULL,
    tool_key VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Package',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE vendors MODIFY COLUMN company_name VARCHAR(255) NULL`,
  `ALTER TABLE vendors MODIFY COLUMN first_name VARCHAR(255) NULL`,
  `ALTER TABLE vendors MODIFY COLUMN last_name VARCHAR(255) NULL`
];

async function migrate() {
  for (const query of queries) {
    try {
      await new Promise((resolve, reject) => {
        db.query(query, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('Successfully executed:', query.substring(0, 50) + '...');
    } catch (err) {
      console.error('Error executing query:', err.message);
    }
  }
  process.exit(0);
}

migrate();
