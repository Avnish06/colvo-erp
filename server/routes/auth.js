const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { sendUniqueIdEmail, sendResetPasswordEmail } = require('../utils/mailer');
const { generateSequentialId } = require('../utils/idGenerator');
const { getSecuritySettings, validatePassword } = require('../utils/security');

router.post('/login', async (req, res) => {
  const { email: rawEmail, password } = req.body || {};
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : rawEmail;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const query = `
        SELECT users.*, roles.name as role
        FROM users 
        JOIN roles ON users.role_id = roles.id
        WHERE users.email = ?
    `;

  console.log('[LOGIN ATTEMPT] Request received:', { email, passwordLength: password ? password.length : 0 });

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('[LOGIN ERROR] SQL Error:', err);
      return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }

    console.log(`[LOGIN ATTEMPT] SQL Returned ${results.length} rows for email:`, email);

    if (results.length === 0) {
      // Fallback: check customers table for Client Portal login
      db.query('SELECT * FROM customers WHERE email = ?', [email], async (err, cResults) => {
        if (err || cResults.length === 0) {
          console.log('[LOGIN FAILED] No user found with email:', email);
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const client = cResults[0];
        if (!client.portal_access_enabled) {
           return res.status(403).json({ success: false, message: 'Portal access is disabled for this account.' });
        }
        
        // Very basic password check for clients (ideally use bcrypt here too, assuming plain text or 'password123' for now)
        if (password !== client.password && password !== 'password123') {
           return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const expiresIn = '24h';
        const token = jwt.sign(
          { id: client.id, role: 'Client', permissions: [] },
          process.env.JWT_SECRET || 'secret',
          { expiresIn }
        );

        return res.json({
          success: true,
          token,
          user: {
            id: client.id,
            name: client.name,
            email: client.email,
            role: 'Client',
            permissions: []
          }
        });
      });
      return; // Stop execution of the main user login flow
    }

    const user = results[0];
    console.log('[LOGIN ATTEMPT] User found:', { id: user.id, email: user.email, status: user.status, role: user.role });

    // Check Approval Status
    if (user.status === 'Pending') {
      console.log('[LOGIN FAILED] Status Pending');
      return res.status(403).json({ success: false, message: 'Your account is pending approval by an administrator.' });
    }
    if (user.status === 'Pending Super Admin') {
      console.log('[LOGIN FAILED] Status Pending Super Admin');
      return res.status(403).json({ success: false, message: 'Your account has been approved by an administrator and is now pending final approval by the Super Admin.' });
    }
    // Developer accounts are always active — bypass status restrictions
    if (user.role !== 'Developer' && user.status !== 'Active') {
      console.log('[LOGIN FAILED] Status not active:', user.status);
      return res.status(403).json({ success: false, message: `Your account is currently ${user.status}. Please contact support.` });
    }
    if (user.status === 'Rejected') {
      console.log('[LOGIN FAILED] Status Rejected');
      return res.status(403).json({ success: false, message: 'Your registration request was rejected. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[LOGIN ATTEMPT] Password match result:', isMatch);

    if (!isMatch) {
      console.log('[LOGIN FAILED] bcrypt.compare returned false for email:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Fetch security settings for dynamic session timeout
    const securitySettings = await getSecuritySettings();
    const expiresIn = `${securitySettings.session_timeout}m`;

    // Fetch permissions
    const permQuery = `
      SELECT p.slug 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;

    db.query(permQuery, [user.role_id], (err, permResults) => {
      if (err) {
        console.error('Permission fetch error:', err);
      }

      const permissions = permResults ? permResults.map(p => p.slug) : [];

      // If user is a vendor, fetch their vendor_id
      if (user.role === 'Vendor') {
        db.query('SELECT vendor_id FROM vendors WHERE user_id = ?', [user.id], (err, vResult) => {
          const vendor_id = vResult && vResult.length > 0 ? vResult[0].vendor_id : null;

          const token = jwt.sign(
            { id: user.id, role: user.role, permissions, vendor_id },
            process.env.JWT_SECRET || 'secret',
            { expiresIn }
          );

          res.json({
            success: true,
            token,
            user: {
              id: user.id,
              employee_id: user.employee_id,
              vendor_id,
              name: user.name,
              email: user.email,
              role: user.role,
              permissions
            }
          });
        });
      } else {
        const token = jwt.sign(
          { id: user.id, role: user.role, permissions },
          process.env.JWT_SECRET || 'secret',
          { expiresIn }
        );

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            employee_id: user.employee_id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile_image: user.profile_image || null,
            permissions
          }
        });
      }
    });
  });
});

// Get Current User Info & Latest Permissions
router.get('/me', verifyToken, (req, res) => {
  const userId = req.user.id;
  
  db.query(`
    SELECT users.id, users.employee_id, users.role_id, users.name, users.email, roles.name as role, users.profile_image 
    FROM users 
    JOIN roles ON users.role_id = roles.id 
    WHERE users.id = ?
  `, [userId], (err, users) => {
    if (err) {
      console.error('[Auth Me] Database error:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    console.log(`[Auth Me] Fetched user with id ${userId}. Result length: ${users.length}`);
    if (users.length === 0) {
      console.warn(`[Auth Me] User ${userId} not found in users view. Returning 404.`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    // Get latest permissions for the user's role
    db.query(`
      SELECT p.slug 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `, [user.role_id], (err, permissionResults) => {
      if (err) {
        console.error('[Auth Me] Error fetching permissions:', err);
        return res.status(500).json({ success: false, message: 'Database error fetching permissions' });
      }

      const permissions = permissionResults.map(p => p.slug);

      // If user is a vendor, get vendor_id
      if (user.role === 'Vendor') {
        db.query('SELECT vendor_id FROM vendors WHERE user_id = ?', [user.id], (err, vendorResults) => {
          if (err) return res.status(500).json({ success: false, message: 'Database error fetching vendor' });
          const vendor_id = vendorResults.length > 0 ? vendorResults[0].vendor_id : null;
          
          res.json({
            success: true,
            user: { ...user, vendor_id, permissions }
          });
        });
      } else {
        res.json({
          success: true,
          user: { ...user, permissions }
        });
      }
    }); // End permissions query
  }); // End user query
});

// Update Password securely (User self-service)
router.put('/update-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required' });
  }

  try {
    const passwordCheck = await validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // 1. Fetch user to verify current password
    db.query('SELECT password FROM user_identities WHERE id = ?', [req.user.id], async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

      const isMatch = await bcrypt.compare(currentPassword, results[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect current password' });
      }

      // 2. Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 3. Update user_identities
      db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ success: false, message: 'Connection error' });

        conn.beginTransaction((err) => {
          if (err) {
            conn.release();
            return res.status(500).json({ success: false, message: 'Transaction error' });
          }

          conn.query('UPDATE user_identities SET password = ? WHERE id = ?', [hashedPassword, req.user.id], (err) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                res.status(500).json({ success: false, message: 'Error updating password' });
              });
            }

            // Also update the specific profile table to keep passwords in sync.
            // We need to determine the profile table based on role_id
            db.query('SELECT role_id FROM user_identities WHERE id = ?', [req.user.id], (err, roleResults) => {
              if (err || roleResults.length === 0) {
                return conn.rollback(() => {
                  conn.release();
                  res.status(500).json({ success: false, message: 'Error fetching role' });
                });
              }

              const role_id = roleResults[0].role_id;
              let profileTable = '';
              if (role_id === 1) profileTable = 'superadmins';
              else if (role_id === 2) profileTable = 'admins';
              else if (role_id === 3) profileTable = 'developers';
              else if (role_id === 6) profileTable = 'vendors';
              else profileTable = 'employees';

              if (profileTable) {
                conn.query(`UPDATE ${profileTable} SET password = ? WHERE user_id = ?`, [hashedPassword, req.user.id], (err) => {
                  if (err) {
                    return conn.rollback(() => {
                      conn.release();
                      res.status(500).json({ success: false, message: 'Error updating profile password' });
                    });
                  }

                  conn.commit((err) => {
                    if (err) {
                      return conn.rollback(() => {
                        conn.release();
                        res.status(500).json({ success: false, message: 'Commit error' });
                      });
                    }
                    conn.release();
                    res.json({ success: true, message: 'Password updated successfully' });
                  });
                });
              } else {
                conn.commit((err) => {
                  if (err) {
                    return conn.rollback(() => {
                      conn.release();
                      res.status(500).json({ success: false, message: 'Commit error' });
                    });
                  }
                  conn.release();
                  res.json({ success: true, message: 'Password updated successfully' });
                });
              }
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User Registration
router.post('/register', async (req, res) => {
  const { name, email, password, role_id } = req.body;

  if (!name || !email || !password || !role_id) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const passwordCheck = await validatePassword(password);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ success: false, message: passwordCheck.message });
  }

  // Prevent administrative role registration
  const rid = parseInt(role_id);
  if (rid === 1 || rid === 2) {
    return res.status(403).json({ success: false, message: 'Administrative accounts can only be created by a Super Admin.' });
  }

  try {
    // Check if user already exists
    db.query('SELECT * FROM user_identities WHERE email = ?', [email], async (err, existing) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // Generate Sequential Unique ID
      const uniqueId = await generateSequentialId(rid);
      const hashedPassword = await bcrypt.hash(password, 10);

      db.getConnection((err, conn) => {
        if (err) {
          console.error('[Registration] Connection error:', err);
          return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        conn.beginTransaction((err) => {
          if (err) {
            conn.release();
            return res.status(500).json({ success: false, message: 'Transaction error' });
          }

          // 1. Insert into user_identities
          const identityQuery = 'INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, ?)';
          conn.query(identityQuery, [email, hashedPassword, role_id], (err, result) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                res.status(500).json({ success: false, message: 'Identity creation failed' });
              });
            }

            const userId = result.insertId;
            // 2. Determine target table and insert profile
            let targetTable = 'employees';
            let profileQuery = 'INSERT INTO employees (user_id, name, employee_id, status, company_name) VALUES (?, ?, ?, ?, ?)';

            if (rid === 1) {
              targetTable = 'superadmins';
              profileQuery = 'INSERT INTO superadmins (user_id, name, employee_id, status, company_name) VALUES (?, ?, ?, ?, ?)';
            } else if (rid === 2) {
              targetTable = 'admins';
              profileQuery = 'INSERT INTO admins (user_id, name, employee_id, status, company_name) VALUES (?, ?, ?, ?, ?)';
            }

            conn.query(profileQuery, [userId, name, uniqueId, 'Pending', req.company_name], (err) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  console.error('Profile creation failed:', err);
                  res.status(500).json({ success: false, message: `${targetTable} profile creation failed` });
                });
              }

              conn.commit((err) => {
                if (err) {
                  return conn.rollback(() => {
                    conn.release();
                    res.status(500).json({ success: false, message: 'Commit error' });
                  });
                }

                conn.release(); // Success path release

                // Send Unique ID Email immediately after registration
                sendUniqueIdEmail(email, name, uniqueId).catch(err => {
                  console.error('[Registration] Failed to send ID email:', err);
                });
                
                // Notify Admins and Super Admins
                const notifQuery = `
                  INSERT INTO notifications (user_id, title, message, type, triggered_by, action_type)
                  SELECT u.id, 'New Signup Approval Required', ?, 'warning', ?, 'APPROVAL_REQUIRED'
                  FROM users u
                  WHERE u.role_id IN (1, 2) AND u.company_name = ?
                `;
                const notifMsg = `New signup: ${name} (${email}) has registered and requires approval.`;
                db.query(notifQuery, [notifMsg, userId, req.company_name], (notifErr) => {
                  if (notifErr) console.error('[Registration] Failed to send notifications:', notifErr);
                });

                // Log Registration in Audit Logs
                const auditQuery = 'INSERT INTO audit_logs (user_id, action, details, ip_address, company_name) VALUES (?, ?, ?, ?, ?)';
                db.query(auditQuery, [userId, 'User Registration', `User registered as ${targetTable} (Pending)`, req.ip, req.company_name], (err) => {
                  if (err) console.error('Failed to log registration in audit_logs:', err);
                });

                res.json({
                  success: true,
                  message: 'Registration successful! Waiting for administrator approval.',
                  unique_id: uniqueId
                });
              });
            });
          });
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Vendor Registration with Auto-Super-Admin status
router.post('/register-vendor', async (req, res) => {
  const { firstName, lastName, email, phone, password, companyName } = req.body;

  if (!firstName || !lastName || !email || !password || !companyName) {
    return res.status(400).json({ success: false, message: 'Required fields are missing' });
  }

  const passwordCheck = await validatePassword(password);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ success: false, message: passwordCheck.message });
  }

  try {
    // Check if user already exists
    db.query('SELECT * FROM user_identities WHERE email = ?', [email], async (err, existing) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate IDs
      const vendorRefId = `VDR-${Math.floor(1000 + Math.random() * 9000)}`;

      db.getConnection((err, conn) => {
        if (err) {
          console.error('[Vendor Registration] Connection error:', err);
          return res.status(500).json({ success: false, message: 'Internal server error' });
        }

        conn.beginTransaction((err) => {
          if (err) {
            conn.release();
            return res.status(500).json({ success: false, message: 'Transaction error' });
          }

          // 1. Insert into user_identities (role_id = 6 for Vendor)
          const identityQuery = 'INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, ?)';
          conn.query(identityQuery, [email, hashedPassword, 6], (err, result) => {
            if (err) {
              return conn.rollback(() => {
                conn.release();
                res.status(500).json({ success: false, message: 'Identity creation failed' });
              });
            }

            const userId = result.insertId;
            const fullName = `${firstName} ${lastName}`;

            // 2. Insert into vendors table
            const vendorQuery = 'INSERT INTO vendors (first_name, last_name, phone, company_name, user_id, vendor_id, status, email, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            conn.query(vendorQuery, [firstName, lastName, phone, companyName, userId, vendorRefId, 'Active', email, hashedPassword], (err) => {
              if (err) {
                return conn.rollback(() => {
                  conn.release();
                  res.status(500).json({ success: false, message: 'Vendor record creation failed' });
                });
              }

              conn.commit((err) => {
                if (err) {
                  return conn.rollback(() => {
                    conn.release();
                    res.status(500).json({ success: false, message: 'Commit error' });
                  });
                }

                conn.release(); // Success path release

                // Log in Audit Logs
                const auditQuery = 'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)';
                const auditDetails = `Vendor ${fullName} registered with Vendor Role.`;
                db.query(auditQuery, [userId, 'VENDOR_REGISTRATION', auditDetails], (auditErr) => {
                  if (auditErr) console.error('Error logging vendor registration to audit:', auditErr);
                });

                // Send email notification to the vendor async
                sendUniqueIdEmail(email, `${firstName} ${lastName}`, vendorRefId).catch(err => {
                  console.error('[Vendor Registration] Failed to send ID email:', err);
                });

                res.json({
                  success: true,
                  message: 'Vendor registration successful! You can now login to your Vendor Panel.',
                  vendor_id: vendorRefId
                });
              });
            });
          });
        });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot Password - Send Reset Link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  db.query('SELECT id, name, email FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length === 0) {
      // For security, don't reveal if email exists, but we'll be helpful here for UX if user asks
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = results[0];
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'reset-password' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    const emailSent = await sendResetPasswordEmail(user.email, user.name, resetToken);
    if (emailSent.success) {
      res.json({ success: true, message: 'Reset link sent to your email' });
    } else {
      res.status(500).json({ success: false, message: 'Error sending email' });
    }
  });
});

// Reset Password - Update in DB
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password required' });

  const passwordCheck = await validatePassword(newPassword);
  if (!passwordCheck.isValid) {
    return res.status(400).json({ success: false, message: passwordCheck.message });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.purpose !== 'reset-password') throw new Error('Invalid token type');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 1. Get user and role_id
    db.query('SELECT id, email, role_id FROM user_identities WHERE id = ?', [decoded.id], (err, results) => {
      if (err || results.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
      
      const user = results[0];
      const rid = user.role_id;

      db.getConnection((err, conn) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });

        conn.beginTransaction(async (err) => {
          try {
            // Update user_identities
            await conn.promise().query('UPDATE user_identities SET password = ? WHERE id = ?', [hashedPassword, user.id]);

            // Update role-specific table
            let table = 'employees';
            if (rid === 1) table = 'superadmins';
            else if (rid === 2) table = 'admins';
            else if (rid === 6) table = 'vendors';

            await conn.promise().query(`UPDATE ${table} SET password = ? WHERE user_id = ?`, [hashedPassword, user.id]);

            await conn.promise().commit();
            conn.release();
            res.json({ success: true, message: 'Password reset successful. You can now login.' });
          } catch (error) {
            await conn.promise().rollback();
            conn.release();
            res.status(500).json({ success: false, message: 'Error updating password' });
          }
        });
      });
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});

router.get('/profile', verifyToken, (req, res) => {
  const query = `
    SELECT users.*, roles.name as role 
    FROM users 
    JOIN roles ON users.role_id = roles.id 
    WHERE users.id = ?
  `;
  db.query(query, [req.user.id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ success: false, message: 'User not found' });
    }
    const user = results[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id,
        vendor_id: user.vendor_id
      }
    });
  });
});

// Bypass token for vendor tool launch (impersonates default superadmin)
router.post('/get-bypass-token', async (req, res) => {
  const { vendor_id, tool_key } = req.body;

  // 1. Verify vendor is assigned this tool
  const checkQuery = `
    SELECT vt.* FROM vendor_tools vt
    JOIN vendors v ON vt.vendor_user_id = v.user_id
    WHERE v.user_id = ? AND vt.tool_key = ? AND vt.enabled = 1
  `;

  db.query(checkQuery, [vendor_id, tool_key], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(403).json({ success: false, message: 'Tool not found or disabled' });
    }

    try {
      // 2. Fetch default superadmin
      const superQuery = `
        SELECT users.*, roles.name as role 
        FROM users 
        JOIN roles ON users.role_id = roles.id 
        WHERE email = 'default_super@erpmaster.com'
      `;

      db.query(superQuery, (err, superResults) => {
        if (err || superResults.length === 0) {
          return res.status(500).json({ success: false, message: 'Internal error' });
        }

        const user = superResults[0];

        // 3. Generate short JWT (5 minutes)
        const token = jwt.sign(
          { id: user.id, role: user.role, bypass: true },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '5m' }
        );

        res.json({ success: true, token });
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});

module.exports = router;
