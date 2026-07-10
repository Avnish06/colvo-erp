const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/expenditures - Get all expenditures
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM expenditures ORDER BY date DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching expenditures' });
    res.json({ success: true, data: results });
  });
});

// POST /api/expenditures - Add new expenditure
router.post('/', verifyToken, (req, res) => {
  const { category, amount, description, date } = req.body;
  const query = 'INSERT INTO expenditures (category, amount, description, date) VALUES (?, ?, ?, ?)';
  db.query(query, [category, amount, description, date], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding expenditure' });
    res.json({ success: true, message: 'Expenditure added successfully', id: result.insertId });
  });
});

// DELETE /api/expenditures/:id - Delete expenditure
router.delete('/:id', verifyToken, (req, res) => {
  db.query('DELETE FROM expenditures WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting expenditure' });
    res.json({ success: true, message: 'Expenditure deleted successfully' });
  });
});

module.exports = router;
