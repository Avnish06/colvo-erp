const db = require('./config/db');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS employee_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  doc_type ENUM('Aadhar Card', 'PAN Card', 'Driving License') NOT NULL,
  doc_url LONGTEXT NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_identities(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_doc (user_id, doc_type)
);
`;

db.query(createTableQuery, (err, results) => {
  if (err) {
    console.error('Error creating employee_documents table:', err);
    process.exit(1);
  }
  console.log('employee_documents table created or already exists');
  process.exit(0);
});
