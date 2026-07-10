const db = require('./config/db');
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'secret';

const createToken = (user) => jwt.sign(user, secret);

const testRole = async (name, id, role) => {
  console.log(`\n--- Testing Role: ${role} (User ID: ${id}) ---`);
  const token = createToken({ id, role });

  // Test dashboard stats
  console.log('Testing dashboard stats...');
  // (In a real test we'd hit the API, here we simulate the logic)
  const isEmployee = role === 'Employee CRM';
  const userId = id;

  const queries = {
    leads: isEmployee
      ? [`SELECT COUNT(*) as count FROM leads WHERE assigned_to = ?`, [userId]]
      : [`SELECT COUNT(*) as count FROM leads`, []],
  };

  return new Promise((resolve) => {
    const [sql, params] = queries.leads;
    db.query(sql, params, (err, results) => {
      if (err) console.error('Error:', err);
      else console.log(`Leads Count for ${role}:`, results[0].count);
      resolve();
    });
  });
};

const runTests = async () => {
  await testRole('Super Admin', 1, 'Super Admin');
  await testRole('CRM Employee', 10, 'Employee CRM'); // Assuming ID 10 is an employee
  process.exit();
};

runTests();
