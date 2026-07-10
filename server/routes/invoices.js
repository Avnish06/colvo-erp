const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// GET /api/invoices - Get all invoices
router.get('/', verifyToken, (req, res) => {
  db.query('SELECT * FROM invoices ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching invoices', error: err.message });
    res.status(200).json({ success: true, data: results });
  });
});

// POST /api/invoices - Create new invoice
router.post('/', verifyToken, checkPermission('manage_payroll'), (req, res) => {
  const { id, client_name, total_amount, invoice_date, items, currency, is_recurring } = req.body;
  console.log('Received invoice request:', req.body);

  db.beginTransaction((err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error starting transaction' });

    // Insert Invoice Header
    db.query(
      'INSERT INTO invoices (id, client_name, total_amount, invoice_date) VALUES (?, ?, ?, ?)',
      [id, client_name, total_amount, invoice_date],
      (err) => {
        if (err) {
          console.error('Invoice Header Error:', err);
          return db.rollback(() => {
            res.status(500).json({ success: false, message: 'Error inserting invoice', error: err.message });
          });
        }

        if (items && items.length > 0) {
          const itemValues = items.map(item => [
            id,
            item.description,
            item.qty,
            item.rate,
            item.qty * item.rate
          ]);
          db.query(
            'INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount) VALUES ?',
            [itemValues],
            (err) => {
              if (err) {
                console.error('Invoice Items Error:', err);
                return db.rollback(() => {
                  res.status(500).json({ success: false, message: 'Error inserting items', error: err.message });
                });
              }
              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ success: false, message: 'Error committing transaction' });
                  });
                }
                // Sync with Finance Module
                const financeQuery = 'INSERT INTO finance_transactions (type, category, amount, currency, exchange_rate, amount_base, date, description, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                const exchange_rate = currency === 'USD' ? 83.5 : (currency === 'EUR' ? 90.2 : 1);
                const amount_base = total_amount * exchange_rate;
                
                db.query(financeQuery, ['income', 'Sales', total_amount, currency || 'INR', exchange_rate, amount_base, invoice_date, `Invoice ${id} for ${client_name}`, is_recurring || false], (fErr) => {
                  if (fErr) console.error('Error syncing invoice to finance:', fErr);
                });

                res.status(201).json({ success: true, message: 'Invoice generated successfully' });
              });
            }
          );
        } else {
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ success: false, message: 'Error committing transaction' });
              });
            }
            
            // Sync with Finance Module
            const financeQuery = 'INSERT INTO finance_transactions (type, category, amount, currency, exchange_rate, amount_base, date, description, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const exchange_rate = currency === 'USD' ? 83.5 : (currency === 'EUR' ? 90.2 : 1);
            const amount_base = total_amount * exchange_rate;
            
            db.query(financeQuery, ['income', 'Sales', total_amount, currency || 'INR', exchange_rate, amount_base, invoice_date, `Invoice ${id} for ${client_name}`, is_recurring || false], (fErr) => {
              if (fErr) console.error('Error syncing invoice to finance:', fErr);
            });

            res.status(201).json({ success: true, message: 'Invoice generated successfully' });
          });
        }
      }
    );
  });
});

module.exports = router;
