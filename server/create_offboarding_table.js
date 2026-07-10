const db = require('./config/db');

const sql = `
  CREATE TABLE IF NOT EXISTS offboarding_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    step_1_resignation BOOLEAN DEFAULT false,
    step_2_assets BOOLEAN DEFAULT false,
    step_3_revoke BOOLEAN DEFAULT false,
    step_4_settlement BOOLEAN DEFAULT false,
    step_5_certificates BOOLEAN DEFAULT false,
    overall_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_identities(id) ON DELETE CASCADE
  )
`;

db.query(sql, (err, result) => {
  if (err) {
    console.error('Error creating offboarding table:', err);
    process.exit(1);
  }
  console.log('Offboarding Table created or exists:', result);
  process.exit(0);
});
