const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

const testQueries = async () => {
  const promiseDb = db.promise();
  try {
    console.log('--- TESTING QUERIES ---');

    console.log('\n1. Testing Employees Query:');
    const [emp] = await promiseDb.query(`
      SELECT users.id, users.name, users.email, roles.name as role, departments.name as department 
      FROM users 
      LEFT JOIN roles ON users.role_id = roles.id 
      LEFT JOIN departments ON users.department_id = departments.id 
      LIMIT 1
    `);
    console.log('Result:', emp.length > 0 ? 'Success' : 'Empty Table');

    console.log('\n2. Testing Notifications Query:');
    const [notif] = await promiseDb.query('SELECT * FROM notifications LIMIT 1');
    console.log('Result:', notif.length > 0 ? 'Success' : 'Empty Table');

    console.log('\n3. Testing Dashboard Stats:');
    const statsQueries = [
      "SELECT COUNT(*) as count FROM users",
      "SELECT COUNT(*) as count FROM roles",
      "SELECT COUNT(*) as count FROM departments",
      "SELECT COUNT(*) as count FROM leave_requests",
      "SELECT COUNT(*) as count FROM projects",
      "SELECT COUNT(*) as count FROM payroll"
    ];
    for (const q of statsQueries) {
      try {
        await promiseDb.query(q);
        console.log(`Query [${q.substring(0, 30)}...] : OK`);
      } catch (e) {
        console.error(`Query [${q.substring(0, 30)}...] : FAILED - ${e.message}`);
      }
    }

    console.log('\n4. Testing Permissions/Role Join:');
    try {
      await promiseDb.query(`
        SELECT p.slug 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN users u ON u.role_id = rp.role_id
        LIMIT 1
      `);
      console.log('RBAC Join: OK');
    } catch (e) {
      console.error('RBAC Join: FAILED -', e.message);
    }

    console.log('\n--- DIAGNOSTICS COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during diagnostics:', err.message);
    process.exit(1);
  }
};

testQueries();
