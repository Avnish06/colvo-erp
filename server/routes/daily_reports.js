const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// @route   POST /api/daily-reports
// @desc    Submit a new daily report
// @access  Private
router.post('/', verifyToken, (req, res) => {
  const { workSummary, tasksCompleted, challenges, planTomorrow, mood } = req.body;
  const userId = req.user.id; // From verifyToken middleware

  if (!workSummary || workSummary.trim().split(/\s+/).length < 10) {
    return res.status(400).json({ success: false, message: 'Work summary must be at least 10 words' });
  }

  const query = `
    INSERT INTO daily_reports (user_id, work_summary, tasks_completed, challenges, plan_tomorrow, mood)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [userId, workSummary, tasksCompleted || '', challenges || '', planTomorrow || '', mood || ''];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('[Submit Daily Report] Error:', err);
      return res.status(500).json({ success: false, message: 'Server error saving report' });
    }

    res.status(201).json({
      success: true,
      message: 'Daily report submitted successfully',
      reportId: result.insertId
    });
  });
});

// @route   GET /api/daily-reports
// @desc    Get user's daily reports history
// @access  Private
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT * FROM daily_reports 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('[Get Daily Reports] Error:', err);
      return res.status(500).json({ success: false, message: 'Server error fetching reports' });
    }

    res.json({
      success: true,
      reports: results
    });
  });
});

module.exports = router;
