const fs = require('fs');
const db = require('./config/db');

// Check counts and find seeded records
db.query('SELECT COUNT(*) as c FROM leave_requests', (e, r) => {
  const total = r[0].c;
  console.log('Total leave_requests:', total);

  // The seeded ones have reason = 'Personal reason' (from the seed script)
  db.query("SELECT COUNT(*) as c FROM leave_requests WHERE reason = 'Personal reason'", (e2, r2) => {
    console.log('Seeded (reason=Personal reason):', r2[0].c);

    db.query("SELECT COUNT(*) as c FROM leave_requests WHERE reason != 'Personal reason' OR reason IS NULL", (e3, r3) => {
      console.log('Original records:', r3[0].c);

      // Delete seeded leave requests
      db.query("DELETE FROM leave_requests WHERE reason = 'Personal reason'", (e4, r4) => {
        console.log('Deleted seeded leave_requests:', r4.affectedRows);

        // Also clean seeded tasks
        db.query("DELETE FROM tasks WHERE description = 'Auto-generated task'", (e5, r5) => {
          console.log('Deleted seeded tasks:', r5.affectedRows);

          // Clean seeded payroll (keep only records that existed before)
          // The seed script used payment_date as the 28th of each month
          // Let's check what payroll looks like
          db.query('SELECT COUNT(*) as c FROM payroll', (e6, r6) => {
            console.log('Total payroll records:', r6[0].c);

            // We need to keep original payroll records
            // The seeded ones were added for all users across 12 months
            // We'll keep all payroll since those provide necessary graph data
            console.log('Keeping payroll records for graph data.');

            // Final counts
            db.query('SELECT COUNT(*) as c FROM leave_requests', (e7, r7) => {
              console.log('\nFinal leave_requests count:', r7[0].c);
              db.query('SELECT COUNT(*) as c FROM tasks', (e8, r8) => {
                console.log('Final tasks count:', r8[0].c);
                process.exit(0);
              });
            });
          });
        });
      });
    });
  });
});
