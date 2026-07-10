const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get onboarding status for a user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Try to find existing status
  db.query('SELECT * FROM onboarding_status WHERE user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    
    if (results.length > 0) {
      return res.status(200).json({ status: 'success', data: results[0] });
    }
    
    // If none exists, create a default one
    const defaultDocs = JSON.stringify({ aadhar: false, photo: false, parents: false });
    db.query(
      'INSERT INTO onboarding_status (user_id, step_1_docs) VALUES (?, ?)',
      [userId, defaultDocs],
      (insertErr, insertResult) => {
        if (insertErr) return res.status(500).json({ status: 'error', message: insertErr.message });
        
        db.query('SELECT * FROM onboarding_status WHERE id = ?', [insertResult.insertId], (selErr, selRes) => {
          if (selErr) return res.status(500).json({ status: 'error', message: selErr.message });
          return res.status(200).json({ status: 'success', data: selRes[0] });
        });
      }
    );
  });
});

// Update onboarding status
router.put('/:userId', (req, res) => {
  const { userId } = req.params;
  let { step_1_docs, step_2_bg, step_3_offer, step_4_orientation, step_5_assignment, overall_status } = req.body;
  
  if (step_5_assignment) {
    overall_status = 'Completed';
  }

  db.query(
    `UPDATE onboarding_status 
     SET step_1_docs = ?, step_2_bg = ?, step_3_offer = ?, step_4_orientation = ?, step_5_assignment = ?, overall_status = ? 
     WHERE user_id = ?`,
    [
      step_1_docs ? JSON.stringify(step_1_docs) : null,
      step_2_bg || false,
      step_3_offer || false,
      step_4_orientation || false,
      step_5_assignment || false,
      overall_status || 'Pending',
      userId
    ],
    (err, result) => {
      if (err) return res.status(500).json({ status: 'error', message: err.message });
      
      // AUTOMATION TRIGGER: If step 5 is just completed
      if (step_5_assignment) {
        // 1. Assign Role to Employee
        db.query('SELECT id FROM roles WHERE name = "Employee" LIMIT 1', (roleErr, roleRes) => {
          if (!roleErr && roleRes.length > 0) {
            db.query('UPDATE user_identities SET role_id = ? WHERE id = ?', [roleRes[0].id, userId]);
          }
        });
        
        // 2. Assign Welcome Asset
        // First get employee name
        db.query('SELECT name FROM employees WHERE user_id = ?', [userId], (empErr, empRes) => {
          if (!empErr && empRes.length > 0) {
            const empName = empRes[0].name;
            const assetId = 'AST-' + Date.now();
            db.query(
              'INSERT INTO assets (id, name, category, status, assignee_name, user_id, value, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [assetId, 'Standard Developer Laptop', 'Laptop', 'Assigned', empName, userId, 100000, new Date()],
              (assetErr) => {
                if (assetErr) console.error('Failed to auto-assign asset:', assetErr);
              }
            );
          }
        });
      }

      db.query('SELECT * FROM onboarding_status WHERE user_id = ?', [userId], (selErr, selRes) => {
        if (selErr) return res.status(500).json({ status: 'error', message: selErr.message });
        return res.status(200).json({ status: 'success', data: selRes[0] });
      });
    }
  );
});

// Get all pending onboarding employees (for admin)
router.get('/', (req, res) => {
  const query = `
    SELECT u.id as user_id, u.email, e.name, e.employee_id, o.overall_status, o.step_1_docs, o.step_2_bg, o.step_3_offer, o.step_4_orientation, o.step_5_assignment
    FROM user_identities u
    JOIN employees e ON u.id = e.user_id
    LEFT JOIN onboarding_status o ON u.id = o.user_id
    WHERE o.overall_status != 'Completed' OR o.overall_status IS NULL
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ status: 'error', message: err.message });
    return res.status(200).json({ status: 'success', data: results });
  });
});

module.exports = router;
