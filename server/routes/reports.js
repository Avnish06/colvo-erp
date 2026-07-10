const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/reports - Get report history
router.get('/', (req, res) => {
  db.query('SELECT * FROM reports ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching reports' });
    res.json({ success: true, data: results });
  });
});

// POST /api/reports/generate - Generate a new dynamic report
router.post('/generate', async (req, res) => {
  const { type, month, year } = req.body;
  console.log('Generating report:', { type, month, year });

  try {
    const period = type === 'Monthly' ? `${month} ${year}` : `${year}`;
    const reportTitle = `${period} Financial Summary`;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = monthNames.indexOf(month) + 1;
    const formattedMonth = monthIndex < 10 ? `0${monthIndex}` : `${monthIndex}`;
    const dbMonthYear = `${year}-${formattedMonth}`; // Internal format: YYYY-MM

    console.log('Calculation params:', { monthIndex, dbMonthYear });

    // 1. Aggregate Payroll Data
    const payrollPromise = new Promise((resolve, reject) => {
      const query = type === 'Monthly'
        ? 'SELECT SUM(net_salary) as salary, SUM(deductions) as deductions FROM payroll WHERE month_year = ?'
        : 'SELECT SUM(net_salary) as salary, SUM(deductions) as deductions FROM payroll WHERE month_year LIKE ?';
      const params = type === 'Monthly' ? [dbMonthYear] : [`${year}-%`];

      db.query(query, params, (err, results) => {
        if (err) {
          console.error('Payroll aggregation error:', err);
          return reject(err);
        }
        resolve(results[0] || { salary: 0, deductions: 0 });
      });
    });

    // 2. Aggregate Invoice Data
    const invoicePromise = new Promise((resolve, reject) => {
      const query = type === 'Monthly'
        ? 'SELECT SUM(total_amount) as total FROM invoices WHERE MONTH(invoice_date) = ? AND YEAR(invoice_date) = ?'
        : 'SELECT SUM(total_amount) as total FROM invoices WHERE YEAR(invoice_date) = ?';
      const params = type === 'Monthly' ? [monthIndex, year] : [year];

      db.query(query, params, (err, results) => {
        if (err) {
          console.error('Invoice aggregation error:', err);
          return reject(err);
        }
        resolve(results[0] || { total: 0 });
      });
    });

    // 3. Aggregate Expenditure Data
    const expenditurePromise = new Promise((resolve, reject) => {
      const query = type === 'Monthly'
        ? 'SELECT SUM(amount) as total FROM expenditures WHERE MONTH(date) = ? AND YEAR(date) = ?'
        : 'SELECT SUM(amount) as total FROM expenditures WHERE YEAR(date) = ?';
      const params = type === 'Monthly' ? [monthIndex, year] : [year];

      db.query(query, params, (err, results) => {
        if (err) {
          console.error('Expenditure aggregation error:', err);
          return reject(err);
        }
        resolve(results[0] || { total: 0 });
      });
    });

    const [payroll, invoices, expenditures] = await Promise.all([payrollPromise, invoicePromise, expenditurePromise]);

    const total_salary = payroll?.salary || 0;
    const total_deductions = payroll?.deductions || 0;
    const total_invoices = invoices?.total || 0;
    const total_expenditure = expenditures?.total || 0;

    console.log('Aggregated Data:', { total_salary, total_deductions, total_invoices, total_expenditure });

    // 4. Save Report Entry
    const insertQuery = `
      INSERT INTO reports (title, type, period_month, period_year, total_salary, total_deductions, total_invoices, total_expenditure, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Generated')
    `;

    db.query(insertQuery, [reportTitle, type, month, year, total_salary, total_deductions, total_invoices, total_expenditure], (err, result) => {
      if (err) {
        console.error('Report save error:', err);
        return res.status(500).json({ success: false, message: 'Error saving report entry', error: err.message });
      }
      res.json({
        success: true,
        message: 'Report generated successfully',
        data: {
          id: result.insertId,
          title: reportTitle,
          total_salary,
          total_deductions,
          total_invoices,
          total_expenditure
        }
      });
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error during report generation', error: error.message });
    }
  }
});

module.exports = router;
