const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management_system'
  });

  try {
    console.log('Seeding departmental performance data...');

    // 1. Get all departments
    const [depts] = await connection.query('SELECT * FROM departments');
    if (depts.length === 0) {
      console.log('No departments found. Creating default departments...');
      await connection.query('INSERT INTO departments (name) VALUES (?), (?), (?), (?)', ['IT', 'HR', 'Sales', 'Marketing']);
      const [newDepts] = await connection.query('SELECT * FROM departments');
      depts.push(...newDepts);
    }

    // 2. Ensure each department has at least one user (Employee)
    const [roles] = await connection.query('SELECT * FROM roles WHERE name IN ("Employee ERP", "Employee CRM")');
    const roleId = roles.length > 0 ? roles[0].id : 3;

    for (const dept of depts) {
      const [users] = await connection.query('SELECT * FROM users WHERE department_id = ?', [dept.id]);
      if (users.length === 0) {
        console.log(`Creating dummy user for department: ${dept.name}`);
        const email = `dummy_${dept.name.toLowerCase()}@system.local`;
        // Check if user identity already exists
        const [existing] = await connection.query('SELECT * FROM user_identities WHERE email = ?', [email]);
        let userId;
        if (existing.length === 0) {
          const [result] = await connection.query('INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, ?)', [email, 'password123', roleId]);
          userId = result.insertId;
          await connection.query('INSERT INTO employees (user_id, name, department_id, employee_id, status) VALUES (?, ?, ?, ?, ?)',
            [userId, `Dummy ${dept.name} User`, dept.id, `DUM-${dept.id}-${Math.floor(Math.random() * 1000)}`, 'Active']);
        } else {
          userId = existing[0].id;
        }
      }
    }

    // 3. Create at least one project if none exist
    let [projects] = await connection.query('SELECT * FROM projects');
    if (projects.length === 0) {
      console.log('Creating dummy project...');
      const [projResult] = await connection.query('INSERT INTO projects (name, description, deadline, status) VALUES (?, ?, ?, ?)',
        ['Global Performance Project', 'Project for tracking departmental task completion', '2026-12-31', 'Ongoing']);
      projects = [{ id: projResult.insertId }];
    }
    const projectId = projects[0].id;

    // 4. Seed tasks for each department user
    const [deptUsers] = await connection.query('SELECT id, department_id FROM users WHERE department_id IS NOT NULL');

    // Clear old dummy tasks for these users to avoid bloat (optional, but keep it clean)
    // await connection.query('DELETE FROM tasks WHERE project_id = ?', [projectId]);

    for (const user of deptUsers) {
      // Determine performance percentage based on dept or just random
      // Let's make it varied: 40-90%
      const numTasks = 10;
      const perfTarget = 0.4 + Math.random() * 0.5; // 40% to 90%
      const doneCount = Math.round(numTasks * perfTarget);

      console.log(`Seeding ${numTasks} tasks for user ${user.id} (Target Perf: ${Math.round(perfTarget * 100)}%)`);

      for (let i = 0; i < numTasks; i++) {
        const status = i < doneCount ? 'Done' : 'In Progress';
        await connection.query('INSERT INTO tasks (project_id, assigned_to, title, description, deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
          [projectId, user.id, `Task ${i + 1} for User ${user.id}`, `Automated task for performance metrics`, '2026-06-01', status]);
      }
    }

    console.log('Departmental performance seeding completed successfully.');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

seed();
