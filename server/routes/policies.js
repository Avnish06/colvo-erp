const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all policies (Everyone can read)
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM company_policies ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching policies' });
    res.json({ success: true, data: results });
  });
});

// Add new policy
router.post('/', verifyToken, (req, res) => {
  if (!['Developer', 'Super Admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to add policies' });
  }
  const { title, content } = req.body;
  db.query('INSERT INTO company_policies (title, content) VALUES (?, ?)', [title, content], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding policy' });
    res.json({ success: true, message: 'Policy added successfully', id: result.insertId });
  });
});

// Update policy
router.put('/:id', verifyToken, (req, res) => {
  if (!['Developer', 'Super Admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to update policies' });
  }
  const { title, content } = req.body;
  db.query('UPDATE company_policies SET title = ?, content = ? WHERE id = ?', [title, content, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating policy' });
    res.json({ success: true, message: 'Policy updated successfully' });
  });
});

// Delete policy
router.delete('/:id', verifyToken, (req, res) => {
  if (!['Developer', 'Super Admin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges to delete policies' });
  }
  db.query('DELETE FROM company_policies WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting policy' });
    res.json({ success: true, message: 'Policy deleted successfully' });
  });
});

module.exports = router;
