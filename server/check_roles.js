const db = require('./config/db');

const checkRoles = async () => {
  try {
    const [roles] = await db.promise().query('SELECT * FROM roles');
    console.table(roles);
    process.exit(0);
  } catch (err) {
    console.error('Error fetching roles:', err);
    process.exit(1);
  }
};

checkRoles();
