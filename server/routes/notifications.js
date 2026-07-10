const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Create Announcement (Admin/Super Admin only)
router.post('/announcements', verifyToken, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?)';
  db.query(query, [title, content, req.user.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error creating announcement' });
    res.json({ success: true, message: 'Announcement created successfully', id: result.insertId });
  });
});

// Get all announcements
router.get('/announcements', verifyToken, (req, res) => {
  const query = `
    SELECT a.*, u.name as created_by_name 
    FROM announcements a
    LEFT JOIN users u ON a.created_by = u.id
    ORDER BY a.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching announcements' });
    res.json({ success: true, data: results });
  });
});

// Send Notification to specific user
router.post('/send', verifyToken, (req, res) => {
  const { user_id, title, message, type } = req.body;

  if (!user_id || !title || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const query = 'INSERT INTO notifications (user_id, title, message, type, triggered_by, action_type) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [user_id, title, message, type || 'info', req.user.id, 'MANUAL_NOTIFICATION'], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error sending notification' });
    res.json({ success: true, message: 'Notification sent successfully', id: result.insertId });
  });
});

// Get notifications for current user
router.get('/user', verifyToken, (req, res) => {
  let query = `
    SELECT n.*, u.name as triggered_by_name 
    FROM notifications n
    LEFT JOIN users u ON n.triggered_by = u.id
  `;

  const queryParams = [];

  // Developer role sees ALL notifications (God-mode access)
  if (req.user.role !== 'Developer') {
    query += ' WHERE n.user_id = ?';
    queryParams.push(req.user.id);
  }

  query += ' ORDER BY n.created_at DESC';

  db.query(query, queryParams, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching notifications' });
    res.json({ success: true, data: results });
  });
});

// Mark ALL notifications as read for current user
router.put('/read-all', verifyToken, (req, res) => {
  let query = 'UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE';
  const params = [];

  if (req.user.role !== 'Developer') {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  }

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error marking all as read' });
    res.json({ success: true, message: `${result.affectedRows} notifications marked as read` });
  });
});

// Mark notification as read
router.put('/:id/read', verifyToken, (req, res) => {
  let query = 'UPDATE notifications SET is_read = TRUE WHERE id = ?';
  const params = [req.params.id];

  if (req.user.role !== 'Developer') {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  }

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating notification' });
    res.json({ success: true, message: 'Notification marked as read' });
  });
});

// Delete notification
router.delete('/:id', verifyToken, (req, res) => {
  const query = 'DELETE FROM notifications WHERE id = ? AND user_id = ?';
  db.query(query, [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting notification' });
    res.json({ success: true, message: 'Notification deleted' });
  });
});

module.exports = router;
