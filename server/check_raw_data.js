const db = require('./config/db');

const checkData = async () => {
  try {
    const [payroll] = await db.promise().query('SELECT * FROM payroll');
    console.log('Payroll records:', payroll.length);
    if (payroll.length > 0) console.log('Sample payroll month_year:', payroll[0].month_year);

    const [invoices] = await db.promise().query('SELECT * FROM invoices');
    console.log('Invoice records:', invoices.length);
    if (invoices.length > 0) console.log('Sample invoice_date:', invoices[0].invoice_date);

    const [expenditures] = await db.promise().query('SELECT * FROM expenditures');
    console.log('Expenditure records:', expenditures.length);
    if (expenditures.length > 0) console.log('Sample expenditure date:', expenditures[0].date);

  } catch (err) {
    console.error('Error checking data:', err);
  } finally {
    process.exit(0);
  }
};

checkData();
