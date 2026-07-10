const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management_system'
  });

  try {
    console.log('Adding assigned_to column to projects table...');
    await connection.query(`
      ALTER TABLE projects 
      ADD COLUMN assigned_to INT NULL,
      ADD CONSTRAINT fk_project_assignee FOREIGN KEY (assigned_to) REFERENCES user_identities(id) ON DELETE SET NULL
    `);
    console.log('Successfully added assigned_to column and foreign key constraint.');

  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column assigned_to already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await connection.end();
  }
}

migrate();
