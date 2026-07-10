const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get payroll history for a user
router.get('/:user_id', (req, res) => {
  db.query('SELECT * FROM payroll WHERE user_id = ? ORDER BY month_year DESC', [req.params.user_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching payroll' });
    res.json({ success: true, data: results });
  });
});

// Get all payroll (Admin)
router.get('/', (req, res) => {
  const query = `
        SELECT payroll.*, users.name as employee_name 
        FROM payroll 
        JOIN users ON payroll.user_id = users.id 
        ORDER BY payroll.month_year DESC
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching payroll' });
    res.json({ success: true, data: results });
  });
});

// Generate/Run Payroll for a user
router.post('/generate', (req, res) => {
  const { user_id, basic_salary, hra, da, bonus, deductions, month_year } = req.body;
  const net_salary = parseFloat(basic_salary) + parseFloat(hra) + parseFloat(da) + parseFloat(bonus) - parseFloat(deductions);
  const payment_date = new Date().toISOString().split('T')[0];

  const query = 'INSERT INTO payroll (user_id, basic_salary, hra, da, bonus, deductions, net_salary, month_year, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [user_id, basic_salary, hra, da, bonus, deductions, net_salary, month_year, payment_date], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error generating payroll' });
    
    // Connect to Finance Module
    const financeQuery = 'INSERT INTO finance_transactions (type, category, amount, currency, exchange_rate, amount_base, date, description, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(financeQuery, ['expense', 'Salary', net_salary, 'INR', 1, net_salary, payment_date, `Payroll for ${month_year} (User ${user_id})`, false], (fErr) => {
      if (fErr) console.error('Error syncing payroll to finance:', fErr);
    });

    res.json({ success: true, message: 'Payroll generated and synced to Finance', id: result.insertId });
  });
});

// Update Payroll Record
router.put('/:id', (req, res) => {
  const { basic_salary, hra, da, bonus, deductions, month_year } = req.body;
  const net_salary = parseFloat(basic_salary) + parseFloat(hra) + parseFloat(da) + parseFloat(bonus) - parseFloat(deductions);

  const query = 'UPDATE payroll SET basic_salary=?, hra=?, da=?, bonus=?, deductions=?, net_salary=?, month_year=? WHERE id=?';
  db.query(query, [basic_salary, hra, da, bonus, deductions, net_salary, month_year, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating payroll' });
    res.json({ success: true, message: 'Payroll updated successfully' });
  });
});

// Delete Payroll Record
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM payroll WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting payroll' });
    res.json({ success: true, message: 'Payroll deleted successfully' });
  });
});

// Get salary structure for a user
router.get('/structure/:user_id', (req, res) => {
  db.query('SELECT * FROM salary_structures WHERE user_id = ?', [req.params.user_id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching salary structure' });
    res.json({ success: true, data: results[0] || null });
  });
});

// Save/Update salary structure for a user
router.post('/structure', (req, res) => {
  const { user_id, basic_salary, hra, da, bonus, deductions } = req.body;
  const query = `
    INSERT INTO salary_structures (user_id, basic_salary, hra, da, bonus, deductions)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      basic_salary = VALUES(basic_salary),
      hra = VALUES(hra),
      da = VALUES(da),
      bonus = VALUES(bonus),
      deductions = VALUES(deductions)
  `;
  db.query(query, [user_id, basic_salary, hra, da, bonus, deductions], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error saving salary structure' });
    res.json({ success: true, message: 'Salary structure saved successfully' });
  });
});

module.exports = router;
