const db = require('./config/db');

const migrate = async () => {
  try {
    console.log('Starting migration for salary_structures...');

    await db.promise().query(`
            CREATE TABLE IF NOT EXISTS salary_structures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNIQUE NOT NULL,
                basic_salary DECIMAL(15, 2) DEFAULT 0,
                hra DECIMAL(15, 2) DEFAULT 0,
                da DECIMAL(15, 2) DEFAULT 0,
                bonus DECIMAL(15, 2) DEFAULT 0,
                deductions DECIMAL(15, 2) DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
    console.log('salary_structures table created/verified.');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
