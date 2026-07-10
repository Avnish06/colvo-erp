/**
 * Seed historical data for dashboard graphs
 * Adds realistic past records to users, payroll, leave_requests, and tasks tables
 */
const db = require('./config/db');

const run = () => {
  const queries = [];

  // Helper: random int between min and max
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Get existing user IDs first
  db.query('SELECT id FROM users LIMIT 10', (err, users) => {
    if (err) { console.error('Error:', err.message); process.exit(1); }

    const userIds = users.map(u => u.id);
    if (userIds.length === 0) {
      console.log('No users found — skipping seed.');
      process.exit(0);
    }

    const allQueries = [];

    // 1. Seed payroll records for last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthYear = d.toLocaleString('default', { month: 'long' }) + ' ' + d.getFullYear();
      const paymentDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-28`;

      userIds.forEach(uid => {
        const basic = rand(30000, 60000);
        const hra = Math.round(basic * 0.2);
        const da = Math.round(basic * 0.1);
        const bonus = rand(0, 5000);
        const deductions = rand(2000, 8000);
        const net = basic + hra + da + bonus - deductions;

        allQueries.push(`INSERT IGNORE INTO payroll (user_id, basic_salary, hra, da, bonus, deductions, net_salary, month_year, payment_date) VALUES (${uid}, ${basic}, ${hra}, ${da}, ${bonus}, ${deductions}, ${net}, '${monthYear}', '${paymentDate}')`);
      });
    }

    // 2. Seed leave requests for last 12 months
    const leaveTypes = ['Sick Leave', 'Casual Leave', 'Earned Leave', 'Personal Leave'];
    for (let i = 11; i >= 0; i--) {
      const numLeaves = rand(1, 5);
      for (let j = 0; j < numLeaves; j++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        d.setDate(rand(1, 28));
        const startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const endD = new Date(d);
        endD.setDate(endD.getDate() + rand(1, 3));
        const endDate = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}-${String(endD.getDate()).padStart(2, '0')}`;
        const uid = userIds[rand(0, userIds.length - 1)];
        const lt = leaveTypes[rand(0, leaveTypes.length - 1)];
        const status = ['Pending', 'Approved', 'Rejected'][rand(0, 2)];
        const createdAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(Math.max(1, d.getDate() - 2)).padStart(2, '0')}`;

        allQueries.push(`INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status, created_at) VALUES (${uid}, '${lt}', '${startDate}', '${endDate}', 'Personal reason', '${status}', '${createdAt}')`);
      }
    }

    // 3. Seed tasks with deadlines spread over last 12 months
    db.query('SELECT id FROM projects LIMIT 5', (err2, projects) => {
      const projIds = (projects || []).map(p => p.id);
      const defaultProjId = projIds.length > 0 ? projIds[0] : 1;

      for (let i = 11; i >= 0; i--) {
        const numTasks = rand(2, 7);
        for (let j = 0; j < numTasks; j++) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          d.setDate(rand(1, 28));
          const deadline = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const uid = userIds[rand(0, userIds.length - 1)];
          const pid = projIds.length > 0 ? projIds[rand(0, projIds.length - 1)] : defaultProjId;
          const status = ['Todo', 'In Progress', 'Done'][rand(0, 2)];
          const title = `Task ${j + 1} for month ${12 - i}`;

          allQueries.push(`INSERT INTO tasks (project_id, assigned_to, title, description, deadline, status) VALUES (${pid}, ${uid}, '${title}', 'Auto-generated task', '${deadline}', '${status}')`);
        }
      }

      // Execute all queries
      let completed = 0;
      let errors = 0;
      console.log(`Running ${allQueries.length} insert queries...`);

      allQueries.forEach((q, idx) => {
        db.query(q, (err) => {
          if (err) errors++;
          completed++;
          if (completed === allQueries.length) {
            console.log(`Done! Inserted ${completed - errors} records (${errors} errors/duplicates).`);
            process.exit(0);
          }
        });
      });
    });
  });
};

run();
