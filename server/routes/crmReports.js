const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Lead Source Report
router.get('/lead-sources', verifyToken, (req, res) => {
  const query = 'SELECT source as name, COUNT(*) as value FROM leads GROUP BY source';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Conversion Rate Report
router.get('/conversion', verifyToken, (req, res) => {
  const query = 'SELECT status as name, COUNT(*) as value FROM leads GROUP BY status';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Sales Pipeline Report
router.get('/pipeline', verifyToken, (req, res) => {
  const query = 'SELECT stage as name, COUNT(*) as count, SUM(value) as total_value FROM deals GROUP BY stage';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Salesperson Performance
router.get('/performance', verifyToken, (req, res) => {
  const query = `
    SELECT u.name, COUNT(d.id) as won_deals, SUM(d.value) as total_value 
    FROM users u 
    JOIN deal_team dt ON u.id = dt.user_id 
    JOIN deals d ON dt.deal_id = d.id 
    WHERE d.stage = 'Won' 
    GROUP BY u.id, u.name
    ORDER BY total_value DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Revenue Forecast
router.get('/forecast', verifyToken, (req, res) => {
  const query = `
    SELECT DATE_FORMAT(expected_close_date, '%Y-%m') as month, SUM(value * (probability/100)) as forecast 
    FROM deals 
    WHERE stage NOT IN ('Won', 'Lost') AND expected_close_date IS NOT NULL
    GROUP BY month 
    ORDER BY month
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Lost Deals Analysis
router.get('/lost-analysis', verifyToken, (req, res) => {
  const query = "SELECT lost_reason as name, COUNT(*) as value FROM deals WHERE stage = 'Lost' AND lost_reason IS NOT NULL GROUP BY lost_reason";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Customer Retention / Segmentation
router.get('/retention', verifyToken, (req, res) => {
  const query = 'SELECT segmentation as name, COUNT(*) as value FROM customers GROUP BY segmentation';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

module.exports = router;
