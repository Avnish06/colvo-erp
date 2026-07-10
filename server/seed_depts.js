const db = require('./config/db');

const seedDepartments = () => {
  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales'];

  departments.forEach(dept => {
    db.query('INSERT IGNORE INTO departments (name) VALUES (?)', [dept], (err) => {
      if (err) console.error(`Error seeding department ${dept}:`, err);
      else console.log(`Department ${dept} seeded successfully!`);
    });
  });
};

seedDepartments();
