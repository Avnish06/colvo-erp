const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Request WFH (Employees)
router.post('/', verifyToken, (req, res) => {
  const { date, reason } = req.body;
  const user_id = req.user.id;

  if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

  const query = 'INSERT INTO wfh_requests (user_id, date, reason) VALUES (?, ?, ?)';
  db.query(query, [user_id, date, reason], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error: ' + err.message });
    res.json({ success: true, message: 'WFH request submitted successfully', id: result.insertId });
  });
});

// Get my WFH requests
router.get('/my', verifyToken, (req, res) => {
  const user_id = req.user.id;
  const query = 'SELECT * FROM wfh_requests WHERE user_id = ? ORDER BY date DESC';
  db.query(query, [user_id], (err, results) => {
    if (err) {
      console.error('WFH My Fetch Error:', err);
      return res.status(500).json({ success: false, message: 'DB error: ' + err.message });
    }
    res.json({ success: true, data: results });
  });
});

// Get all WFH requests (Admins+)
router.get('/all', verifyToken, (req, res) => {
  const { role } = req.user;
  if (role !== 'Admin' && role !== 'Super Admin' && role !== 'Developer') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const query = `
        SELECT w.*, u.name as employee_name, u.employee_id 
        FROM wfh_requests w
        JOIN users u ON w.user_id = u.id
        ORDER BY w.date DESC, w.created_at DESC
    `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('WFH All Fetch Error:', err);
      return res.status(500).json({ success: false, message: 'DB error: ' + err.message });
    }
    res.json({ success: true, data: results });
  });
});

// Update WFH status (Admins+)
router.put('/:id/status', verifyToken, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  const reviewer_id = req.user.id;
  const { role } = req.user;

  if (role !== 'Admin' && role !== 'Super Admin' && role !== 'Developer') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const query = 'UPDATE wfh_requests SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?';
  db.query(query, [status, reviewer_id, id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error: ' + err.message });
    res.json({ success: true, message: `WFH request ${status.toLowerCase()} successfully` });
  });
});

// Check WFH status for a user on a specific date
router.get('/check/:date', verifyToken, (req, res) => {
  const { date } = req.params;
  const user_id = req.user.id;

  const query = 'SELECT status FROM wfh_requests WHERE user_id = ? AND date = ? AND status = "Approved"';
  db.query(query, [user_id, date], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    res.json({ success: true, isApproved: results.length > 0 });
  });
});

module.exports = router;
