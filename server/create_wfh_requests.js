const db = require('./config/db');

const createWFHRequestsTable = async () => {
  const query = `
        CREATE TABLE IF NOT EXISTS wfh_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            date DATE NOT NULL,
            reason TEXT,
            status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
            reviewed_by INT,
            reviewed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

  try {
    await db.promise().query(query);
    console.log('wfh_requests table created or already exists.');

    // Add a check to ensure date column exists and is correct
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating wfh_requests table:', err);
    process.exit(1);
  }
};

createWFHRequestsTable();
