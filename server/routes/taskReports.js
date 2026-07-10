const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/task-reports directory exists
const uploadDir = path.join(__dirname, '../../uploads/task-reports');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Ensure table exists
db.query(`CREATE TABLE IF NOT EXISTS task_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  screenshots TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) console.error('Error creating task_reports table:', err);
});

// POST /api/task-reports — Employee submits a report
router.post('/', verifyToken, upload.array('screenshots', 10), (req, res) => {
  const { task_id, content } = req.body;
  const user_id = req.user.id;

  if (!task_id || !content) {
    return res.status(400).json({ success: false, message: 'task_id and content are required' });
  }

  const screenshotPaths = req.files
    ? JSON.stringify(req.files.map(f => `/uploads/task-reports/${f.filename}`))
    : null;

  db.query(
    'INSERT INTO task_reports (task_id, user_id, content, screenshots) VALUES (?, ?, ?, ?)',
    [task_id, user_id, content, screenshotPaths],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error saving report' });
      res.json({ success: true, message: 'Report submitted successfully', id: result.insertId });
    }
  );
});

// GET /api/task-reports — Admin/Developer/Super Admin views all reports
router.get('/', verifyToken, (req, res) => {
  const allowedRoles = ['Admin', 'Super Admin', 'Developer'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const query = `
    SELECT tr.*, u.name as employee_name,
           t.title as task_title,
           p.name as project_name
    FROM task_reports tr
    LEFT JOIN users u ON tr.user_id = u.id
    LEFT JOIN tasks t ON tr.task_id = t.id
    LEFT JOIN projects p ON t.project_id = p.id
    ORDER BY tr.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching reports' });
    res.json({ success: true, data: results });
  });
});

// GET /api/task-reports/task/:taskId — Get reports for a specific task
router.get('/task/:taskId', verifyToken, (req, res) => {
  const query = `
    SELECT tr.*, u.name as employee_name
    FROM task_reports tr
    LEFT JOIN users u ON tr.user_id = u.id
    WHERE tr.task_id = ?
    ORDER BY tr.created_at DESC
  `;
  db.query(query, [req.params.taskId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching reports' });
    res.json({ success: true, data: results });
  });
});

module.exports = router;
