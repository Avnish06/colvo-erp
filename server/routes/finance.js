const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Note: The UI requested features like Cash Flow Forecasting and AI Expense Categorization.
// We will perform some of that logic directly here or return structured data for the frontend to process.

// GET /api/finance/transactions
router.get('/transactions', verifyToken, (req, res) => {
  db.query('SELECT * FROM finance_transactions ORDER BY date DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, transactions: results });
  });
});

// POST /api/finance/transactions
router.post('/transactions', verifyToken, (req, res) => {
  const { type, category, amount, currency, exchange_rate, amount_base, date, description, is_recurring } = req.body;
  
  db.query(
    'INSERT INTO finance_transactions (type, category, amount, currency, exchange_rate, amount_base, date, description, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [type, category, amount, currency || 'INR', exchange_rate || 1, amount_base || amount, date, description, is_recurring || false],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// GET /api/finance/budgets
router.get('/budgets', verifyToken, (req, res) => {
  // Get budgets and current month's expenses
  const q = `
    SELECT b.category, b.monthly_limit, 
           COALESCE(SUM(t.amount_base), 0) as spent
    FROM finance_budgets b
    LEFT JOIN finance_transactions t 
      ON b.category = t.category 
      AND t.type = 'expense' 
      AND MONTH(t.date) = MONTH(CURRENT_DATE()) 
      AND YEAR(t.date) = YEAR(CURRENT_DATE())
    GROUP BY b.category, b.monthly_limit
  `;
  
  db.query(q, (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, budgets: results });
  });
});

// POST /api/finance/ai-categorize (Mock AI)
router.post('/ai-categorize', verifyToken, (req, res) => {
  const { description } = req.body;
  const desc = description.toLowerCase();
  let category = 'Other';
  
  if (desc.includes('ad') || desc.includes('marketing') || desc.includes('facebook') || desc.includes('google')) {
    category = 'Marketing';
  } else if (desc.includes('aws') || desc.includes('software') || desc.includes('hosting') || desc.includes('github') || desc.includes('slack')) {
    category = 'Software';
  } else if (desc.includes('rent') || desc.includes('office') || desc.includes('electricity') || desc.includes('cleaning')) {
    category = 'Office Rent';
  } else if (desc.includes('travel') || desc.includes('flight') || desc.includes('uber') || desc.includes('hotel')) {
    category = 'Travel';
  } else if (desc.includes('salary') || desc.includes('payroll') || desc.includes('bonus')) {
    category = 'Salary';
  }
  
  res.json({ success: true, category });
});

module.exports = router;
