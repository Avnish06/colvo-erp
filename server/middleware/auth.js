const jwt = require('jsonwebtoken');
const db = require('../config/db');

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ success: false, message: 'Access Denied' });

  try {
    const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');
    req.user = verified;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session Expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid Token' });
  }
};

const checkPermission = (permissionSlug) => {
  return (req, res, next) => {
    // No bypass for Developer or Super Admin - strictly enforce database permissions

    const query = `
      SELECT p.slug 
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = ? AND p.slug = ?
    `;

    db.query(query, [req.user.id, permissionSlug], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Server error checking permissions' });

      if (results.length > 0) {
        next();
      } else {
        return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Permissions' });
      }
    });
  };
};

module.exports = { verifyToken, checkPermission };
