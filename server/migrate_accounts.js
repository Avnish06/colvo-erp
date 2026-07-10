const db = require('./config/db');
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'database', 'accounts_schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Splitting the schema into individual queries
const queries = schema
  .split(';')
  .map(q => q.trim())
  .filter(q => q.length > 0);

const runQueries = async () => {
  for (let query of queries) {
    try {
      await new Promise((resolve, reject) => {
        db.query(query, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('Executed:', query.substring(0, 50) + '...');
    } catch (err) {
      console.error('Error executing query:', err.message);
    }
  }
  console.log('Migration completed');
  process.exit(0);
};

runQueries();
