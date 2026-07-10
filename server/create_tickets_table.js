const db = require('./config/db');

const createTicketsTable = async () => {
  try {
    const query = `
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                assigned_to INT DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `; // Removed foreign keys for now to simplify creation if tables don't exist yet, or can add them later. But best to add them if users table exists.
    // Re-adding Foreign Keys assuming users table exists as this is an addition to existing system.
    const queryWithFK = `
            CREATE TABLE IF NOT EXISTS tickets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                assigned_to INT DEFAULT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
                status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
            )
        `;

    await db.promise().query(queryWithFK);
    console.log('Tickets table created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tickets table:', err);
    process.exit(1);
  }
};

createTicketsTable();
