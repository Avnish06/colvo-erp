const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const { verifyToken } = require('../middleware/auth');

// Get all exams
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    
    const exams = await new Promise((resolve, reject) => {
      db.query(
        `SELECT e.*, ec.exam_name, ec.class_name, ec.subject_name,
                c.first_name, c.last_name, c.email as student_email,
                es.status, es.total_marks, es.grade,
                DATE_FORMAT(e.exam_date, '%Y-%m-%d') as exam_date_formatted,
                TIME_FORMAT(e.exam_time, '%H:%i') as exam_time_formatted
         FROM exams e
         LEFT JOIN exam_classes ec ON e.exam_class_id = ec.id
         LEFT JOIN classes c ON ec.class_id = c.id
         LEFT JOIN subjects s ON ec.subject_id = s.id
         LEFT JOIN students st ON e.student_id = st.id
         WHERE e.is_deleted = 0
         ORDER BY e.exam_date DESC, e.exam_time DESC`,
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    });
      
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new exam
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const {
      exam_name,
      exam_class_id,
      subject_id,
      exam_date,
      exam_time,
      total_marks,
      passing_marks
    } = req.body;

    // Validate required fields
    if (!exam_name || !exam_class_id || !subject_id || !exam_date || !exam_time || !total_marks || !passing_marks) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Check if class exists
    const classCheck = await new Promise((resolve, reject) => {
      db.query('SELECT id FROM classes WHERE id = ?', [exam_class_id], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (classCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Class not found'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO exams (exam_name, exam_class_id, subject_id, exam_date, exam_time, total_marks, passing_marks, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [exam_name, exam_class_id, subject_id, exam_date, exam_time, total_marks, passing_marks, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    res.json({
      success: true,
      message: 'Exam created successfully',
      data: { examId: result.insertId }
    });
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update exam
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;
    const {
      exam_name,
      exam_class_id,
      subject_id,
      exam_date,
      exam_time,
      total_marks,
      passing_marks
    } = req.body;

    // Validate required fields
    if (!exam_name || !exam_class_id || !subject_id || !exam_date || !exam_time || !total_marks || !passing_marks) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'UPDATE exams SET exam_name = ?, exam_class_id = ?, subject_id = ?, exam_date = ?, exam_time = ?, total_marks = ?, passing_marks = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [exam_name, exam_class_id, subject_id, exam_date, exam_time, total_marks, passing_marks, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam updated successfully'
    });
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete exam
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.query('UPDATE exams SET is_deleted = 1, deleted_by = ?, deleted_at = NOW() WHERE id = ?', [req.user.id, new Date()], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get exam classes
router.get('/classes', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    
    const classes = await new Promise((resolve, reject) => {
      db.query(
        `SELECT c.*, 
                DATE_FORMAT(c.created_at, '%Y-%m-%d') as created_date,
                (SELECT COUNT(*) FROM exams e WHERE e.exam_class_id = c.id AND e.is_deleted = 0) as exam_count
         FROM classes c
         WHERE c.is_deleted = 0
         ORDER BY c.created_at DESC`,
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    });
      
    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching exam classes:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get subjects
router.get('/subjects', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    
    const subjects = await new Promise((resolve, reject) => {
      db.query('SELECT id, name FROM subjects WHERE is_deleted = 0 ORDER BY name', (err, results) => {
        if (err) reject(err);
        resolve(results);
      });
    });
      
    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
