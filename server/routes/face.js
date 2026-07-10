const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Ensure face_descriptor column exists in employees table
db.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS face_descriptor TEXT DEFAULT NULL`, (err) => {
  if (err) console.error('[Face] Could not add face_descriptor column:', err.message);
  else console.log('[Face] face_descriptor column ready.');
});

// POST /api/face/enroll — Save face descriptor for logged-in user
router.post('/enroll', verifyToken, (req, res) => {
  const { descriptor } = req.body;
  const userId = req.user.id;

  if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
    return res.status(400).json({ success: false, message: 'Invalid face descriptor' });
  }

  const descriptorJson = JSON.stringify(descriptor);

  db.query(
    'UPDATE employees SET face_descriptor = ? WHERE user_id = ?',
    [descriptorJson, userId],
    (err, result) => {
      if (err) {
        console.error('[Face] Error saving descriptor:', err);
        return res.status(500).json({ success: false, message: 'Error saving face data' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Employee record not found' });
      }
      res.json({ success: true, message: 'Face enrolled successfully' });
    }
  );
});

// GET /api/face/descriptor — Get stored descriptor for a user
router.get('/descriptor', verifyToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    'SELECT face_descriptor FROM employees WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error('[Face] Error fetching descriptor:', err);
        return res.status(500).json({ success: false, message: 'Error fetching face data' });
      }
      if (!results.length || !results[0].face_descriptor) {
        return res.json({ success: true, enrolled: false, descriptor: null });
      }
      try {
        const descriptor = JSON.parse(results[0].face_descriptor);
        res.json({ success: true, enrolled: true, descriptor });
      } catch (e) {
        res.status(500).json({ success: false, message: 'Corrupt face data' });
      }
    }
  );
});

module.exports = router;
