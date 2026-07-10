const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Get all leads with basic stats
router.get('/', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const { status, score, assigned_to } = req.query;
  const isEmployee = req.user.role === 'Employee CRM';

  let query = `
    SELECT leads.*, users.name as assigned_to_name,
    (SELECT MIN(reminder_date) FROM lead_reminders WHERE lead_id = leads.id AND is_completed = FALSE) as next_followup
    FROM leads
    LEFT JOIN users ON leads.assigned_to = users.id
    WHERE 1=1
  `;
  const params = [];

  if (isEmployee) {
    query += ' AND (leads.assigned_to = ? OR leads.assigned_to IS NULL)';
    params.push(req.user.id);
  } else if (assigned_to) {
    query += ' AND leads.assigned_to = ?';
    params.push(assigned_to);
  }

  if (status) {
    query += ' AND leads.status = ?';
    params.push(status);
  }
  if (score) {
    query += ' AND leads.score = ?';
    params.push(score);
  }

  query += ' ORDER BY leads.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Create new lead
router.post('/', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const { name, email, phone, source, status, score, assigned_to, reminder_date, reminder_message } = req.body;
  const creator_id = req.user.id;
  const isEmployee = req.user.role === 'Employee CRM';

  // Employees can only assign to themselves or leave unassigned (which defaults to themselves here)
  const finalAssignedTo = isEmployee ? creator_id : (assigned_to || creator_id);

  const query = 'INSERT INTO leads (name, email, phone, source, status, score, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [name, email, phone, source || 'Manual Entry', status || 'New', score || 'Warm', finalAssignedTo], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    const leadId = result.insertId;

    // Log initial activity
    const activityQuery = 'INSERT INTO lead_activities (lead_id, user_id, type, content) VALUES (?, ?, ?, ?)';
    db.query(activityQuery, [leadId, creator_id, 'Lead Captured', `Lead created by ${req.user.role}`], (actErr) => {
      if (actErr) console.error('Error logging lead capture:', actErr);
    });

    // Handle Reminder
    if (reminder_date) {
      const reminderQuery = 'INSERT INTO lead_reminders (lead_id, user_id, reminder_date, message) VALUES (?, ?, ?, ?)';
      db.query(reminderQuery, [leadId, creator_id, reminder_date, reminder_message || 'Follow-up reminder'], (remErr) => {
        if (remErr) console.error('Error setting initial reminder:', remErr);
      });
    }

    res.json({ success: true, message: 'Lead captured successfully', id: leadId });
  });
});

// Get lead details and activities
router.get('/:id', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const isEmployee = req.user.role === 'Employee CRM';
  const leadQuery = `
    SELECT leads.*, users.name as assigned_to_name
    FROM leads
    LEFT JOIN users ON leads.assigned_to = users.id
    WHERE leads.id = ?
  `;

  db.query(leadQuery, [req.params.id], (err, leads) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (leads.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });

    // Authorization check for employees
    if (isEmployee && leads[0].assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access Denied: Not your lead' });
    }

    const activityQuery = `
      SELECT lead_activities.*, users.name as user_name
      FROM lead_activities
      LEFT JOIN users ON lead_activities.user_id = users.id
      WHERE lead_id = ?
      ORDER BY created_at DESC
    `;

    db.query(activityQuery, [req.params.id], (actErr, activities) => {
      if (actErr) return res.status(500).json({ success: false, message: 'Database error' });
      res.json({ success: true, lead: leads[0], activities });
    });
  });
});

// Update lead
router.put('/:id', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const { name, email, phone, source, status, score, assigned_to, reminder_date, reminder_message } = req.body;
  const leadId = req.params.id;
  const isEmployee = req.user.role === 'Employee CRM';

  // Track changes for activity log
  db.query('SELECT * FROM leads WHERE id = ?', [leadId], (fetchErr, results) => {
    if (fetchErr || results.length === 0) return res.status(404).json({ success: false, message: 'Lead not found' });
    const oldLead = results[0];

    // Authorization check
    if (isEmployee && oldLead.assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access Denied: Cannot edit leads assigned to others' });
    }

    const finalAssignedTo = isEmployee ? oldLead.assigned_to : assigned_to;

    const query = 'UPDATE leads SET name = ?, email = ?, phone = ?, source = ?, status = ?, score = ?, assigned_to = ? WHERE id = ?';
    db.query(query, [name, email, phone, source, status, score, finalAssignedTo, leadId], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });

      // Handle Reminder Update/Create
      if (reminder_date) {
        // Check if there's already an active reminder for this lead/user
        db.query('SELECT id FROM lead_reminders WHERE lead_id = ? AND user_id = ? AND is_completed = FALSE LIMIT 1', [leadId, req.user.id], (remCheckErr, remResults) => {
          if (!remCheckErr) {
            if (remResults.length > 0) {
              // Update existing
              db.query('UPDATE lead_reminders SET reminder_date = ?, message = ? WHERE id = ?', [reminder_date, reminder_message || 'Follow-up reminder', remResults[0].id]);
            } else {
              // Create new
              db.query('INSERT INTO lead_reminders (lead_id, user_id, reminder_date, message) VALUES (?, ?, ?, ?)', [leadId, req.user.id, reminder_date, reminder_message || 'Follow-up reminder']);
            }
          }
        });
      }

      // Log significant changes
      let activityContent = [];
      if (oldLead.status !== status) activityContent.push(`Status changed from ${oldLead.status} to ${status}`);
      if (oldLead.score !== score) activityContent.push(`Score changed from ${oldLead.score} to ${score}`);
      if (!isEmployee && oldLead.assigned_to !== parseInt(assigned_to)) activityContent.push('Lead reassigned');

      if (activityContent.length > 0) {
        const activityQuery = 'INSERT INTO lead_activities (lead_id, user_id, type, content) VALUES (?, ?, ?, ?)';
        db.query(activityQuery, [leadId, req.user.id, 'Update', activityContent.join(', ')], (actErr) => {
          if (actErr) console.error('Error logging lead update:', actErr);
        });
      }

      res.json({ success: true, message: 'Lead updated successfully' });
    });
  });
});

// Delete lead - Admin only
router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin' && req.user.role !== 'Developer') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Admins can delete leads' });
  }

  const leadId = req.params.id;
  db.query('DELETE FROM leads WHERE id = ?', [leadId], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Lead deleted successfully' });
  });
});

// Add activity note
router.post('/:id/activity', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const { type, content } = req.body;
  const query = 'INSERT INTO lead_activities (lead_id, user_id, type, content) VALUES (?, ?, ?, ?)';
  db.query(query, [req.params.id, req.user.id, type || 'Note', content], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Activity logged' });
  });
});

// Reminders
router.get('/data/reminders', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const isSuperAdmin = req.user.role === 'Super Admin';
  const isDeveloper = req.user.role === 'Developer';
  let query = `
      SELECT lead_reminders.*, leads.name as lead_name
      FROM lead_reminders
      JOIN leads ON lead_reminders.lead_id = leads.id
      WHERE lead_reminders.is_completed = FALSE
    `;
  const params = [];

  if (!isSuperAdmin && !isDeveloper) {
    query += ' AND lead_reminders.user_id = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY reminder_date ASC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

router.post('/data/reminders', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const { lead_id, reminder_date, message } = req.body;
  const query = 'INSERT INTO lead_reminders (lead_id, user_id, reminder_date, message) VALUES (?, ?, ?, ?)';
  db.query(query, [lead_id, req.user.id, reminder_date, message], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Reminder set successfully' });
  });
});

router.put('/data/reminders/:id', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const isSuperAdmin = req.user.role === 'Super Admin';
  const isDeveloper = req.user.role === 'Developer';

  let query = 'UPDATE lead_reminders SET is_completed = TRUE WHERE id = ?';
  let params = [req.params.id];

  if (!isSuperAdmin && !isDeveloper) {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  }

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Reminder completed' });
  });
});

router.put('/data/reminders/:id/edit', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const { lead_id, reminder_date, message } = req.body;
  const isSuperAdmin = req.user.role === 'Super Admin';
  const isDeveloper = req.user.role === 'Developer';

  let query = 'UPDATE lead_reminders SET lead_id = ?, reminder_date = ?, message = ? WHERE id = ?';
  let params = [lead_id, reminder_date, message, req.params.id];

  if (!isSuperAdmin && !isDeveloper) {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  }

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Reminder updated successfully' });
  });
});

router.delete('/data/reminders/:id', verifyToken, checkPermission('manage_leads'), (req, res) => {
  const isSuperAdmin = req.user.role === 'Super Admin';
  const isDeveloper = req.user.role === 'Developer';

  let query = 'DELETE FROM lead_reminders WHERE id = ?';
  let params = [req.params.id];

  if (!isSuperAdmin && !isDeveloper) {
    query += ' AND user_id = ?';
    params.push(req.user.id);
  }

  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Reminder deleted successfully' });
  });
});

module.exports = router;
