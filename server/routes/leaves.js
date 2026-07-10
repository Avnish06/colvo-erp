const express = require('express');
const router = express.Router();
const db = require('../config/db');

const { verifyToken, checkPermission } = require('../middleware/auth');

// Apply for leave
router.post('/apply', verifyToken, (req, res) => {
  const { user_id, leave_type, start_date, end_date, reason } = req.body;
  const query = 'INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [user_id, leave_type, start_date, end_date, reason], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error applying for leave' });
    res.json({ success: true, message: 'Leave application submitted', id: result.insertId });
  });
});

// Get leave requests for a user
router.get('/:user_id', verifyToken, (req, res) => {
  db.query('SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC', [req.params.user_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching leave requests' });
    res.json({ success: true, data: results });
  });
});

// Get all leave requests (Admin)
router.get('/', verifyToken, checkPermission('view_leaves'), (req, res) => {
  const query = `
        SELECT leave_requests.*, users.name as employee_name 
        FROM leave_requests 
        JOIN users ON leave_requests.user_id = users.id 
        ORDER BY leave_requests.created_at DESC
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching leave requests' });
    res.json({ success: true, data: results });
  });
});

// Update leave status (Approve/Reject)
router.put('/:id', verifyToken, checkPermission('manage_leaves'), (req, res) => {
  const { status, rejection_reason } = req.body;
  const query = 'UPDATE leave_requests SET status = ?, rejection_reason = ? WHERE id = ?';
  db.query(query, [status, rejection_reason || null, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating leave status' });
    res.json({ success: true, message: `Leave ${status} successfully` });
  });
});

module.exports = router;
