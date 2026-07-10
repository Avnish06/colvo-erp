const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Get all tickets (Admin/Super Admin/Developer sees all, User sees theirs)
router.get('/', verifyToken, (req, res) => {
  const { id: user_id, role } = req.user;

  let query = `
        SELECT tickets.*, users.name as creator_name 
        FROM tickets 
        JOIN users ON tickets.user_id = users.id 
    `;

  const params = [];

  // If role is not an elevated one, filter by user_id
  const hasElevatedAccess = role === 'Super Admin' || role === 'Admin' || role === 'Developer';

  if (!hasElevatedAccess) {
    query += ' WHERE tickets.user_id = ?';
    params.push(user_id);
  }

  query += ' ORDER BY created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ success: false, message: 'Error fetching tickets' });
    }
    res.json({ success: true, data: results });
  });
});

// Create a ticket
router.post('/', verifyToken, (req, res) => {
  const { title, description, priority, category } = req.body;
  const user_id = req.body.user_id || req.user.id; // Fallback to token ID

  const query = 'INSERT INTO tickets (user_id, title, description, priority, category) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [user_id, title, description, priority || 'Medium', category || 'Issue'], (err, result) => {
    if (err) {
      console.error('Error creating ticket:', err);
      return res.status(500).json({ success: false, message: 'Error creating ticket' });
    }
    res.json({ success: true, message: 'Ticket created successfully', id: result.insertId });
  });
});

// Update ticket status or assignment (Admin/Super Admin/Developer)
router.put('/:id', verifyToken, checkPermission('manage_tickets'), (req, res) => {
  const { status, assigned_to } = req.body;
  const { id } = req.params;

  let query = 'UPDATE tickets SET ';
  const params = [];

  if (status) {
    query += 'status = ?';
    params.push(status);
  }

  if (assigned_to) {
    if (params.length > 0) query += ', ';
    query += 'assigned_to = ?';
    params.push(assigned_to);
  }

  if (params.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  query += ' WHERE id = ?';
  params.push(id);

  db.query(query, params, (err) => {
    if (err) {
      console.error('Error updating ticket:', err);
      return res.status(500).json({ success: false, message: 'Error updating ticket' });
    }
    res.json({ success: true, message: 'Ticket updated successfully' });
  });
});

// Delete ticket (Admin/Super Admin/Developer)
router.delete('/:id', verifyToken, checkPermission('manage_tickets'), (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tickets WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting ticket:', err);
      return res.status(500).json({ success: false, message: 'Error deleting ticket' });
    }
    res.json({ success: true, message: 'Ticket deleted successfully' });
  });
});

module.exports = router;
