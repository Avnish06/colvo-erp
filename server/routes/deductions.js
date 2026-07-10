const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// GET /api/deductions - Get all payroll rules
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM payroll_rules ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching deductions', error: err.message });
    res.status(200).json({ success: true, data: results });
  });
});

// POST /api/deductions - Add new payroll rule
router.post('/', verifyToken, checkPermission('manage_payroll'), (req, res) => {
  const { name, type, value, category } = req.body;
  db.query(
    'INSERT INTO payroll_rules (name, type, value, category) VALUES (?, ?, ?, ?)',
    [name, type, value, category],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Error adding rule', error: err.message });
      res.status(201).json({ success: true, message: 'Rule added successfully' });
    }
  );
});

module.exports = router;
