const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get audit logs
router.get('/', (req, res) => {
  const query = `
        SELECT audit_logs.*, users.name as user_name, users.role_id 
        FROM audit_logs 
        LEFT JOIN users ON audit_logs.user_id = users.id 
        ORDER BY created_at DESC 
        LIMIT 100
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching logs' });
    res.json({ success: true, data: results });
  });
});

// Create log entry (Internal use mostly, but exposed for frontend actions)
router.post('/', (req, res) => {
  const { user_id, action, details } = req.body;
  db.query('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)', [user_id, action, details], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error logging action' });
    res.json({ success: true });
  });
});

module.exports = router;
