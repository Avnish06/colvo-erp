const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// GET /api/crm-dashboard/stats/summary
router.get('/stats/summary', verifyToken, (req, res) => {
  const isEmployee = req.user.role === 'Employee CRM';
  const userId = req.user.id;

  const queries = {
    leads: isEmployee
      ? [`SELECT COUNT(*) as count FROM leads WHERE assigned_to = ?`, [userId]]
      : [`SELECT COUNT(*) as count FROM leads`, []],
    customers: isEmployee
      ? [`SELECT COUNT(*) as count FROM customers WHERE assigned_to = ?`, [userId]]
      : [`SELECT COUNT(*) as count FROM customers`, []],
    deals: isEmployee
      ? [`SELECT COUNT(*) as count, SUM(value) as total_value FROM deals 
          WHERE id IN (SELECT deal_id FROM deal_team WHERE user_id = ?) 
          OR customer_id IN (SELECT id FROM customers WHERE assigned_to = ?)`, [userId, userId]]
      : [`SELECT COUNT(*) as count, SUM(value) as total_value FROM deals`, []],
    logs: isEmployee
      ? [`SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`, [userId]]
      : [`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10`, []]
  };

  const results = {};
  const promises = Object.keys(queries).map(key => {
    return new Promise((resolve, reject) => {
      const [sql, params] = queries[key];
      db.query(sql, params, (err, row) => {
        if (err) reject(err);
        else {
          results[key] = row;
          resolve();
        }
      });
    });
  });

  Promise.all(promises)
    .then(() => {
      res.json({
        success: true,
        data: {
          leads: results.leads[0]?.count || 0,
          customers: results.customers[0]?.count || 0,
          deals: results.deals[0]?.count || 0,
          dealsValue: results.deals[0]?.total_value || 0,
          recentLogs: results.logs
        }
      });
    })
    .catch(err => {
      console.error('Error fetching CRM summary:', err);
      res.status(500).json({ success: false, message: 'Database error' });
    });
});

module.exports = router;
