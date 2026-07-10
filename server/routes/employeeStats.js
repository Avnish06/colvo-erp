const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

router.get('/:id', verifyToken, async (req, res) => {
  const userId = req.params.id;

  try {
    // 1. Get Task Stats
    const taskQuery = 'SELECT COUNT(*) as totalTasks, COALESCE(SUM(CASE WHEN status = "Done" OR status = "Completed" THEN 1 ELSE 0 END), 0) as completedTasks, COALESCE(SUM(CASE WHEN status != "Done" AND status != "Completed" THEN 1 ELSE 0 END), 0) as pendingTasks FROM tasks WHERE assigned_to = ?';
    const [taskStats] = await db.promise.query(taskQuery, [userId]);

    // 2. Get Today's Attendance
    const today = new Date().toISOString().split('T')[0];
    const attendanceQuery = 'SELECT clock_in, clock_out, status FROM attendance WHERE user_id = ? AND date = ?';
    const [attendanceStats] = await db.promise.query(attendanceQuery, [userId, today]);

    // 3. Get Latest Salary
    const payrollQuery = 'SELECT net_salary, month_year FROM payroll WHERE user_id = ? ORDER BY payment_date DESC LIMIT 1';
    const [payrollStats] = await db.promise.query(payrollQuery, [userId]);

    // 4. Get Pending Leaves
    const leaveQuery = 'SELECT COUNT(*) as pendingLeaves FROM leave_requests WHERE user_id = ? AND status = "Pending"';
    const [leaveStats] = await db.promise.query(leaveQuery, [userId]);

    // 5. Get Unread Notifications Count
    const notifQuery = 'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE';
    const [notifStats] = await db.promise.query(notifQuery, [userId]);

    res.json({
      success: true,
      data: {
        totalTasks: taskStats[0]?.totalTasks || 0,
        completedTasks: taskStats[0]?.completedTasks || 0,
        pendingTasks: taskStats[0]?.pendingTasks || 0,
        attendance: attendanceStats[0] || null,
        latestSalary: payrollStats[0] || null,
        pendingLeaves: leaveStats[0]?.pendingLeaves || 0,
        unreadCount: notifStats[0]?.unreadCount || 0
      }
    });

  } catch (err) {
    console.error('Error fetching employee dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message, stack: err.stack });
  }
});

module.exports = router;
