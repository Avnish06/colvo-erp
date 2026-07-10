const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const { verifyToken } = require('../middleware/auth');

// Get all results
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    
    const results = await new Promise((resolve, reject) => {
      db.query(
        `SELECT r.*, e.exam_name, ec.class_name, ec.subject_name,
                c.first_name, c.last_name, c.email as student_email,
                DATE_FORMAT(r.exam_date, '%Y-%m-%d') as exam_date_formatted,
                TIME_FORMAT(r.exam_time, '%H:%i') as exam_time_formatted
         FROM exam_results r
         LEFT JOIN exams e ON r.exam_id = e.id
         LEFT JOIN exam_classes ec ON e.exam_class_id = ec.id
         LEFT JOIN classes c ON ec.class_id = c.id
         LEFT JOIN subjects s ON ec.subject_id = s.id
         LEFT JOIN students st ON r.student_id = st.id
         WHERE r.is_deleted = 0
         ORDER BY r.exam_date DESC, r.exam_time DESC`,
        (err, results_data) => {
          if (err) reject(err);
          resolve(results_data);
        }
      );
    });
      
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new result
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const {
      exam_id,
      student_id,
      total_marks,
      obtained_marks,
      grade,
      status
    } = req.body;

    // Validate required fields
    if (!exam_id || !student_id || !total_marks || !obtained_marks || !grade || !status) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO exam_results (exam_id, student_id, total_marks, obtained_marks, grade, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [exam_id, student_id, total_marks, obtained_marks, grade, status, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    res.json({
      success: true,
      message: 'Result created successfully',
      data: { resultId: result.insertId }
    });
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update result
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;
    const {
      exam_id,
      student_id,
      total_marks,
      obtained_marks,
      grade,
      status
    } = req.body;

    // Validate required fields
    if (!exam_id || !student_id || !total_marks || !obtained_marks || !grade || !status) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'UPDATE exam_results SET exam_id = ?, student_id = ?, total_marks = ?, obtained_marks = ?, grade = ?, status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [exam_id, student_id, total_marks, obtained_marks, grade, status, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    res.json({
      success: true,
      message: 'Result updated successfully'
    });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete result
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.query('UPDATE exam_results SET is_deleted = 1, deleted_by = ?, deleted_at = NOW() WHERE id = ?', [req.user.id, new Date()], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
