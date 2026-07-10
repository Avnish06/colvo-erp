const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function listUsers() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management_system'
  });

  try {
    const [rows] = await connection.query(`
      SELECT u.id, u.name, u.role_id, d.name as department
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
    `);
    console.log(JSON.stringify(rows));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

listUsers();
