const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add created_at column to tasks if it doesn't exist
db.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, (err) => {
  if (err && !err.message.includes('Duplicate')) {
    // MySQL 5.x doesn't support IF NOT EXISTS on ALTER, try a workaround
    db.query(`SHOW COLUMNS FROM tasks LIKE 'created_at'`, (err2, rows) => {
      if (!err2 && rows.length === 0) {
        db.query(`ALTER TABLE tasks ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`, () => { });
      }
    });
  }
});

// Get all projects
router.get('/', (req, res) => {
  console.log('GET /api/projects hit');
  db.query('SELECT * FROM projects ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error in GET /api/projects:', err);
      return res.status(500).json({ success: false, message: 'Error fetching projects' });
    }
    res.json({ success: true, data: results });
  });
});

// Get unified list: projects + tasks as one flat table
router.get('/all', (req, res) => {
  console.log('GET /api/projects/all hit');
  // First check if tasks.created_at exists
  db.query(`SHOW COLUMNS FROM tasks LIKE 'created_at'`, (err, cols) => {
    const hasCreatedAt = !err && cols && cols.length > 0;
    const taskCreatedAt = hasCreatedAt ? 't.created_at' : 'NULL';
    const query = `
      SELECT
        CONCAT('p_', p.id) as uid,
        'project' as type,
        p.id as source_id,
        p.name as title,
        p.description,
        p.deadline,
        p.status,
        p.assigned_to,
        COALESCE(e1.name, a1.name, d1.name) as assigned_name,
        NULL as project_name,
        p.created_at
      FROM projects p
      LEFT JOIN employees e1 ON p.assigned_to = e1.user_id
      LEFT JOIN admins a1 ON p.assigned_to = a1.user_id
      LEFT JOIN developers d1 ON p.assigned_to = d1.user_id
      UNION ALL
      SELECT
        CONCAT('t_', t.id) as uid,
        'task' as type,
        t.id as source_id,
        t.title,
        t.description,
        t.deadline,
        t.status,
        t.assigned_to,
        COALESCE(e2.name, a2.name, d2.name) as assigned_name,
        p2.name as project_name,
        ${taskCreatedAt} as created_at
      FROM tasks t
      LEFT JOIN employees e2 ON t.assigned_to = e2.user_id
      LEFT JOIN admins a2 ON t.assigned_to = a2.user_id
      LEFT JOIN developers d2 ON t.assigned_to = d2.user_id
      LEFT JOIN projects p2 ON t.project_id = p2.id
      ORDER BY created_at DESC
    `;
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error in GET /api/projects/all:', err);
        return res.status(500).json({ success: false, message: 'Error fetching data', error: err.message });
      }
      res.json({ success: true, data: results });
    });
  });
});




// Create new project
router.post('/', (req, res) => {
  const { name, description, deadline, assigned_to } = req.body;
  db.query('INSERT INTO projects (name, description, deadline, assigned_to) VALUES (?, ?, ?, ?)', [name, description, deadline, assigned_to || null], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error creating project' });
    res.json({ success: true, message: 'Project created', id: result.insertId });
  });
});

// Get tasks for a project or user
// NOTE: Must be defined BEFORE /:id routes to avoid Express matching 'tasks' as an :id
router.get('/tasks', (req, res) => {
  const { project_id, user_id } = req.query;
  let query = 'SELECT tasks.*, users.name as assigned_name FROM tasks JOIN users ON tasks.assigned_to = users.id';
  let params = [];

  if (project_id) {
    query += ' WHERE project_id = ?';
    params.push(project_id);
  } else if (user_id) {
    query += ' WHERE assigned_to = ?';
    params.push(user_id);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching tasks' });
    res.json({ success: true, data: results });
  });
});

// Create task
router.post('/tasks', (req, res) => {
  const { project_id, assigned_to, title, description, deadline } = req.body;
  const query = 'INSERT INTO tasks (project_id, assigned_to, title, description, deadline) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [project_id, assigned_to, title, description, deadline], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error creating task' });
    res.json({ success: true, message: 'Task assigned', id: result.insertId });
  });
});

// Update task
// NOTE: Must be defined BEFORE PUT /:id to avoid 'tasks' being matched as :id
router.put('/tasks/:id', (req, res) => {
  const { title, description, deadline, status, assigned_to } = req.body;
  const query = 'UPDATE tasks SET title=?, description=?, deadline=?, status=?, assigned_to=? WHERE id=?';
  db.query(query, [title, description, deadline, status, assigned_to, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating task' });
    res.json({ success: true, message: 'Task updated' });
  });
});

// Delete task
// NOTE: Must be defined BEFORE DELETE /:id to avoid 'tasks' being matched as :id
router.delete('/tasks/:id', (req, res) => {
  db.query('DELETE FROM tasks WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting task' });
    res.json({ success: true, message: 'Task deleted' });
  });
});

// Update project
router.put('/:id', (req, res) => {
  const { name, description, deadline, status, assigned_to } = req.body;
  const query = 'UPDATE projects SET name=?, description=?, deadline=?, status=?, assigned_to=? WHERE id=?';
  db.query(query, [name, description, deadline, status, assigned_to || null, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating project' });
    res.json({ success: true, message: 'Project updated' });
  });
});

// Delete project
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM projects WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting project' });
    res.json({ success: true, message: 'Project deleted' });
  });
});

module.exports = router;
