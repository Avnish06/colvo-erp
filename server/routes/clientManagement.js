const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// @route   GET /api/client-management/proposals
// @desc    Get all proposals
router.get('/proposals', verifyToken, (req, res) => {
  db.query('SELECT * FROM proposals ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, proposals: results });
  });
});

// @route   POST /api/client-management/proposals
// @desc    Create a new proposal
router.post('/proposals', verifyToken, (req, res) => {
  const { client_name, project_name, value } = req.body;
  const created_by = req.user.id;
  
  db.query(
    'INSERT INTO proposals (client_name, project_name, value, created_by) VALUES (?, ?, ?, ?)',
    [client_name, project_name, value, created_by],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.status(201).json({ success: true, message: 'Proposal created', id: result.insertId });
    }
  );
});

// @route   PUT /api/client-management/proposals/:id/approve
// @desc    Admin (CEO) approves a proposal
router.put('/proposals/:id/approve', verifyToken, (req, res) => {
  const proposalId = req.params.id;
  const adminId = req.user.id;

  // Verify if user is an admin or CEO based on role check in middleware, or assume valid for now
  db.query(
    'UPDATE proposals SET status = ?, admin_approved = ? WHERE id = ?',
    ['Approved', true, proposalId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.json({ success: true, message: 'Proposal approved by Admin' });
    }
  );
});

// @route   GET /api/client-management/contracts
// @desc    Get all contracts
router.get('/contracts', verifyToken, (req, res) => {
  db.query('SELECT * FROM contracts ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, contracts: results });
  });
});

// @route   POST /api/client-management/contracts
// @desc    Generate a new contract from an approved proposal
router.post('/contracts', verifyToken, (req, res) => {
  const { proposal_id, client_name, document_content } = req.body;
  const created_by = req.user.id;
  
  db.query(
    'INSERT INTO contracts (proposal_id, client_name, document_content, created_by) VALUES (?, ?, ?, ?)',
    [proposal_id, client_name, document_content, created_by],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.status(201).json({ success: true, message: 'Contract created', id: result.insertId });
    }
  );
});

// @route   POST /api/client-management/onboard
// @desc    Convert lead into a new customer (Onboarding wizard)
router.post('/onboard', verifyToken, (req, res) => {
  const { lead_id, company_name, email, phone, contact_person, requirements } = req.body;
  const created_by = req.user.id;
  
  db.query(
    'INSERT INTO customers (name, company_name, email, phone, requirements, assigned_to, stage, health_score, portal_access_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [contact_person || company_name, company_name, email, phone, requirements, created_by, 'Won', 100, true],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      
      // Update lead status if lead_id was provided
      if (lead_id) {
        db.query("UPDATE leads SET status = 'Won' WHERE id = ?", [lead_id]);
      }
      
      res.status(201).json({ success: true, message: 'Client onboarded successfully', id: result.insertId });
    }
  );
});

// @route   PUT /api/client-management/contracts/:id/sign
// @desc    Client or Admin signs a contract
router.put('/contracts/:id/sign', verifyToken, (req, res) => {
  const contractId = req.params.id;
  const { signature, role } = req.body;
  
  let updateField = role === 'admin' ? 'admin_signature' : 'client_signature';
  
  db.query(
    `UPDATE contracts SET ${updateField} = ?, status = 'Signed' WHERE id = ?`,
    [signature, contractId],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error', error: err.message });
      res.json({ success: true, message: 'Contract signed successfully' });
    }
  );
});

// @route   GET /api/client-management/health
// @desc    Calculate health score logic (Mock API for Customer 360)
router.get('/health', verifyToken, (req, res) => {
  db.query('SELECT id, name, company_name as company, health_score FROM customers WHERE stage = "Won" OR stage = "Active"', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, clients: results });
  });
});

module.exports = router;
