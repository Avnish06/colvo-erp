const db = require('./config/db');

const verifySalaryStructure = async () => {
  try {
    console.log('--- Verifying Salary Structure Persistence ---');

    // Use a test user ID (found ID 5 in users table)
    const testUserId = 5;
    const testData = {
      user_id: testUserId,
      basic_salary: 5000,
      hra: 1000,
      da: 500,
      bonus: 200,
      deductions: 300
    };

    console.log('1. Saving structure for user', testUserId);
    await db.promise().query(`
            INSERT INTO salary_structures (user_id, basic_salary, hra, da, bonus, deductions)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
              basic_salary = VALUES(basic_salary),
              hra = VALUES(hra),
              da = VALUES(da),
              bonus = VALUES(bonus),
              deductions = VALUES(deductions)
        `, [testData.user_id, testData.basic_salary, testData.hra, testData.da, testData.bonus, testData.deductions]);

    console.log('2. Fetching structure to verify...');
    const [results] = await db.promise().query('SELECT * FROM salary_structures WHERE user_id = ?', [testUserId]);

    if (results.length > 0) {
      const saved = results[0];
      console.log('Retrieved Data:', saved);

      const match = parseFloat(saved.basic_salary) === testData.basic_salary &&
        parseFloat(saved.hra) === testData.hra &&
        parseFloat(saved.da) === testData.da &&
        parseFloat(saved.bonus) === testData.bonus &&
        parseFloat(saved.deductions) === testData.deductions;

      if (match) {
        console.log('SUCCESS: Salary structure data matches!');
      } else {
        console.error('FAILURE: Salary structure data mismatch!');
      }
    } else {
      console.error('FAILURE: No salary structure found for user', testUserId);
    }

  } catch (err) {
    console.error('Verification Error:', err);
  } finally {
    process.exit(0);
  }
};

verifySalaryStructure();
