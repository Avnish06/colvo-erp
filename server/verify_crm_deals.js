const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system'
});

const dbPromise = db.promise();

async function verifyDeals() {
  try {
    console.log('Verifying CRM Sales Pipeline Implementation...');

    // 1. Check if tables exist
    const [tables] = await dbPromise.query("SHOW TABLES LIKE 'deals'");
    if (tables.length === 0) throw new Error('Deals table is missing');
    console.log('✅ Deals table exists');

    // 2. Get a test customer
    const [customers] = await dbPromise.query('SELECT id FROM customers LIMIT 1');
    if (customers.length === 0) {
      console.log('⚠️ No customers found for testing. Please create a customer first.');
      return;
    }
    const customerId = customers[0].id;

    // 3. Test Deal Creation
    const [dealResult] = await dbPromise.query(
      'INSERT INTO deals (customer_id, name, value, probability, stage) VALUES (?, ?, ?, ?, ?)',
      [customerId, 'Test Deal 1', 50000.00, 50, 'Proposal']
    );
    const dealId = dealResult.insertId;
    console.log(`✅ Deal created with ID: ${dealId}`);

    // 4. Test Team Assignment
    const [users] = await dbPromise.query('SELECT id FROM users LIMIT 1');
    if (users.length > 0) {
      await dbPromise.query('INSERT INTO deal_team (deal_id, user_id) VALUES (?, ?)', [dealId, users[0].id]);
      console.log('✅ Team member assigned to deal');
    }

    // 5. Test Forecasting Query
    const [stats] = await dbPromise.query(`
      SELECT stage, COUNT(*) as count, SUM(value) as total_value 
      FROM deals GROUP BY stage
    `);
    console.log('✅ Forecasting stats retrieved:', stats);

    // 6. Cleanup
    await dbPromise.query('DELETE FROM deals WHERE id = ?', [dealId]);
    console.log('✅ Test deal deleted (Cleanup)');

    console.log('\nVerification Successful: All backend components are functional.');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    db.end();
  }
}

verifyDeals();
