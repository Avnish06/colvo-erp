const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Get all deals with customer info
router.get('/', verifyToken, checkPermission('manage_deals'), (req, res) => {
  const isEmployee = req.user.role === 'Employee CRM';
  const userId = req.user.id;

  let query = `
    SELECT deals.*, customers.name as customer_name, customers.company_name
    FROM deals
    JOIN customers ON deals.customer_id = customers.id
    WHERE 1=1
  `;
  const params = [];

  if (isEmployee) {
    query += ` AND (deals.id IN (SELECT deal_id FROM deal_team WHERE user_id = ?) 
               OR customers.assigned_to = ?)`;
    params.push(userId, userId);
  }

  query += ' ORDER BY deals.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Create new deal
router.post('/', verifyToken, checkPermission('manage_deals'), (req, res) => {
  const { customer_id, name, value, probability, stage, expected_close_date, team_members } = req.body;
  const isEmployee = req.user.role === 'Employee CRM';

  const query = 'INSERT INTO deals (customer_id, name, value, probability, stage, expected_close_date) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [customer_id, name, value || 0, probability || 10, stage || 'Lead', expected_close_date], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    const dealId = result.insertId;

    // Default: assign the creator to the team if they are an employee
    const finalTeam = isEmployee && !team_members?.includes(req.user.id)
      ? [...(team_members || []), req.user.id]
      : (team_members || []);

    // Assign team members if provided
    if (finalTeam.length > 0) {
      const teamQuery = 'INSERT INTO deal_team (deal_id, user_id) VALUES ?';
      const teamData = finalTeam.map(userId => [dealId, userId]);
      db.query(teamQuery, [teamData], (teamErr) => {
        if (teamErr) console.error('Error assigning deal team:', teamErr);
      });
    }

    res.json({ success: true, message: 'Deal created successfully', id: dealId });
  });
});

// Update deal (including stage and lost reason)
router.put('/:id', verifyToken, checkPermission('manage_deals'), (req, res) => {
  const { name, value, probability, stage, expected_close_date, lost_reason, team_members } = req.body;
  const dealId = req.params.id;
  const isEmployee = req.user.role === 'Employee CRM';

  // Authorization check
  const authQuery = `
    SELECT d.id FROM deals d 
    LEFT JOIN deal_team dt ON d.id = dt.deal_id 
    LEFT JOIN customers c ON d.customer_id = c.id
    WHERE d.id = ? AND (dt.user_id = ? OR c.assigned_to = ?)
  `;

  db.query(authQuery, [dealId, req.user.id, req.user.id], (authErr, results) => {
    if (isEmployee && (authErr || results.length === 0)) {
      // Only Super Admin/Admin bypass this
      if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
        return res.status(403).json({ success: false, message: 'Access Denied: Not your deal' });
      }
    }

    const query = 'UPDATE deals SET name = ?, value = ?, probability = ?, stage = ?, expected_close_date = ?, lost_reason = ? WHERE id = ?';
    db.query(query, [name, value, probability, stage, expected_close_date, lost_reason || null, dealId], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });

      // Only Admin/Super Admin or specific team management logic can change team
      if (!isEmployee && team_members && Array.isArray(team_members)) {
        db.query('DELETE FROM deal_team WHERE deal_id = ?', [dealId], (delErr) => {
          if (!delErr && team_members.length > 0) {
            const teamQuery = 'INSERT INTO deal_team (deal_id, user_id) VALUES ?';
            const teamData = team_members.map(userId => [dealId, userId]);
            db.query(teamQuery, [teamData]);
          }
        });
      }

      res.json({ success: true, message: 'Deal updated successfully' });
    });
  });
});

// Delete deal - Admin only
router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Admins can delete deals' });
  }

  const dealId = req.params.id;
  db.query('DELETE FROM deals WHERE id = ?', [dealId], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Deal deleted successfully' });
  });
});

// Approve deal - Admin only
router.post('/:id/approve', verifyToken, (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
    return res.status(403).json({ success: false, message: 'Access Denied' });
  }

  db.query("UPDATE deals SET status = 'Approved' WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Deal approved' });
  });
});

// Get deal team
router.get('/:id/team', verifyToken, checkPermission('manage_deals'), (req, res) => {
  const query = `
    SELECT users.id, users.name, users.email
    FROM deal_team
    JOIN users ON deal_team.user_id = users.id
    WHERE deal_id = ?
  `;
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Sales Forecasting Data (Aggregated)
router.get('/stats/forecasting', verifyToken, checkPermission('manage_deals'), (req, res) => {
  const isEmployee = req.user.role === 'Employee CRM';
  const userId = req.user.id;

  let query = `
    SELECT 
      stage,
      COUNT(*) as count,
      SUM(value) as total_value,
      SUM(value * (probability / 100)) as weighted_value
    FROM deals
  `;

  const params = [];
  if (isEmployee) {
    query += ' WHERE id IN (SELECT deal_id FROM deal_team WHERE user_id = ?) ';
    params.push(userId);
  }

  query += ' GROUP BY stage';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

module.exports = router;
