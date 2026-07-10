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

async function verifyCustomers() {
  try {
    console.log('Verifying CRM Customer Management API...');

    // 1. Get a test user (CRM Employee or Admin)
    const [users] = await dbPromise.query('SELECT id FROM users WHERE role_id IN (1, 2, 4) LIMIT 1');
    if (users.length === 0) {
      console.log('No eligible user found for customer assignment.');
      return;
    }
    const userId = users[0].id;

    // 2. Create a test customer
    const [customerResult] = await dbPromise.query(
      'INSERT INTO customers (name, email, phone, company_name, stage, segmentation, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Test Customer', 'customer@example.com', '9876543210', 'Test Corp', 'Prospect', 'Enterprise', userId]
    );
    const customerId = customerResult.insertId;
    console.log(`Test customer created with ID: ${customerId}`);

    // 3. Create a test interaction
    await dbPromise.query(
      'INSERT INTO customer_interactions (customer_id, user_id, type, content) VALUES (?, ?, ?, ?)',
      [customerId, userId, 'Call', 'Initial discovery call']
    );
    console.log('Test interaction created.');

    // 4. Create a test document record
    await dbPromise.query(
      'INSERT INTO customer_documents (customer_id, file_name, file_path, type) VALUES (?, ?, ?, ?)',
      [customerId, 'quote.pdf', 'uploads/customer_docs/test-quote.pdf', 'Quote']
    );
    console.log('Test document record created.');

    // 5. Verify data retrieval
    const [customers] = await dbPromise.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    console.log('Customer Retrieval:', customers.length > 0 ? 'SUCCESS' : 'FAILED');

    const [interactions] = await dbPromise.query('SELECT * FROM customer_interactions WHERE customer_id = ?', [customerId]);
    console.log('Interaction Retrieval:', interactions.length > 0 ? 'SUCCESS' : 'FAILED');

    const [docs] = await dbPromise.query('SELECT * FROM customer_documents WHERE customer_id = ?', [customerId]);
    console.log('Document Retrieval:', docs.length > 0 ? 'SUCCESS' : 'FAILED');

    console.log('Verification completed successfully.');

    // Cleanup
    await dbPromise.query('DELETE FROM customers WHERE id = ?', [customerId]);
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    db.end();
  }
}

verifyCustomers();
