const axios = require('axios');
const db = require('./config/db');
const jwt = require('jsonwebtoken');

const testReportGen = async () => {
  try {
    console.log('Testing report generation logic...');

    // 1. Get a token (simulating login)
    // Assuming user_id 1 is Super Admin
    const [users] = await db.promise().query('SELECT * FROM users LIMIT 1');
    if (users.length === 0) throw new Error('No users found');
    const user = users[0];
    const token = jwt.sign({ id: user.id, email: user.email, role_id: user.role_id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // 2. Clear old report for Feb 2026
    await db.promise().query('DELETE FROM reports WHERE period_month = "February" AND period_year = 2026');

    // 3. Trigger generation via API (mocking the frontend request)
    const res = await axios.post('http://localhost:5000/api/reports/generate', {
      type: 'Monthly',
      month: 'February',
      year: 2026
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.data.success) {
      console.log('API call successful:', res.data.message);
      console.log('Report Data:', res.data.data);

      // 4. Verify in DB
      const [report] = await db.promise().query('SELECT * FROM reports WHERE id = ?', [res.data.data.id]);
      if (report.length > 0) {
        const r = report[0];
        console.log('Verified in Database:');
        console.log(`- Title: ${r.title}`);
        console.log(`- Total Salary: ${r.total_salary} (Expected: 64000)`);
        console.log(`- Total Expenditure: ${r.total_expenditure} (Expected: 5550)`);
        console.log(`- Total Invoices: ${r.total_invoices} (Expected: 90000)`);

        if (Number(r.total_salary) === 64000 && Number(r.total_expenditure) === 5550 && Number(r.total_invoices) === 90000) {
          console.log('\n✅ VERIFICATION SUCCESSFUL: Data correctly aggregated!');
        } else {
          console.error('\n❌ VERIFICATION FAILED: Data mismatch!');
        }
      }
    } else {
      console.error('API call failed:', res.data.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.message);
    if (err.response) console.error('Response:', err.response.data);
    process.exit(1);
  }
};

testReportGen();
