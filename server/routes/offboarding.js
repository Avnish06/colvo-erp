const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get offboarding status for a user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.query('SELECT * FROM offboarding_status WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    
    if (results.length > 0) {
      return res.status(200).json({ status: 'success', data: results[0] });
    }
    
    // If none exists, create a default one
    db.query(
      'INSERT INTO offboarding_status (user_id) VALUES (?)',
      [userId],
      (insertErr, insertResult) => {
        if (insertErr) return res.status(500).json({ status: 'error', message: insertErr.message });
        
        db.query('SELECT * FROM offboarding_status WHERE id = ?', [insertResult.insertId], (selErr, selRes) => {
          if (selErr) return res.status(500).json({ status: 'error', message: selErr.message });
          return res.status(200).json({ status: 'success', data: selRes[0] });
        });
      }
    );
  });
});

// Update offboarding status
router.put('/:userId', (req, res) => {
  const { userId } = req.params;
  const { step_1_resignation, step_2_assets, step_3_revoke, step_4_settlement, step_5_certificates, overall_status } = req.body;
  
  db.query(
    `UPDATE offboarding_status 
     SET step_1_resignation = ?, step_2_assets = ?, step_3_revoke = ?, step_4_settlement = ?, step_5_certificates = ?, overall_status = ? 
     WHERE user_id = ?`,
    [
      step_1_resignation || false,
      step_2_assets || false,
      step_3_revoke || false,
      step_4_settlement || false,
      step_5_certificates || false,
      overall_status || 'Pending',
      userId
    ],
    (err, result) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      
      db.query('SELECT * FROM offboarding_status WHERE user_id = ?', [userId], (selErr, selRes) => {
        if (selErr) return res.status(500).json({ status: 'error', message: selErr.message });
        return res.status(200).json({ status: 'success', data: selRes[0] });
      });
    }
  );
});

// Get all pending offboarding employees (for admin)
router.get('/', (req, res) => {
  // Let's assume for offboarding, we just show all users for now, or just users with an offboarding_status record.
  // We'll show all users so the admin can pick anyone to start offboarding.
  const query = `
    SELECT u.id as user_id, u.email, e.name, e.employee_id, o.overall_status, o.step_1_resignation, o.step_2_assets, o.step_3_revoke, o.step_4_settlement, o.step_5_certificates
    FROM user_identities u
    JOIN employees e ON u.id = e.user_id
    LEFT JOIN offboarding_status o ON u.id = o.user_id
    WHERE o.overall_status != 'Completed' OR o.overall_status IS NULL
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    return res.status(200).json({ status: 'success', data: results });
  });
});

module.exports = router;
