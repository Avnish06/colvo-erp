const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get Dashboard Stats
router.get('/stats', verifyToken, (req, res) => {
  const queries = {
    totalEmployees: "SELECT COUNT(*) as count FROM users WHERE company_name = ?",
    totalAdmins: "SELECT COUNT(*) as count FROM users JOIN roles ON users.role_id = roles.id WHERE roles.name = 'Admin' AND users.company_name = ?",
    totalDepartments: "SELECT COUNT(*) as count FROM departments",
    pendingLeaves: "SELECT COUNT(*) as count FROM leave_requests WHERE status = 'Pending' AND company_name = ?",
    activeProjects: "SELECT COUNT(*) as count FROM projects WHERE status = 'Ongoing' AND company_name = ?",
    payrollTotal: "SELECT SUM(net_salary) as total FROM payroll WHERE company_name = ?",
    unreadCount: "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE AND company_name = ?"
  };

  const executeQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) return reject(err);
        resolve(result[0]);
      });
    });
  };

  Promise.all([
    executeQuery(queries.totalEmployees, [req.company_name]),
    executeQuery(queries.totalAdmins, [req.company_name]),
    executeQuery(queries.totalDepartments), // Assuming departments are shared or not yet scoped
    executeQuery(queries.pendingLeaves, [req.company_name]),
    executeQuery(queries.activeProjects, [req.company_name]),
    executeQuery(queries.payrollTotal, [req.company_name]),
    executeQuery(queries.unreadCount, [req.user.id, req.company_name])
  ])
    .then(([employees, admins, departments, leaves, projects, payroll, notifs]) => {
      res.json({
        success: true,
        data: {
          totalEmployees: employees.count,
          totalAdmins: admins.count,
          totalDepartments: departments.count,
          pendingLeaves: leaves.count,
          activeProjects: projects.count,
          payrollTotal: payroll.total || 0,
          unreadCount: notifs.count
        }
      });
    })
    .catch(err => {
      console.error('[DASHBOARD STATS ERROR]:', err);
      res.status(500).json({ success: false, error: 'Database error', details: err.message });
    });
});

// Get Analytics Data - Salary Trends & Distribution
router.get('/analytics/expenditure', (req, res) => {
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    last6Months.push(`${month} ${year}`);
  }

  const queries = {
    salaryTrend: `
      SELECT month_year, SUM(net_salary) as total 
      FROM payroll 
      WHERE month_year IN (?)
      GROUP BY month_year
    `,
    budgetDistribution: `
      SELECT departments.name, SUM(payroll.net_salary) as total
      FROM payroll
      JOIN users ON payroll.user_id = users.id
      JOIN departments ON users.department_id = departments.id
      GROUP BY departments.name
    `,
    deptPerformance: `
      SELECT 
        d.name as department,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      LEFT JOIN tasks t ON u.id = t.assigned_to
      GROUP BY d.name
    `,
    totalSalary: "SELECT SUM(net_salary) as total FROM payroll",
    totalEmployees: "SELECT COUNT(*) as count FROM users"
  };

  const executeQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.query(query, params, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  Promise.all([
    executeQuery(queries.salaryTrend, [last6Months]),
    executeQuery(queries.budgetDistribution),
    executeQuery(queries.totalSalary),
    executeQuery(queries.totalEmployees),
    executeQuery(queries.deptPerformance)
  ])
    .then(([trends, distribution, totalSalary, employees, performance]) => {
      const trendData = last6Months.map(m => {
        const found = trends.find(t => t.month_year === m);
        return {
          month: m.split(' ')[0],
          total: found ? parseFloat(found.total) : 0
        };
      });

      const totalBudget = distribution.reduce((sum, item) => sum + parseFloat(item.total), 0);
      const distributionData = distribution.map(item => ({
        label: item.name,
        val: totalBudget > 0 ? Math.round((parseFloat(item.total) / totalBudget) * 100) : 0,
        color: 'blue'
      }));

      const performanceData = performance.map(p => ({
        department: p.department,
        val: p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0
      }));

      const totalOverallTasks = performance.reduce((sum, p) => sum + p.total_tasks, 0);
      const totalOverallCompleted = performance.reduce((sum, p) => sum + p.completed_tasks, 0);
      const avgPerf = totalOverallTasks > 0 ? Math.round((totalOverallCompleted / totalOverallTasks) * 100) : 0;

      res.json({
        success: true,
        data: {
          metrics: [
            { label: 'Total Salary Paid', value: `₹${(totalSalary[0].total || 0).toLocaleString()}`, trend: '+0%', isUp: true, icon: 'DollarSign', color: 'blue' },
            { label: 'Avg Dept. Performance', value: `${avgPerf}%`, trend: '+0%', isUp: true, icon: 'TrendingUp', color: 'green' },
            { label: 'Active Employees', value: employees[0].count.toString(), trend: '+0%', isUp: true, icon: 'Users', color: 'indigo' },
          ],
          salaryTrend: trendData,
          distribution: distributionData,
          performance: performanceData
        }
      });
    })
    .catch(err => {
      console.error('Error fetching analytics:', err);
      res.status(500).json({ success: false, error: 'Database error' });
    });
});

// ============ Dashboard Graph Data (Weekly / Monthly / Yearly) ============
router.get('/graph-data', verifyToken, (req, res) => {
  const period = req.query.period || 'monthly';

  let userGroupBy, userLabel, userRange;
  if (period === 'weekly') {
    userGroupBy = "WEEK(joined_at, 1)";
    userLabel = "CONCAT('W', LPAD(WEEK(joined_at, 1), 2, '0'))";
    userRange = "joined_at >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)";
  } else if (period === 'yearly') {
    userGroupBy = "YEAR(joined_at)";
    userLabel = "YEAR(joined_at)";
    userRange = "joined_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
  } else {
    userGroupBy = "DATE_FORMAT(joined_at, '%Y-%m')";
    userLabel = "DATE_FORMAT(joined_at, '%b %Y')";
    userRange = "joined_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
  }

  let payrollGroupBy, payrollLabel, payrollRange;
  if (period === 'weekly') {
    payrollGroupBy = "WEEK(payment_date, 1)";
    payrollLabel = "CONCAT('W', LPAD(WEEK(payment_date, 1), 2, '0'))";
    payrollRange = "payment_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)";
  } else if (period === 'yearly') {
    payrollGroupBy = "YEAR(payment_date)";
    payrollLabel = "YEAR(payment_date)";
    payrollRange = "payment_date >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
  } else {
    payrollGroupBy = "DATE_FORMAT(payment_date, '%Y-%m')";
    payrollLabel = "DATE_FORMAT(payment_date, '%b %Y')";
    payrollRange = "payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
  }

  let leaveGroupBy, leaveLabel, leaveRange;
  if (period === 'weekly') {
    leaveGroupBy = "WEEK(created_at, 1)";
    leaveLabel = "CONCAT('W', LPAD(WEEK(created_at, 1), 2, '0'))";
    leaveRange = "created_at >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)";
  } else if (period === 'yearly') {
    leaveGroupBy = "YEAR(created_at)";
    leaveLabel = "YEAR(created_at)";
    leaveRange = "created_at >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
  } else {
    leaveGroupBy = "DATE_FORMAT(created_at, '%Y-%m')";
    leaveLabel = "DATE_FORMAT(created_at, '%b %Y')";
    leaveRange = "created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
  }

  let taskGroupBy, taskLabel, taskRange;
  if (period === 'weekly') {
    taskGroupBy = "WEEK(deadline, 1)";
    taskLabel = "CONCAT('W', LPAD(WEEK(deadline, 1), 2, '0'))";
    taskRange = "deadline >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)";
  } else if (period === 'yearly') {
    taskGroupBy = "YEAR(deadline)";
    taskLabel = "YEAR(deadline)";
    taskRange = "deadline >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)";
  } else {
    taskGroupBy = "DATE_FORMAT(deadline, '%Y-%m')";
    taskLabel = "DATE_FORMAT(deadline, '%b %Y')";
    taskRange = "deadline >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
  }

  const queries = {
    employeeGrowth: `
      SELECT ${userLabel} as label, COUNT(*) as value
      FROM users
      WHERE ${userRange}
      GROUP BY ${userGroupBy}, ${userLabel}
      ORDER BY MIN(joined_at)
    `,
    payrollTrend: `
      SELECT ${payrollLabel} as label, SUM(net_salary) as value
      FROM payroll
      WHERE ${payrollRange}
      GROUP BY ${payrollGroupBy}, ${payrollLabel}
      ORDER BY MIN(payment_date)
    `,
    leaveRequests: `
      SELECT ${leaveLabel} as label, COUNT(*) as value
      FROM leave_requests
      WHERE ${leaveRange}
      GROUP BY ${leaveGroupBy}, ${leaveLabel}
      ORDER BY MIN(created_at)
    `,
    taskActivity: `
      SELECT ${taskLabel} as label, COUNT(*) as value
      FROM tasks
      WHERE ${taskRange}
      GROUP BY ${taskGroupBy}, ${taskLabel}
      ORDER BY MIN(deadline)
    `
  };

  const executeQuery = (query) => {
    return new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  Promise.all([
    executeQuery(queries.employeeGrowth),
    executeQuery(queries.payrollTrend),
    executeQuery(queries.leaveRequests),
    executeQuery(queries.taskActivity)
  ])
    .then(([employees, payroll, leaves, tasks]) => {
      const format = (rows) => rows.map(r => ({
        label: String(r.label),
        value: parseFloat(r.value) || 0
      }));

      res.json({
        success: true,
        data: {
          employeeGrowth: format(employees),
          payrollTrend: format(payroll),
          leaveRequests: format(leaves),
          taskActivity: format(tasks)
        }
      });
    })
    .catch(err => {
      console.error('Error fetching graph data:', err);
      res.status(500).json({ success: false, error: 'Database error' });
    });
});

module.exports = router;
