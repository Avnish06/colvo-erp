const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function createTestVendor() {
  const firstName = 'Test';
  const lastName = 'Vendor';
  const email = 'vendor@test.com';
  const password = 'password123';
  const companyName = 'Test Vendor Co';
  const vendorRefId = 'VDR-9999';

  const hashedPassword = await bcrypt.hash(password, 10);

  db.beginTransaction((err) => {
    if (err) throw err;

    // 1. Insert into user_identities (role_id = 6 for Vendor)
    db.query('INSERT INTO user_identities (email, password, role_id) VALUES (?, ?, 6)', [email, hashedPassword], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error('Identity creation failed:', err);
          process.exit(1);
        });
      }

      const userId = result.insertId;

      // 2. Insert into vendors table
      db.query(
        'INSERT INTO vendors (first_name, last_name, email, phone, company_name, user_id, vendor_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [firstName, lastName, email, '1234567890', companyName, userId, vendorRefId, 'Active'],
        (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Vendor record creation failed:', err);
              process.exit(1);
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Commit error:', err);
                process.exit(1);
              });
            }
            console.log('\n✅ Test Vendor Created Successfully!');
            console.log('-----------------------------------');
            console.log(`Email: ${email}`);
            console.log(`Password: ${password}`);
            console.log(`Vendor ID: ${vendorRefId}`);
            console.log('-----------------------------------');
            process.exit(0);
          });
        }
      );
    });
  });
}

createTestVendor();
