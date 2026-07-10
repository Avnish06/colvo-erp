const db = require('./config/db');

const seedData = async () => {
  try {
    console.log('Seeding test data for February 2026 reports...');

    // 1. Seed Payroll for Feb 2026
    // Need a user_id. Assuming user_id 1 exists (Super Admin)
    const [users] = await db.promise().query('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No users found to seed payroll');
    } else {
      const uId = users[0].id;
      await db.promise().query('DELETE FROM payroll WHERE month_year = "February 2026"');
      await db.promise().query(`
        INSERT INTO payroll (user_id, basic_salary, hra, da, bonus, deductions, net_salary, month_year, payment_date)
        VALUES (?, 50000, 10000, 5000, 2000, 3000, 64000, 'February 2026', '2026-02-15')
      `, [uId]);
      console.log('Seed: Payroll record created for Feb 2026.');
    }

    // 2. Seed Expenditures for Feb 2026
    await db.promise().query('DELETE FROM expenditures WHERE date BETWEEN "2026-02-01" AND "2026-02-28"');
    await db.promise().query(`
      INSERT INTO expenditures (category, amount, description, date) VALUES 
      ('Office Rent', 5000, 'Monthly office rent', '2026-02-01'),
      ('Electricity', 450, 'Monthly bill', '2026-02-10'),
      ('Internet', 100, 'Broadband', '2026-02-12')
    `);
    console.log('Seed: Expenditure records created for Feb 2026.');

    // 3. Seed Invoices for Feb 2026
    await db.promise().query('DELETE FROM invoices WHERE invoice_date BETWEEN "2026-02-01" AND "2026-02-28"');
    await db.promise().query(`
      INSERT INTO invoices (id, client_name, total_amount, invoice_date) VALUES 
      ('INV-FEB-001', 'CloudCorp', 75000, '2026-02-05'),
      ('INV-FEB-002', 'TechGlobal', 15000, '2026-02-20')
    `);
    console.log('Seed: Invoice records created for Feb 2026.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedData();
