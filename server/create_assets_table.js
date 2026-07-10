const db = require('./config/db');

const sql = `
  CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Available',
    assignee_name VARCHAR(255) DEFAULT NULL,
    user_id INT DEFAULT NULL,
    purchase_date DATE DEFAULT NULL,
    value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_identities(id) ON DELETE SET NULL
  )
`;

db.query(sql, (err, result) => {
  if (err) {
    console.error('Error creating assets table:', err);
    process.exit(1);
  }
  console.log('Assets Table created or exists:', result);
  process.exit(0);
});
