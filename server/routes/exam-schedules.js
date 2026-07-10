const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const { verifyToken } = require('../middleware/auth');

// Get all exam schedules
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    
    const schedules = await new Promise((resolve, reject) => {
      db.query(
        `SELECT es.*, e.exam_name, ec.class_name, ec.subject_name,
                DATE_FORMAT(es.exam_date, '%Y-%m-%d') as exam_date_formatted,
                TIME_FORMAT(es.exam_time, '%H:%i') as exam_time_formatted
         FROM exam_schedules es
         LEFT JOIN exams e ON es.exam_id = e.id
         LEFT JOIN exam_classes ec ON e.exam_class_id = ec.id
         LEFT JOIN classes c ON ec.class_id = c.id
         LEFT JOIN subjects s ON ec.subject_id = s.id
         WHERE es.is_deleted = 0
         ORDER BY es.exam_date ASC, es.exam_time ASC`,
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    });
      
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching exam schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new exam schedule
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const {
      exam_id,
      exam_date,
      exam_time,
      duration,
      venue,
      instructions
    } = req.body;

    // Validate required fields
    if (!exam_id || !exam_date || !exam_time || !duration || !venue || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO exam_schedules (exam_id, exam_date, exam_time, duration, venue, instructions, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [exam_id, exam_date, exam_time, duration, venue, instructions, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    res.json({
      success: true,
      message: 'Exam schedule created successfully',
      data: { scheduleId: result.insertId }
    });
  } catch (error) {
    console.error('Error creating exam schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update exam schedule
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;
    const {
      exam_id,
      exam_date,
      exam_time,
      duration,
      venue,
      instructions
    } = req.body;

    // Validate required fields
    if (!exam_id || !exam_date || !exam_time || !duration || !venue || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'UPDATE exam_schedules SET exam_id = ?, exam_date = ?, exam_time = ?, duration = ?, venue = ?, instructions = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [exam_id, exam_date, exam_time, duration, venue, instructions, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam schedule updated successfully'
    });
  } catch (error) {
    console.error('Error updating exam schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete exam schedule
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.query('UPDATE exam_schedules SET is_deleted = 1, deleted_by = ?, deleted_at = NOW() WHERE id = ?', [req.user.id, new Date()], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam schedule not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exam schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
