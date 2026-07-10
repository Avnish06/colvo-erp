const db = require('./config/db');

const checkSalaryData = async () => {
  try {
    console.log('--- Checking for Payroll Records ---');
    const [payroll] = await db.promise().query('SELECT * FROM payroll');
    console.log('Total payroll records:', payroll.length);
    if (payroll.length > 0) {
      console.log('Sample record:', payroll[0]);
    }

    console.log('\n--- Checking for Salary related tables ---');
    const [tables] = await db.promise().query('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));

    const [userCols] = await db.promise().query('SHOW COLUMNS FROM users');
    console.log('\n--- Users Table Columns ---');
    console.log(userCols.map(c => c.Field));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
};

checkSalaryData();
