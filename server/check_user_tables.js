const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [tablesResult] = await connection.execute('SHOW TABLES');
  const tableNames = tablesResult.map(t => Object.values(t)[0]);
  let output = 'Tables: ' + tableNames.join(', ') + '\n';

  const targetPatterns = ['admin', 'developer', 'employee', 'vendor', 'user'];
  const relevantTables = tableNames.filter(name =>
    targetPatterns.some(p => name.toLowerCase().includes(p))
  );

  for (const table of relevantTables) {
    output += `\n### TABLE: ${table} ###\n`;
    try {
      const [rows] = await connection.execute(`DESCRIBE ${table}`);
      rows.forEach(row => {
        output += `- ${row.Field}: ${row.Type}\n`;
      });
    } catch (err) {
      output += `Error: ${err.message}\n`;
    }
  }

  // Also check 'users' view or table if exists
  if (tableNames.includes('users')) {
    output += `\n### TABLE/VIEW: users ###\n`;
    try {
      const [rows] = await connection.execute(`DESCRIBE users`);
      rows.forEach(row => {
        output += `- ${row.Field}: ${row.Type}\n`;
      });
    } catch (err) {
      output += `Error: ${err.message}\n`;
    }
  }

  fs.writeFileSync('schema_debug.txt', output, 'utf8');
  console.log('Schema written to schema_debug.txt');
  await connection.end();
}

checkSchema();
