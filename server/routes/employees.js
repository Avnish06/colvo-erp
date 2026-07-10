const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { verifyToken, checkPermission } = require('../middleware/auth');
const { sendUniqueIdEmail } = require('../utils/mailer');
const { generateSequentialId } = require('../utils/idGenerator');
const { validatePassword } = require('../utils/security');

// Get all employees for dropdowns (used in project/task assignment)
router.get('/list', (req, res) => {
  const query = `
    SELECT u.id, u.name, d.name as department
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.status = 'Active'
    ORDER BY u.name ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching employee list:', err);
      return res.status(500).json({ success: false, message: 'Error fetching employees' });
    }
    res.json({ success: true, data: results });
  });
});

// Get all employees (Admin/Super Admin only)
router.get('/', verifyToken, checkPermission('view_employees'), (req, res) => {
  const query = `
        SELECT users.id, users.name, users.email, users.role_id, users.department_id, roles.name as role, departments.name as department, users.status, users.joined_at
        FROM users
        LEFT JOIN roles ON users.role_id = roles.id
        LEFT JOIN departments ON users.department_id = departments.id
    `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching employees' });
    res.json({ success: true, data: results });
  });
});

// Add new employee (role-restricted)
router.post('/', verifyToken, checkPermission('manage_users'), async (req, res) => {
  const { name, email, password, role_id, department_id } = req.body;
  const creatorRole = req.user.role; // from JWT token

  // Enforce role-based creation restrictions
  const roleId = parseInt(role_id);
  if (creatorRole === 'Admin' && ![3, 4].includes(roleId)) {
    return res.status(403).json({ success: false, message: 'Admins can only create Employee accounts (ERP or CRM).' });
  }
  // Developer can create any role — no restrictions

  // Set status based on creator's role
  // Super Admin and Developer creations are automatically Active, Admin creations are Pending (Stage 1)
  const status = (creatorRole === 'Super Admin' || creatorRole === 'Developer') ? 'Active' : 'Pending';

  const employee_id = await generateSequentialId(roleId);

  const passwordCheck = await validatePassword(password);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ success: false, message: passwordCheck.message });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ success: false, message: 'Database connection error' });

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return res.status(500).json({ success: false, message: 'Transaction error' });
      }

      // 1. Insert into user_identities
      const identityQuery = 'INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, ?)';
      connection.query(identityQuery, [email, hashedPassword, role_id], (err, result) => {
        if (err) {
          console.error('Identity creation error:', err);
          return connection.rollback(() => {
            connection.release();
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Email address already exists.' });
            res.status(500).json({ success: false, message: `Identity creation failed: ${err.message}` });
          });
        }

        const userId = result.insertId;

        // 2. Select profile table based on role
        let profileTable = 'employees';
        let profileQuery = 'INSERT INTO employees (user_id, name, employee_id, department_id, status, company_name) VALUES (?, ?, ?, ?, ?, ?)';
        let params = [userId, name, employee_id, department_id || null, status, req.company_name];

        if (roleId === 1) {
          profileTable = 'superadmins';
          const vendor_id = `VDR-${Math.floor(1000 + Math.random() * 9000)}`;
          profileQuery = 'INSERT INTO superadmins (user_id, name, employee_id, vendor_id, status, company_name) VALUES (?, ?, ?, ?, ?, ?)';
          params = [userId, name, employee_id, vendor_id, status, req.company_name];
        } else if (roleId === 2) {
          profileTable = 'admins';
          profileQuery = 'INSERT INTO admins (user_id, name, employee_id, status, company_name) VALUES (?, ?, ?, ?, ?)';
          params = [userId, name, employee_id, status, req.company_name];
        } else if (roleId === 5) {
          profileTable = 'developers';
          profileQuery = 'INSERT INTO developers (user_id, name, employee_id, status, company_name) VALUES (?, ?, ?, ?, ?)';
          params = [userId, name, employee_id, status, req.company_name];
        }

        connection.query(profileQuery, params, (err) => {
          if (err) {
            console.error('Profile creation error:', err);
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, message: `Profile creation failed in ${profileTable}: ${err.message}` });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ success: false, message: 'Commit error' });
              });
            }

            connection.release();

            // If the account is being created as Active (Super Admin/Developer), send email immediately
            if (status === 'Active') {
              sendUniqueIdEmail(email, name, employee_id).catch(err => {
                console.error('[Manual Creation] Failed to send ID email:', err);
              });
            }

            res.json({ success: true, message: `Account created with ID: ${employee_id} (Status: ${status})`, id: userId, employee_id, status });
          });
        });
      });
    });
  });
});

// Update employee
router.put('/:id', verifyToken, checkPermission('manage_users'), (req, res) => {
  const { name, email, role_id, department_id, status } = req.body;
  const userId = req.params.id;
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ success: false, message: 'Database connection error' });

    connection.beginTransaction((err) => {
      if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

      // 1. Update Identity (Email and Role if changed)
      const identityQuery = 'UPDATE user_identities SET email = ?, role_id = ? WHERE id = ?';
      connection.query(identityQuery, [email, role_id, userId], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Email address already exists.' });
            res.status(500).json({ success: false, message: 'Identity update failed' });
          });
        }

        // 2. Select profile table based on role
        let profileTable = 'employees';
        let profileQuery = 'UPDATE employees SET name = ?, department_id = ?, status = ? WHERE user_id = ?';
        let params = [name, department_id || null, status, userId];

        if (parseInt(role_id) === 1) {
          profileTable = 'superadmins';
          profileQuery = 'UPDATE superadmins SET name = ?, status = ? WHERE user_id = ?';
          params = [name, status, userId];
        } else if (parseInt(role_id) === 2) {
          profileTable = 'admins';
          profileQuery = 'UPDATE admins SET name = ?, status = ? WHERE user_id = ?';
          params = [name, status, userId];
        } else if (parseInt(role_id) === 5) {
          profileTable = 'developers';
          profileQuery = 'UPDATE developers SET name = ?, status = ? WHERE user_id = ?';
          params = [name, status, userId];
        }

        connection.query(profileQuery, params, (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, message: `Profile update failed in ${profileTable}` });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ success: false, message: 'Commit error' });
              });
            }
            connection.release();
            res.json({ success: true, message: 'Employee updated successfully' });
          });
        });
      });
    });
  });
});

// Delete employee
router.delete('/:id', verifyToken, checkPermission('manage_users'), (req, res) => {
  // Cascading deletes handle profile tables automatically
  db.query('DELETE FROM user_identities WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting user' });
    res.json({ success: true, message: 'User and linked profiles deleted successfully' });
  });
});

// Update employee role (Promote/Demote)
router.put('/:id/role', verifyToken, checkPermission('manage_users'), (req, res) => {
  // This is simplified; in a production system, we might need to move records between profile tables
  const { role_id } = req.body;
  const query = 'UPDATE user_identities SET role_id = ? WHERE id = ?';
  db.query(query, [role_id, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating role' });
    res.json({ success: true, message: 'User identity role updated successfully' });
  });
});

// Update password
router.put('/:id/password', verifyToken, async (req, res) => {
  const { password } = req.body;
  
  const passwordCheck = await validatePassword(password);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ success: false, message: passwordCheck.message });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // First figure out the user's role to update the correct profile table
    db.query('SELECT role_id FROM user_identities WHERE id = ?', [req.params.id], (err, results) => {
      if (err || results.length === 0) return res.status(500).json({ success: false, message: 'User not found' });

      const roleId = parseInt(results[0].role_id);
      let profileTable = 'employees';
      if (roleId === 1) profileTable = 'superadmins';
      else if (roleId === 2) profileTable = 'admins';
      else if (roleId === 5) profileTable = 'developers';
      else if (roleId === 6) profileTable = 'vendors';

      db.beginTransaction((err) => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        db.query('UPDATE user_identities SET password = ? WHERE id = ?', [hashedPassword, req.params.id], (err) => {
          if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Error updating identity password' }));

          db.query(`UPDATE ${profileTable} SET password = ? WHERE user_id = ?`, [hashedPassword, req.params.id], (err) => {
            if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Error updating profile password' }));

            db.commit((err) => {
              if (err) return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
              res.json({ success: true, message: 'Password updated successfully' });
            });
          });
        });
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update profile image (self-service - any authenticated user)
router.put('/:id/profile-image', verifyToken, (req, res) => {
  const { profile_image } = req.body;
  if (!profile_image) {
    return res.status(400).json({ success: false, message: 'No image provided' });
  }
  const targetId = req.params.id;
  db.query('UPDATE user_identities SET profile_image = ? WHERE id = ?', [profile_image, targetId], (err, result) => {
    if (err) {
      console.error('Error saving profile image:', err);
      return res.status(500).json({ success: false, message: 'Error saving profile image: ' + err.message });
    }
    res.json({ success: true, message: 'Profile image updated', affectedRows: result.affectedRows });
  });
});

// Get all employees and their document statuses (Admin/Super Admin only)
router.get('/docs/summary', verifyToken, (req, res) => {
  const query = `
    SELECT 
      u.id, 
      u.name, 
      u.employee_id,
      r.name as role,
      ed.doc_type,
      ed.status,
      ed.uploaded_at
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN employee_documents ed ON u.id = ed.user_id
    WHERE r.name IN ('Employee ERP', 'Employee CRM', 'Admin')
    ORDER BY u.id, ed.doc_type;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching document summary:', err);
      return res.status(500).json({ success: false, message: 'Error fetching document summary' });
    }

    const summaryMap = {};
    results.forEach(row => {
      if (!summaryMap[row.id]) {
        summaryMap[row.id] = {
          id: row.id,
          name: row.name,
          employee_id: row.employee_id,
          documents: {
            'Aadhar Card': null,
            'PAN Card': null,
            '10th Marksheet': null,
            '12th Marksheet': null,
            'Bachelor Degree': null,
            'Masters Degree': null,
            'Bank Passbook': null,
            'Passport Size Photo': null,
            'Father Aadhar Card': null
          }
        };
      }

      if (row.doc_type) {
        summaryMap[row.id].documents[row.doc_type] = {
          status: row.status,
          uploaded_at: row.uploaded_at
        };
      }
    });

    res.json({ success: true, data: Object.values(summaryMap) });
  });
});

// Get employee's uploaded documents
router.get('/:id/documents', verifyToken, (req, res) => {
  const targetId = req.params.id;
  const query = 'SELECT doc_type, doc_url, status, uploaded_at FROM employee_documents WHERE user_id = ?';
  db.query(query, [targetId], (err, results) => {
    if (err) {
      console.error('Error fetching documents:', err);
      return res.status(500).json({ success: false, message: 'Error fetching documents' });
    }
    res.json({ success: true, data: results });
  });
});

// Upload or update a document
router.post('/:id/documents', verifyToken, (req, res) => {
  const { doc_type, doc_url } = req.body;
  const targetId = req.params.id;

  if (!doc_type || !doc_url) {
    return res.status(400).json({ success: false, message: 'Document type and URL/Base64 are required' });
  }

  // Use ON DUPLICATE KEY UPDATE to allow re-uploading/updating existing documents
  // Status always resets to 'Pending' on new upload
  const query = `
    INSERT INTO employee_documents (user_id, doc_type, doc_url, status)
    VALUES (?, ?, ?, 'Pending')
    ON DUPLICATE KEY UPDATE doc_url = VALUES(doc_url), status = 'Pending', uploaded_at = CURRENT_TIMESTAMP
  `;

  db.query(query, [targetId, doc_type, doc_url], (err, result) => {
    if (err) {
      console.error('Error saving document:', err);
      return res.status(500).json({ success: false, message: 'Error saving document' });
    }
    res.json({ success: true, message: `${doc_type} uploaded successfully and is pending approval.` });
  });
});

// Update document status (Super Admin/Developer only)
router.put('/:id/documents/status', verifyToken, (req, res) => {
  const { doc_type, status } = req.body;
  const targetId = req.params.id;
  const userRole = req.user.role;

  // Explicitly restrict to Super Admin and Developer
  if (userRole !== 'Super Admin' && userRole !== 'Developer') {
    return res.status(403).json({ success: false, message: 'Only Super Admins or Developers can verify documents.' });
  }

  if (!doc_type || !status) {
    return res.status(400).json({ success: false, message: 'Document type and status are required' });
  }

  const query = 'UPDATE employee_documents SET status = ? WHERE user_id = ? AND doc_type = ?';
  db.query(query, [status, targetId, doc_type], (err, result) => {
    if (err) {
      console.error('Error updating document status:', err);
      return res.status(500).json({ success: false, message: 'Error updating status' });
    }
    res.json({ success: true, message: `Document ${status.toLowerCase()} successfully.` });
  });
});

module.exports = router;

