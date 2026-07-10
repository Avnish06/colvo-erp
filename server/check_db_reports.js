const db = require('./config/db');

const checkReports = async () => {
  try {
    const [results] = await db.promise().query('SELECT * FROM reports');
    console.log('Total reports in database:', results.length);
    if (results.length > 0) {
      console.log('Last 5 reports:');
      results.slice(-5).forEach(r => {
        console.log(`- ID: ${r.id}, Title: ${r.title}, Type: ${r.type}, Date: ${r.created_at}`);
      });
    }
  } catch (err) {
    console.error('Error checking reports:', err);
  } finally {
    process.exit(0);
  }
};

checkReports();
