const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Global search endpoint
router.get('/', verifyToken, (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: { employees: [], projects: [], tickets: [] } });
  }

  const term = `%${q.trim()}%`;

  const queries = {
    employees: `
      SELECT users.id, users.name, users.email, users.employee_id, roles.name as role, departments.name as department
      FROM users
      LEFT JOIN roles ON users.role_id = roles.id
      LEFT JOIN departments ON users.department_id = departments.id
      WHERE users.name LIKE ? OR users.email LIKE ? OR users.employee_id LIKE ?
      LIMIT 5
    `,
    projects: `
      SELECT id, title, description, status
      FROM projects
      WHERE title LIKE ? OR description LIKE ?
      LIMIT 5
    `,
    tickets: `
      SELECT tickets.id, tickets.subject, tickets.status, tickets.priority, users.name as created_by
      FROM tickets
      LEFT JOIN users ON tickets.user_id = users.id
      WHERE tickets.subject LIKE ?
      LIMIT 5
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = 3;

  const finish = () => {
    completed++;
    if (completed === totalQueries) {
      res.json({ success: true, data: results });
    }
  };

  // Search employees
  db.query(queries.employees, [term, term, term], (err, rows) => {
    results.employees = err ? [] : rows;
    finish();
  });

  // Search projects
  db.query(queries.projects, [term, term], (err, rows) => {
    results.projects = err ? [] : rows;
    finish();
  });

  // Search tickets
  db.query(queries.tickets, [term], (err, rows) => {
    results.tickets = err ? [] : rows;
    finish();
  });
});

module.exports = router;
