const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedTestData = async () => {
  try {
    console.log('Starting data seeding...');

    // 1. Seed Roles (if needed, but usually predefined)
    // Table 'roles' is expected to have IDs 1: Super Admin, 2: Admin, 3: Employee
    await db.promise().query("INSERT IGNORE INTO roles (id, name) VALUES (4, 'Support')");

    // 2. Seed Departments
    const depts = [['IT'], ['HR'], ['Finance'], ['Sales'], ['Engineering']];
    await db.promise().query('INSERT IGNORE INTO departments (name) VALUES ?', [depts]);
    console.log('Departments seeded.');

    // 3. Seed Users (Employees)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const users = [
      ['John Doe', 'john@example.com', hashedPassword, 2, 1], // Admin in IT
      ['Jane Smith', 'jane@example.com', hashedPassword, 3, 2], // Employee in HR
      ['Mike Ross', 'mike@example.com', hashedPassword, 3, 3], // Employee in Finance
      ['Harvey Specter', 'harvey@example.com', hashedPassword, 3, 5], // Employee in Engineering
      ['Support User', 'support@example.com', hashedPassword, 4, 1], // Support Role (ID 4)
    ];

    for (const user of users) {
      const [rows] = await db.promise().query('SELECT id FROM users WHERE email = ?', [user[1]]);
      if (rows.length === 0) {
        await db.promise().query('INSERT INTO users (name, email, password, role_id, department_id) VALUES (?, ?, ?, ?, ?)', user);
      }
    }
    console.log('Users seeded.');

    // Get some user IDs for subsequent seeds
    const [userRows] = await db.promise().query('SELECT id FROM users WHERE email IN ("jane@example.com", "mike@example.com")');
    const user1Id = userRows[0].id;
    const user2Id = userRows[1].id;

    // 4. Seed Attendance
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const attendance = [
      [user1Id, yesterday, '09:00:00', '17:00:00', 'Present'],
      [user2Id, yesterday, '09:15:00', '18:00:00', 'Present'],
      [user1Id, today, '08:55:00', null, 'Present'],
    ];
    await db.promise().query('INSERT IGNORE INTO attendance (user_id, date, clock_in, clock_out, status) VALUES ?', [attendance]);
    console.log('Attendance seeded.');

    // 5. Seed Leave Requests
    const leaves = [
      [user2Id, 'Sick', yesterday, yesterday, 'Fever', 'Approved'],
      [user1Id, 'Casual', '2026-03-01', '2026-03-03', 'Family function', 'Pending'],
    ];
    await db.promise().query('INSERT IGNORE INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status) VALUES ?', [leaves]);
    console.log('Leave requests seeded.');

    // 6. Seed Projects
    const projects = [
      ['Cloud Migration', 'Move legacy servers to AWS', '2026-06-30', 'In Progress'],
      ['New Website', 'Redesign corporate portal', '2026-04-15', 'In Progress'],
    ];
    await db.promise().query('INSERT IGNORE INTO projects (name, description, deadline, status) VALUES ?', [projects]);
    console.log('Projects seeded.');

    // 7. Seed Tasks
    const [projectRows] = await db.promise().query('SELECT id FROM projects WHERE name = "Cloud Migration"');
    const projId = projectRows[0].id;
    const tasks = [
      [projId, user1Id, 'Setup EC2 Instances', 'Configure production environment', '2026-03-10', 'Pending'],
      [projId, user2Id, 'Database Export', 'Prepare SQL dump', '2026-03-05', 'Completed'],
    ];
    await db.promise().query('INSERT IGNORE INTO tasks (project_id, assigned_to, title, description, deadline, status) VALUES ?', [tasks]);
    console.log('Tasks seeded.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedTestData();
