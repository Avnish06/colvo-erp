const db = require('./config/db');

const forceGenerate = async () => {
  const type = 'Monthly';
  const month = 'February';
  const year = 2026;
  const period = `${month} ${year}`;
  const reportTitle = `${period} Financial Summary`;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = monthNames.indexOf(month) + 1;

  try {
    console.log(`Manually generating report for ${period}...`);

    // 1. Aggregate Payroll
    const [payroll] = await db.promise().query(
      'SELECT SUM(net_salary) as salary, SUM(deductions) as deductions FROM payroll WHERE month_year = ?',
      [period]
    );
    const pData = payroll[0] || { salary: 0, deductions: 0 };
    console.log('Payroll:', pData);

    // 2. Aggregate Invoices
    const [invoices] = await db.promise().query(
      'SELECT SUM(total_amount) as total FROM invoices WHERE MONTH(invoice_date) = ? AND YEAR(invoice_date) = ?',
      [monthIndex, year]
    );
    const iData = invoices[0] || { total: 0 };
    console.log('Invoices:', iData);

    // 3. Aggregate Expenditures
    const [expenditures] = await db.promise().query(
      'SELECT SUM(amount) as total FROM expenditures WHERE MONTH(date) = ? AND YEAR(date) = ?',
      [monthIndex, year]
    );
    const eData = expenditures[0] || { total: 0 };
    console.log('Expenditures:', eData);

    // 4. Save
    const [result] = await db.promise().query(`
            INSERT INTO reports (title, type, period_month, period_year, total_salary, total_deductions, total_invoices, total_expenditure, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Generated')
        `, [reportTitle, type, month, year, pData.salary || 0, pData.deductions || 0, iData.total || 0, eData.total || 0]);

    console.log('Report saved successfully! ID:', result.insertId);

  } catch (err) {
    console.error('Error during generation:', err);
  } finally {
    process.exit(0);
  }
};

forceGenerate();
