const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendUniqueIdEmail } = require('../utils/mailer');
const { validatePassword } = require('../utils/security');

// GET /api/vendors/dashboard/:userId
// Returns vendor profile + tool count for the Vendor Dashboard
router.get('/dashboard/:userId', (req, res) => {
  const { userId } = req.params;

  const vendorQuery = `
    SELECT v.*, ui.email
    FROM vendors v
    JOIN user_identities ui ON v.user_id = ui.id
    WHERE v.user_id = ?
    LIMIT 1
  `;

  db.query(vendorQuery, [userId], (err, vendorRows) => {
    if (err) {
      console.error('Vendor dashboard fetch error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching vendor data' });
    }

    if (vendorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const vendor = vendorRows[0];

    // Fetch tool count
    db.query(
      'SELECT COUNT(*) as toolCount FROM vendor_tools WHERE vendor_user_id = ? AND enabled = 1',
      [userId],
      (err, countRows) => {
        if (err) {
          console.error('Tool count error:', err);
          return res.status(500).json({ success: false, message: 'Error counting tools' });
        }

        res.json({
          success: true,
          data: {
            vendor,
            toolCount: countRows[0].toolCount
          }
        });
      }
    );
  });
});

// GET /api/vendors/tools/:userId
// Returns list of tools assigned to this vendor
router.get('/tools/:userId', (req, res) => {
  const { userId } = req.params;

  db.query(
    `SELECT vt.*, ui.email as assigned_by_email
     FROM vendor_tools vt
     LEFT JOIN user_identities ui ON vt.assigned_by = ui.id
     WHERE vt.vendor_user_id = ?
     ORDER BY vt.created_at DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Vendor tools fetch error:', err);
        return res.status(500).json({ success: false, message: 'Error fetching tools' });
      }
      res.json({ success: true, data: rows });
    }
  );
});

// GET /api/vendors/list
// Returns all vendors (Developer only)
router.get('/list', (req, res) => {
  const query = `
    SELECT v.*, ui.email,
      (SELECT COUNT(*) FROM vendor_tools vt WHERE vt.vendor_user_id = v.user_id AND vt.enabled = 1) as toolCount
    FROM vendors v
    JOIN user_identities ui ON v.user_id = ui.id
    ORDER BY v.created_at DESC
  `;
  db.query(query, (err, rows) => {
    if (err) {
      console.error('Vendor list error:', err);
      return res.status(500).json({ success: false, message: 'Error fetching vendors' });
    }
    res.json({ success: true, data: rows });
  });
});

// POST /api/vendors/tools
// Developer assigns a tool to a vendor
router.post('/tools', (req, res) => {
  const { vendor_user_id, tool_name, tool_key, description, icon, tool_url, assigned_by } = req.body;

  if (!vendor_user_id || !tool_name || !tool_key) {
    return res.status(400).json({ success: false, message: 'vendor_user_id, tool_name, and tool_key are required' });
  }

  // Check duplicate
  db.query(
    'SELECT id FROM vendor_tools WHERE vendor_user_id = ? AND tool_key = ?',
    [vendor_user_id, tool_key],
    (err, existing) => {
      if (err) return res.status(500).json({ success: false, message: 'DB error' });
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'This tool is already assigned to this vendor' });
      }

      db.query(
        'INSERT INTO vendor_tools (vendor_user_id, tool_name, tool_key, description, icon, tool_url, enabled, assigned_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
        [vendor_user_id, tool_name, tool_key, description || '', icon || 'Box', tool_url || null, assigned_by || null],
        (err, result) => {
          if (err) {
            console.error('Tool assign error:', err);
            return res.status(500).json({ success: false, message: 'Error assigning tool' });
          }
          res.json({ success: true, message: 'Tool assigned successfully', id: result.insertId });
        }
      );
    }
  );
});


// DELETE /api/vendors/tools/:id
// Developer removes a tool from a vendor
router.delete('/tools/:id', (req, res) => {
  db.query('DELETE FROM vendor_tools WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error('Tool delete error:', err);
      return res.status(500).json({ success: false, message: 'Error removing tool' });
    }
    res.json({ success: true, message: 'Tool removed successfully' });
  });
});

// PUT /api/vendors/tools/:id/toggle
// Toggle tool enabled/disabled
router.put('/tools/:id/toggle', (req, res) => {
  db.query(
    'UPDATE vendor_tools SET enabled = NOT enabled WHERE id = ?',
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Error toggling tool' });
      res.json({ success: true, message: 'Tool status toggled' });
    }
  );
});

// =====================================================================
// GLOBAL TOOL REPOSITORY (Developer Only)
// =====================================================================

// GET /api/vendors/available-tools
router.get('/available-tools', (req, res) => {
  db.query('SELECT * FROM available_tools ORDER BY tool_name ASC', (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error' });
    res.json({ success: true, data: rows });
  });
});

// POST /api/vendors/available-tools
router.post('/available-tools', (req, res) => {
  const { tool_name, tool_key, description, icon, tool_url } = req.body;
  db.query(
    'INSERT INTO available_tools (tool_name, tool_key, description, icon, tool_url) VALUES (?, ?, ?, ?, ?)',
    [tool_name, tool_key, description, icon || 'Package', tool_url || null],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Tool already exists or DB error' });
      res.json({ success: true, id: result.insertId });
    }
  );
});

// DELETE /api/vendors/available-tools/:id
// Cascades: removes the tool from ALL vendors before deleting from the global repository
router.delete('/available-tools/:id', (req, res) => {
  // Step 1: find the tool_key for this tool
  db.query('SELECT tool_key FROM available_tools WHERE id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'DB error looking up tool' });
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tool not found' });

    const { tool_key } = rows[0];

    // Step 2: delete from all vendor_tools with matching tool_key
    db.query('DELETE FROM vendor_tools WHERE tool_key = ?', [tool_key], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Error removing tool from vendors' });

      // Step 3: delete from global repository
      db.query('DELETE FROM available_tools WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'DB error deleting tool' });
        res.json({ success: true, message: 'Tool deleted from repository and all vendors' });
      });
    });
  });
});

// =====================================================================
// MANUAL VENDOR ONBOARDING (Developer Only)
// =====================================================================

// POST /api/vendors/create-manual
router.post('/create-manual', async (req, res) => {
  const { email, password, company_name, first_name, last_name, phone } = req.body;

  if (!email || !password || !company_name) {
    return res.status(400).json({ success: false, message: 'Email, password, and company name required' });
  }

  try {
    // Check if email already exists
    db.query('SELECT * FROM user_identities WHERE email = ?', [email], async (err, existing) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      const passwordCheck = await validatePassword(password);
      if (!passwordCheck.isValid) {
        return res.status(400).json({ success: false, message: passwordCheck.message });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.beginTransaction((err) => {
        if (err) return res.status(500).json({ success: false, message: 'Transaction error' });

        // 1. Create Identity (Role 6 = Vendor)
        db.query(
          'INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, 6)',
          [email, hashedPassword],
          (err, result) => {
            if (err) {
              return db.rollback(() => res.status(400).json({ success: false, message: 'Email already exists' }));
            }

            const userId = result.insertId;
            const vendorId = `VEND-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // 2. Create Vendor Profile
            db.query(
              'INSERT INTO vendors (user_id, vendor_id, password, company_name, email, first_name, last_name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [userId, vendorId, password, company_name, email, first_name || '', last_name || '', phone || '', 'Active'],
              (err) => {
                if (err) {
                  return db.rollback(() => res.status(500).json({ success: false, message: 'Profile creation error' }));
                }

                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => res.status(500).json({ success: false, message: 'Commit error' }));
                  }

                  // Send email notification to the vendor async
                  sendUniqueIdEmail(email, `${first_name} ${last_name}`, vendorId).catch(err => {
                    console.error('[Manual Vendor Creation] Failed to send ID email:', err);
                  });

                  res.json({ success: true, message: 'Vendor created successfully', vendor_id: vendorId });
                });
              }
            );
          }
        );
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
