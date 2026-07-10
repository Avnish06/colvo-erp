const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Get all roles with permission count
router.get('/', verifyToken, (req, res) => {
  const query = `
    SELECT r.*, COUNT(rp.permission_id) as permission_count 
    FROM roles r 
    LEFT JOIN role_permissions rp ON r.id = rp.role_id 
    GROUP BY r.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching roles' });
    res.json({ success: true, data: results });
  });
});

// Create role
router.post('/', verifyToken, checkPermission('manage_settings'), (req, res) => {
  const { name, permissions } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Role name required' });

  db.query('INSERT INTO roles (name) VALUES (?)', [name], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error creating role' });

    const roleId = result.insertId;
    if (permissions && permissions.length > 0) {
      const values = permissions.map(pid => [roleId, pid]);
      db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values], (err) => {
        if (err) console.error('Error assigning permissions', err);
      });
    }
    res.json({ success: true, message: 'Role created', id: roleId });
  });
});

// Update role
router.put('/:id', verifyToken, checkPermission('manage_settings'), (req, res) => {
  const { name, permissions } = req.body;
  const { id } = req.params;

  // Prevent editing Super Admin (ID 1) unless Super Admin or Developer
  if (id == 1 && (req.user.role !== 'Super Admin' && req.user.role !== 'Developer')) {
    return res.status(403).json({ success: false, message: 'Cannot edit Super Admin role' });
  }

  db.query('UPDATE roles SET name = ? WHERE id = ?', [name, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating role' });

    // Update permissions: Delete old, Insert new
    db.query('DELETE FROM role_permissions WHERE role_id = ?', [id], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Error updating permissions' });

      if (permissions && permissions.length > 0) {
        const values = permissions.map(pid => [id, pid]);
        db.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values], (err) => {
          if (err) return res.status(500).json({ success: false, message: 'Error saving permissions' });
          res.json({ success: true, message: 'Role updated' });
        });
      } else {
        res.json({ success: true, message: 'Role updated' });
      }
    });
  });
});

// Delete role
router.delete('/:id', verifyToken, checkPermission('manage_settings'), (req, res) => {
  if (req.params.id == 1) return res.status(403).json({ success: false, message: 'Cannot delete Super Admin role' });

  db.query('DELETE FROM roles WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting role' });
    res.json({ success: true, message: 'Role deleted' });
  });
});

// Get all permissions
router.get('/permissions', verifyToken, (req, res) => {
  db.query('SELECT * FROM permissions', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching permissions' });
    res.json({ success: true, data: results });
  });
});

// Get permissions for a specific role
router.get('/:id/permissions', verifyToken, (req, res) => {
  db.query('SELECT permission_id FROM role_permissions WHERE role_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching role permissions' });
    const permissionIds = results.map(row => row.permission_id);
    res.json({ success: true, data: permissionIds });
  });
});

module.exports = router;
