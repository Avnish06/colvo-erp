const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/customer_docs';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all customers
router.get('/', verifyToken, checkPermission('manage_customers'), (req, res) => {
  const { stage, assigned_to } = req.query;
  const isEmployee = req.user.role === 'Employee CRM';
  const userId = req.user.id;

  let query = `
    SELECT customers.*, users.name as assigned_to_name
    FROM customers
    LEFT JOIN users ON customers.assigned_to = users.id
    WHERE 1=1
  `;
  const params = [];

  if (isEmployee) {
    query += ' AND customers.assigned_to = ?';
    params.push(userId);
  } else if (assigned_to) {
    query += ' AND customers.assigned_to = ?';
    params.push(assigned_to);
  }

  if (stage) {
    query += ' AND customers.stage = ?';
    params.push(stage);
  }

  query += ' ORDER BY customers.created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Create new customer
router.post('/', verifyToken, checkPermission('manage_customers'), (req, res) => {
  const { lead_id, name, email, phone, company_name, requirements, stage, segmentation, assigned_to } = req.body;
  const creator_id = req.user.id;
  const isEmployee = req.user.role === 'Employee CRM';

  const finalAssignedTo = isEmployee ? creator_id : (assigned_to || creator_id);

  const query = 'INSERT INTO customers (lead_id, name, email, phone, company_name, requirements, stage, segmentation, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(query, [lead_id || null, name, email, phone, company_name, requirements, stage || 'Prospect', segmentation, finalAssignedTo], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

    // Log initial activity
    const activityQuery = 'INSERT INTO customer_interactions (customer_id, user_id, type, content) VALUES (?, ?, ?, ?)';
    db.query(activityQuery, [result.insertId, creator_id, 'Customer Created', `Customer created by ${req.user.role}`], (actErr) => {
      if (actErr) console.error('Error logging customer creation:', actErr);
    });

    // If lead_id provided, mark lead as converted
    if (lead_id) {
      db.query("UPDATE leads SET status = 'Converted' WHERE id = ?", [lead_id]);
    }

    res.json({ success: true, message: 'Customer created successfully', id: result.insertId });
  });
});

// Get customer details, interactions and documents
router.get('/:id', verifyToken, checkPermission('manage_customers'), (req, res) => {
  const isEmployee = req.user.role === 'Employee CRM';
  const customerQuery = `
    SELECT customers.*, users.name as assigned_to_name
    FROM customers
    LEFT JOIN users ON customers.assigned_to = users.id
    WHERE customers.id = ?
  `;

  db.query(customerQuery, [req.params.id], (err, customers) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (customers.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Authorization
    if (isEmployee && customers[0].assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access Denied: Not your customer' });
    }

    const interactionQuery = `
      SELECT customer_interactions.*, users.name as user_name
      FROM customer_interactions
      LEFT JOIN users ON customer_interactions.user_id = users.id
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `;

    const docQuery = `SELECT * FROM customer_documents WHERE customer_id = ? ORDER BY uploaded_at DESC`;

    db.query(interactionQuery, [req.params.id], (intErr, interactions) => {
      if (intErr) return res.status(500).json({ success: false, message: 'Database error' });

      db.query(docQuery, [req.params.id], (docErr, documents) => {
        if (docErr) return res.status(500).json({ success: false, message: 'Database error' });
        res.json({ success: true, customer: customers[0], interactions, documents });
      });
    });
  });
});

// Update customer
router.put('/:id', verifyToken, checkPermission('manage_customers'), (req, res) => {
  const { name, email, phone, company_name, requirements, stage, segmentation, assigned_to } = req.body;
  const customerId = req.params.id;
  const isEmployee = req.user.role === 'Employee CRM';

  db.query('SELECT assigned_to FROM customers WHERE id = ?', [customerId], (fetchErr, results) => {
    if (fetchErr || results.length === 0) return res.status(404).json({ success: false, message: 'Customer not found' });

    if (isEmployee && results[0].assigned_to !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access Denied' });
    }

    const finalAssignedTo = isEmployee ? req.user.id : assigned_to;

    const query = 'UPDATE customers SET name = ?, email = ?, phone = ?, company_name = ?, requirements = ?, stage = ?, segmentation = ?, assigned_to = ? WHERE id = ?';
    db.query(query, [name, email, phone, company_name, requirements, stage, segmentation, finalAssignedTo, customerId], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.json({ success: true, message: 'Customer updated successfully' });
    });
  });
});

// Delete customer - Admin only
router.delete('/:id', verifyToken, (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
    return res.status(403).json({ success: false, message: 'Access Denied: Only Admins can delete customers' });
  }

  const customerId = req.params.id;
  db.query('DELETE FROM customers WHERE id = ?', [customerId], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Customer deleted successfully' });
  });
});

// Add interaction note
router.post('/:id/interactions', verifyToken, checkPermission('manage_customers'), (req, res) => {
  const { type, content } = req.body;
  const query = 'INSERT INTO customer_interactions (customer_id, user_id, type, content) VALUES (?, ?, ?, ?)';
  db.query(query, [req.params.id, req.user.id, type || 'Note', content], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Interaction logged' });
  });
});

// Document Upload
router.post('/:id/documents', verifyToken, checkPermission('manage_customers'), upload.single('document'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { type } = req.body;
  const query = 'INSERT INTO customer_documents (customer_id, file_name, file_path, type) VALUES (?, ?, ?, ?)';
  const filePath = `uploads/customer_docs/${req.file.filename}`;

  db.query(query, [req.params.id, req.file.originalname, filePath, type || 'Other'], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Document attached successfully', filePath });
  });
});

// Delete document
router.delete('/:id/documents/:docId', verifyToken, checkPermission('manage_customers'), (req, res) => {
  const { docId } = req.params;

  // First get the file path to delete from disk
  db.query('SELECT file_path FROM customer_documents WHERE id = ?', [docId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ success: false, message: 'Document not found' });

    const filePath = results[0].file_path;

    // Delete from database
    db.query('DELETE FROM customer_documents WHERE id = ?', [docId], (delErr) => {
      if (delErr) return res.status(500).json({ success: false, message: 'Database error' });

      // Delete from file system if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ success: true, message: 'Document deleted successfully' });
    });
  });
});

module.exports = router;
