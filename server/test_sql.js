const mysql = require('mysql2');
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'management_system'
});

const query = `
    SELECT
      CONCAT('p_', p.id) as uid,
      'project' as type,
      p.id as source_id,
      p.name as title,
      p.description,
      p.deadline,
      p.status,
      NULL as assigned_to,
      NULL as assigned_name,
      NULL as project_name,
      p.created_at
    FROM projects p
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
      NULL as assigned_name,
      NULL as project_name,
      NULL as created_at
    FROM tasks t
    ORDER BY created_at DESC
`;

db.query(query, (err, results) => {
  if (err) {
    console.error('QUERY FAILED:', err.message);
    process.exit(1);
  }
  console.log('QUERY SUCCESS:', results.length, 'rows returned');
  process.exit(0);
});
