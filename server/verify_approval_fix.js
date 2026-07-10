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

async function verify() {
  try {
    console.log('--- Verifying Two-Tier Approval Workflow ---');

    // 1. Create a dummy user in 'Pending' state (Role 4: Employee CRM)
    const uniqueEmail = `crm_${Date.now()}@test.com`;
    const uniqueEmpId = `CRM-${Math.floor(Math.random() * 100000)}`;
    const [userResult] = await dbPromise.query(
      "INSERT INTO users (name, email, password, role_id, employee_id, status) VALUES (?, ?, ?, ?, ?, ?)",
      ['Test CRM User', uniqueEmail, 'hashed_pass', 4, uniqueEmpId, 'Pending']
    );
    const userId = userResult.insertId;
    console.log('Created test user with ID:', userId);

    // 2. Simulate Admin Approval (Status should move to 'Pending Super Admin')
    console.log('Simulating Admin Approval...');
    const [adminApproveResult] = await dbPromise.query(
      "UPDATE users SET status = 'Pending Super Admin' WHERE id = ?",
      [userId]
    );

    const [step1User] = await dbPromise.query("SELECT status FROM users WHERE id = ?", [userId]);
    console.log('Step 1 Status:', step1User[0].status);
    if (step1User[0].status !== 'Pending Super Admin') throw new Error('Admin approval failed');

    // 3. Simulate Super Admin Approval (Status should move to 'Active')
    console.log('Simulating Super Admin Approval...');
    await dbPromise.query("UPDATE users SET status = 'Active' WHERE id = ?", [userId]);

    const [step2User] = await dbPromise.query("SELECT status FROM users WHERE id = ?", [userId]);
    console.log('Step 2 Status:', step2User[0].status);
    if (step2User[0].status !== 'Active') throw new Error('Super Admin approval failed');

    console.log('\nSUCCESS: Two-tier approval workflow verified successfully!');

    // Cleanup
    await dbPromise.query("DELETE FROM users WHERE id = ?", [userId]);
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Verification failed:', err.message);
  } finally {
    db.end();
  }
}

verify();
