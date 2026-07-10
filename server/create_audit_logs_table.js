const db = require('./config/db');

const createAuditLogsTable = async () => {
  try {
    await db.promise().query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(255) NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
    console.log('Audit logs table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating audit logs table:', err);
    process.exit(1);
  }
};

createAuditLogsTable();
