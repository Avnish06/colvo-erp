const db = require('./config/db');
const q1 = "CREATE TABLE IF NOT EXISTS proposals (id INT AUTO_INCREMENT PRIMARY KEY, client_name VARCHAR(255), project_name VARCHAR(255), value DECIMAL(15,2), status VARCHAR(50) DEFAULT 'Draft', admin_approved BOOLEAN DEFAULT FALSE, created_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
const q2 = "CREATE TABLE IF NOT EXISTS contracts (id INT AUTO_INCREMENT PRIMARY KEY, proposal_id INT, client_name VARCHAR(255), document_content TEXT, status VARCHAR(50) DEFAULT 'Pending Signatures', admin_signed BOOLEAN DEFAULT FALSE, client_signed BOOLEAN DEFAULT FALSE, created_by INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";

db.query(q1, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  db.query(q2, (err2) => {
    if (err2) {
      console.error(err2);
      process.exit(1);
    }
    console.log('Tables created successfully');
    process.exit(0);
  });
});
