const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const projectRoutes = require('./routes/projects');
const settingsRoutes = require('./routes/settings');
const auditRoutes = require('./routes/audit');
const usersRoutes = require('./routes/users');
const vendorRoutes = require('./routes/vendors');
const reportsRoutes = require('./routes/reports');
const chatbotRoutes = require('./routes/chatbot');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Global Company Middleware
app.use((req, res, next) => {
  req.company_name = req.headers['x-company-name'] || 'Hatbaliya';
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/policies', require('./routes/policies'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/deductions', require('./routes/deductions'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/expenditures', require('./routes/expenditures'));
app.use('/api/employee-stats', require('./routes/employeeStats'));
app.use('/api/daily-reports', require('./routes/daily_reports'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/offboarding', require('./routes/offboarding'));
app.use('/api/search', require('./routes/search'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/deals', require('./routes/deals'));
app.use('/api/communication', require('./routes/communication'));
app.use('/api/crm-dashboard', require('./routes/crmDashboard'));
app.use('/api/crm-reports', require('./routes/crmReports'));
app.use('/api/task-reports', require('./routes/taskReports'));
app.use('/api/client-management', require('./routes/clientManagement'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/exam-schedules', require('./routes/exam-schedules'));
app.use('/api/results', require('./routes/results'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/face', require('./routes/face'));
app.use('/api/wfh', require('./routes/wfh'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/leaves', require('./routes/leaves'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conflicting explicit string removed to allow React's dist/index.html to render on the root domain

// Automated Background Job: Clean up unresponded pending registrations older than 7 days
setInterval(() => {
  console.log('[Cron] Running daily cleanup of stale pending registrations...');

  // Clean up users
  db.query(`
    DELETE FROM user_identities 
    WHERE id IN (
      SELECT id FROM (
        SELECT ui.id 
        FROM user_identities ui
        LEFT JOIN employees em ON ui.id = em.user_id
        LEFT JOIN superadmins sa ON ui.id = sa.user_id
        LEFT JOIN admins ad ON ui.id = ad.user_id
        LEFT JOIN developers dev ON ui.id = dev.user_id
        WHERE COALESCE(sa.status, ad.status, em.status, dev.status) IN ('Pending', 'Pending Super Admin')
        AND ui.created_at < NOW() - INTERVAL 7 DAY
      ) as subquery
    )
  `, (err, res) => {
    if (err) console.error('[Cron] Error cleaning stale users:', err);
    else if (res.affectedRows > 0) console.log(`[Cron] Removed ${res.affectedRows} stale pending users.`);
  });

  // Clean up vendors
  db.query(`
    DELETE FROM vendors 
    WHERE status = 'Pending' 
    AND created_at < NOW() - INTERVAL 7 DAY
  `, (err, res) => {
    if (err) console.error('[Cron] Error cleaning stale vendors:', err);
    else if (res.affectedRows > 0) console.log(`[Cron] Removed ${res.affectedRows} stale pending vendors.`);
  });
}, 24 * 60 * 60 * 1000); // 24 hours

// Serve Frontend in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get(/^(.*)$/, (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
