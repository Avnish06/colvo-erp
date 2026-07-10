const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const { verifyToken } = require('../middleware/auth');

// Get all grades
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    
    const grades = await new Promise((resolve, reject) => {
      db.query(
        'SELECT g.*, s.name as subject_name, ec.class_name, c.course_name FROM grades g LEFT JOIN subjects s ON g.subject_id = s.id LEFT JOIN exam_classes ec ON g.exam_class_id = ec.id LEFT JOIN classes c ON ec.class_id = c.id WHERE g.is_deleted = 0 ORDER BY g.grade_name ASC',
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    });
      
    res.json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new grade
router.post('/', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const {
      grade_name,
      grade_point,
      min_marks,
      max_marks,
      subject_id,
      exam_class_id
    } = req.body;

    // Validate required fields
    if (!grade_name || !grade_point || !min_marks || !max_marks || !subject_id || !exam_class_id) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO grades (grade_name, grade_point, min_marks, max_marks, subject_id, exam_class_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [grade_name, grade_point, min_marks, max_marks, subject_id, exam_class_id, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    res.json({
      success: true,
      message: 'Grade created successfully',
      data: { gradeId: result.insertId }
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update grade
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;
    const {
      grade_name,
      grade_point,
      min_marks,
      max_marks,
      subject_id,
      exam_class_id
    } = req.body;

    // Validate required fields
    if (!grade_name || !grade_point || !min_marks || !max_marks || !subject_id || !exam_class_id) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const result = await new Promise((resolve, reject) => {
      db.query(
        'UPDATE grades SET grade_name = ?, grade_point = ?, min_marks = ?, max_marks = ?, subject_id = ?, exam_class_id = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [grade_name, grade_point, min_marks, max_marks, subject_id, exam_class_id, req.user.id, new Date()],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    res.json({
      success: true,
      message: 'Grade updated successfully'
    });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete grade
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const db = require('../config/db');
    const { id } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.query('UPDATE grades SET is_deleted = 1, deleted_by = ?, deleted_at = NOW() WHERE id = ?', [req.user.id, new Date()], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
