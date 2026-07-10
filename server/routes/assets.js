const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all assets
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM assets ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', data: results });
  });
});

// Create a new asset
router.post('/', verifyToken, (req, res) => {
  const { id, name, category, status, assignee_name, purchase_date, value, user_id } = req.body;
  
  db.query(
    'INSERT INTO assets (id, name, category, status, assignee_name, purchase_date, value, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, category, status || 'Available', assignee_name || null, purchase_date || null, value || 0, user_id || null],
    (err, result) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Asset created successfully' });
    }
  );
});

// Update an asset
router.put('/:id', verifyToken, (req, res) => {
  const { name, category, status, assignee_name, purchase_date, value, user_id } = req.body;
  const { id } = req.params;
  
  db.query(
    'UPDATE assets SET name = ?, category = ?, status = ?, assignee_name = ?, purchase_date = ?, value = ?, user_id = ? WHERE id = ?',
    [name, category, status, assignee_name, purchase_date, value, user_id, id],
    (err, result) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      res.json({ status: 'success', message: 'Asset updated successfully' });
    }
  );
});

// Delete an asset
router.delete('/:id', verifyToken, (req, res) => {
  db.query('DELETE FROM assets WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    res.json({ status: 'success', message: 'Asset deleted successfully' });
  });
});

module.exports = router;
