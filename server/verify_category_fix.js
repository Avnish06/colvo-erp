const db = require('./config/db');

async function verify() {
  try {
    console.log('Testing ticket insertion with custom category...');
    const [result] = await db.promise().query(
      'INSERT INTO tickets (user_id, title, description, priority, category) VALUES (?, ?, ?, ?, ?)',
      [1, 'Verification Ticket', 'Direct DB insertion test for custom category.', 'High', 'Network Issue']
    );

    if (result.insertId) {
      console.log('Ticket inserted successfully with ID:', result.insertId);

      // Fetch it back to verify the category
      const [rows] = await db.promise().query('SELECT category FROM tickets WHERE id = ?', [result.insertId]);

      if (rows[0] && rows[0].category === 'Network Issue') {
        console.log('Verified: Ticket saved with custom category "Network Issue"');
      } else {
        console.error('Verification failed: Category was', rows[0]?.category);
      }

      // Cleanup
      await db.promise().query('DELETE FROM tickets WHERE id = ?', [result.insertId]);
      console.log('Cleanup completed.');
    }
  } catch (err) {
    console.error('Test error:', err.message);
  } finally {
    process.exit(0);
  }
}

verify();
