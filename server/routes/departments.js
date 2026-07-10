const express = require('express');
const router = express.Router();
const db = require('../config/db');

const { verifyToken, checkPermission } = require('../middleware/auth');

// Get all departments
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM departments WHERE company_name = ?', [req.company_name], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching departments' });
    res.json({ success: true, data: results });
  });
});

// Add department
router.post('/', verifyToken, checkPermission('manage_departments'), (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO departments (name, company_name) VALUES (?, ?)', [name, req.company_name], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding department' });
    res.json({ success: true, message: 'Department added successfully', id: result.insertId });
  });
});

module.exports = router;
