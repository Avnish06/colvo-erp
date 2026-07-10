const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function seedAttendance() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'management_system'
  });

  try {
    console.log('Seeding attendance data...');

    // 1. Get all users
    const [users] = await connection.query('SELECT id FROM users');

    if (users.length === 0) {
      console.log('No users found to seed attendance for.');
      return;
    }

    // 2. Determine date range (past 30 days)
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      // Skip Sundays for realistic data
      if (d.getDay() !== 0) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    // 3. Seed records
    for (const user of users) {
      console.log(`Seeding attendance for user ID: ${user.id}`);
      for (const date of dates) {
        // Randomize attendance (90% present)
        if (Math.random() > 0.1) {
          const clockInTime = `09:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00`; // Random 9:00 - 9:29
          const clockOutTime = `18:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}:00`; // Random 18:00 - 18:29

          // Check if record already exists to avoid duplicates
          const [existing] = await connection.query('SELECT id FROM attendance WHERE user_id = ? AND date = ?', [user.id, date]);

          if (existing.length === 0) {
            await connection.query(
              'INSERT INTO attendance (user_id, date, clock_in, clock_out, status) VALUES (?, ?, ?, ?, ?)',
              [user.id, date, clockInTime, clockOutTime, 'Present']
            );
          }
        } else {
          // Absent
          const [existing] = await connection.query('SELECT id FROM attendance WHERE user_id = ? AND date = ?', [user.id, date]);
          if (existing.length === 0) {
            await connection.query(
              'INSERT INTO attendance (user_id, date, clock_in, clock_out, status) VALUES (?, ?, ?, ?, ?)',
              [user.id, date, null, null, 'Absent']
            );
          }
        }
      }
    }

    console.log('Attendance seeding completed successfully.');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await connection.end();
  }
}

seedAttendance();
