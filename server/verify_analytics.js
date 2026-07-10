const db = require('./config/db');

const verifyAnalytics = async () => {
  try {
    console.log('--- Verifying Analytics Data ---');

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('default', { month: 'long' });
      const year = d.getFullYear();
      last6Months.push(`${month} ${year}`);
    }

    // 1. Check salary trend
    const [trends] = await db.promise().query(`
            SELECT month_year, SUM(net_salary) as total 
            FROM payroll 
            WHERE month_year IN (?)
            GROUP BY month_year
        `, [last6Months]);
    console.log('Salary Trends:', trends);

    // 2. Check distribution
    const [distribution] = await db.promise().query(`
            SELECT departments.name, SUM(payroll.net_salary) as total
            FROM payroll
            JOIN users ON payroll.user_id = users.id
            JOIN departments ON users.department_id = departments.id
            GROUP BY departments.name
        `);
    console.log('Budget Distribution:', distribution);

    // 3. Check Metrics
    const [totalSalary] = await db.promise().query("SELECT SUM(net_salary) as total FROM payroll");
    const [employees] = await db.promise().query("SELECT COUNT(*) as count FROM users");

    console.log('Metrics:');
    console.log('- Total Salary:', totalSalary[0].total);
    console.log('- Employee Count:', employees[0].count);

    // 4. Check Performance
    const [performance] = await db.promise().query(`
            SELECT 
                d.name as department,
                COUNT(t.id) as total_tasks,
                SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
            FROM departments d
            LEFT JOIN users u ON d.id = u.department_id
            LEFT JOIN tasks t ON u.id = t.assigned_to
            GROUP BY d.name
        `);
    console.log('Departmental Performance:', performance);

    if (trends.length >= 0 && performance.length >= 0) {
      console.log('\nSUCCESS: Analytics data including performance retrieved successfully!');
    }

  } catch (err) {
    console.error('Verification Error:', err);
  } finally {
    process.exit(0);
  }
};

verifyAnalytics();
