const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { sendUniqueIdEmail } = require('../utils/mailer');

// Get all pending users
router.get('/pending', verifyToken, (req, res) => {
  const role = req.user.role;
  let query = `
    SELECT users.id, users.employee_id, users.name, users.email, roles.name as role, users.joined_at 
    FROM users 
    JOIN roles ON users.role_id = roles.id 
  `;

  if (role === 'Developer' || role === 'Super Admin') {
    query += " WHERE users.status IN ('Pending', 'Pending Super Admin')";
  } else {
    query += " WHERE users.status = 'Pending'";
  }
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Approve or Reject user
router.put('/status/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  // Fetch user info for logging and role determination before update
  db.query('SELECT name, email, role_id, employee_id FROM users WHERE id = ?', [id], (fetchErr, userResults) => {
    if (fetchErr || userResults.length === 0) {
      return res.status(500).json({ success: false, message: 'User not found' });
    }
    const targetUser = userResults[0];
    const role = req.user.role;
    let nextStatus = status;

    if (status === 'Approved') {
      if (role === 'Developer' || role === 'Super Admin') {
        nextStatus = 'Active';
      } else if (role === 'Admin') {
        nextStatus = 'Pending Super Admin';
      }
    }

    // Determine which profile table to update
    const rid = parseInt(targetUser.role_id);
    let targetTable = 'employees';
    if (rid === 1) targetTable = 'superadmins';
    else if (rid === 2) targetTable = 'admins';

    const query = `UPDATE ${targetTable} SET status = ? WHERE user_id = ?`;
    db.query(query, [nextStatus, id], (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });

      // Log the action in Audit Logs
      const auditAction = status === 'Approved' ? 'REGISTRATION_APPROVAL' : 'REGISTRATION_REJECTION';
      const auditDetails = `${status} registration request for ${targetUser.name} (${targetUser.email}). Profile status moved to ${nextStatus}.`;
      const auditQuery = 'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)';

      db.query(auditQuery, [req.user.id, auditAction, auditDetails], (auditErr) => {
        if (auditErr) console.error('Error logging to audit:', auditErr);
      });

      // If Admin approved, notify Super Admin and Developers
      if (status === 'Approved' && role === 'Admin') {
        const superQuery = 'SELECT id FROM users WHERE role_id IN (1, 5)';
        db.query(superQuery, (superErr, supers) => {
          if (!superErr && supers.length > 0) {
            const notificationQuery = 'INSERT INTO notifications (user_id, title, message, type, triggered_by, action_type) VALUES ?';
            const notifications = supers.map(s => [
              s.id,
              'Final Approval Required',
              `${targetUser.name}'s registration has been approved by an Admin and needs final Super Admin validation.`,
              'info',
              req.user.id,
              'REGISTRATION_APPROVAL'
            ]);
            db.query(notificationQuery, [notifications], (notifErr) => {
              if (notifErr) console.error('Error notifying Super Admin:', notifErr);
            });
          }
        });
      }

      // If status became Active, send the Unique ID email
      if (nextStatus === 'Active' && targetUser.employee_id) {
        sendUniqueIdEmail(targetUser.email, targetUser.name, targetUser.employee_id).catch(err => {
          console.error('[Approval] Failed to send ID email:', err);
        });
      }

      res.json({ success: true, message: `User status updated to ${status}. Current state: ${nextStatus}` });
    });
  });
});

// Get pending count
router.get('/pending-count/all', verifyToken, (req, res) => {
  const role = req.user.role;
  let query = "SELECT COUNT(*) as count FROM users WHERE status = ?";
  let params = [];

  if (role === 'Developer') {
    query = "SELECT COUNT(*) as count FROM users WHERE status IN ('Pending', 'Pending Super Admin')";
  } else {
    params = [role === 'Super Admin' ? 'Pending Super Admin' : 'Pending'];
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    const count = (results && results[0]) ? results[0].count : 0;
    res.json({ success: true, count });
  });
});

module.exports = router;
