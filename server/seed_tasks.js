const db = require('./config/db');

const seedTasks = async () => {
  try {
    console.log('--- Seeding Test Tasks ---');

    // Using Project ID 3 and User IDs 5 (Engineering) and 7 (IT)
    const tasks = [
      { project_id: 3, assigned_to: 5, title: 'Engineering Task - Done', status: 'Done' },
      { project_id: 3, assigned_to: 5, title: 'Engineering Task - Todo', status: 'Todo' },
      { project_id: 3, assigned_to: 7, title: 'IT Task - Done', status: 'Done' },
      { project_id: 3, assigned_to: 7, title: 'IT Task - In Progress', status: 'In Progress' }
    ];

    for (const t of tasks) {
      console.log(`Inserting task: ${t.title}`);
      await db.promise().query(
        'INSERT INTO tasks (project_id, assigned_to, title, status) VALUES (?, ?, ?, ?)',
        [t.project_id, t.assigned_to, t.title, t.status]
      );
    }

    console.log('SUCCESS: Seeded 4 tasks.');

  } catch (err) {
    console.error('Seeding Error:', err);
  } finally {
    process.exit(0);
  }
};

seedTasks();
