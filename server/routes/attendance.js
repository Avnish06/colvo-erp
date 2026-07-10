const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get Attendance for a user
router.get('/:userId', verifyToken, (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC, clock_in DESC';
  
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    res.json({ success: true, data: results });
  });
});

// Clock In
router.post('/clock-in', verifyToken, (req, res) => {
  const { user_id, employee_name, date, clock_in, image_capture } = req.body;

  // 1. Check if already clocked in today
  const checkQuery = 'SELECT * FROM attendance WHERE user_id = ? AND date = ?';
  db.query(checkQuery, [user_id, date], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Server error' });
    if (results.length > 0) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
    }

    // 2. Check time (Must be before 10:00 AM) - TEMPORARILY DISABLED FOR TESTING
    /*
    const [hours, minutes] = clock_in.split(':').map(Number);
    if (hours >= 10) {
      return res.status(400).json({ success: false, message: 'Late! Attendance must be marked before 10:00 AM.' });
    }
    */

    // 3. Handle Image Capture
    let imageUrl = null;
    try {
      if (image_capture) {
        const base64Data = image_capture.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `attendance_${user_id}_${Date.now()}.png`;
        const uploadDir = path.join(__dirname, '../uploads/attendance');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uploadPath = path.join(uploadDir, filename);
        fs.writeFileSync(uploadPath, buffer);
        const host = req.get('host');
        imageUrl = `${req.protocol}://${host}/uploads/attendance/${filename}`;
        console.log('Image saved successfully to:', uploadPath);
      }
    } catch (imageErr) {
      console.error('Error processing/saving image:', imageErr);
      return res.status(500).json({ success: false, message: 'Error processing image: ' + imageErr.message });
    }

    const query = 'INSERT INTO attendance (user_id, employee_name, date, clock_in, image_url, status) VALUES (?, ?, ?, ?, ?, "Present")';
    db.query(query, [user_id, employee_name, date, clock_in, imageUrl], (err, result) => {
      if (err) {
        console.error('Database Error during clock-in:', err);
        return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
      }
      res.json({ success: true, message: 'Clocked in successfully', id: result.insertId });
    });
  });
});

// Ensure clock_out_image_url column exists
db.query(`ALTER TABLE attendance ADD COLUMN IF NOT EXISTS clock_out_image_url VARCHAR(255) DEFAULT NULL`, (err) => {
  if (err) console.error('[Attendance] Could not add clock_out_image_url column:', err.message);
});

// Clock Out
router.post('/clock-out', verifyToken, (req, res) => {
  const { user_id, date, clock_out, image_capture } = req.body;

  let imageUrl = null;
  try {
    if (image_capture) {
      const base64Data = image_capture.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `clockout_${user_id}_${Date.now()}.png`;
      const uploadDir = path.join(__dirname, '../uploads/attendance');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uploadPath = path.join(uploadDir, filename);
      fs.writeFileSync(uploadPath, buffer);
      const host = req.get('host');
      imageUrl = `${req.protocol}://${host}/uploads/attendance/${filename}`;
    }
  } catch (imageErr) {
    console.error('Error processing clock-out image:', imageErr);
    return res.status(500).json({ success: false, message: 'Error processing image' });
  }

  const query = 'UPDATE attendance SET clock_out = ?, clock_out_image_url = ? WHERE user_id = ? AND date = ?';
  db.query(query, [clock_out, imageUrl, user_id, date], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Error clocking out' });
    res.json({ success: true, message: 'Clocked out successfully' });
  });
});

// Get attendance for a user
router.get('/:user_id', verifyToken, (req, res) => {
  const query = 'SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC, id DESC';
  db.query(query, [req.params.user_id], (err, results) => {
    if (err) {
      console.error('Error fetching attendance for user:', err);
      return res.status(500).json({ success: false, message: 'Error fetching attendance' });
    }
    res.json({ success: true, data: results });
  });
});

// Get all attendance (Admin)
router.get('/', verifyToken, checkPermission('view_attendance'), (req, res) => {
  const query = `
        SELECT attendance.*, users.role_id 
        FROM attendance 
        LEFT JOIN users ON attendance.user_id = users.id 
        ORDER BY attendance.date DESC, attendance.id DESC
    `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching attendance:', err);
      return res.status(500).json({ success: false, message: 'Error fetching attendance' });
    }
    res.json({ success: true, data: results });
  });
});

// Update attendance record (Super Admin/Developer or Admin with override)
router.put('/:id', verifyToken, async (req, res) => {
  const { date, clock_in, clock_out, status } = req.body;
  const { id } = req.params;
  const { role } = req.user;

  try {
    // 1. Check for bypass roles
    const isElevated = role === 'Super Admin' || role === 'Developer';

    if (!isElevated) {
      console.log(`Non-elevated user attempt. Role: ${role}`);
      if (role === 'Admin') {
        const [settingsRows] = await db.promise().query('SELECT setting_value FROM system_settings WHERE setting_key = "override_attendance"');
        const canOverride = settingsRows.length > 0 && settingsRows[0].setting_value === 'true';
        console.log(`Admin override check: canOverride=${canOverride}, raw_value=${settingsRows.length > 0 ? settingsRows[0].setting_value : 'null'}`);

        if (!canOverride) {
          return res.status(403).json({ success: false, message: 'Access Denied: Attendance override is disabled.' });
        }
      } else {
        // Employees or other roles cannot edit attendance
        return res.status(403).json({ success: false, message: 'Access Denied: Insufficient Permissions' });
      }
    }

    const query = 'UPDATE attendance SET date = ?, clock_in = ?, clock_out = ?, status = ? WHERE id = ?';
    db.query(query, [date, clock_in, clock_out, status, id], (err, result) => {
      if (err) {
        console.error('Error updating attendance:', err);
        return res.status(500).json({ success: false, message: 'Error updating attendance record' });
      }
      res.json({ success: true, message: 'Attendance record updated successfully' });
    });
  } catch (err) {
    console.error('Error in attendance update:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
