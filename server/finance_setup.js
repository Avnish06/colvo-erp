const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'management_system',
};

async function setupFinance() {
  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to DB');

    // 1. Transactions Table (Income & Expenses)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS finance_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('income', 'expense') NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
        amount_base DECIMAL(15,2) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        is_recurring BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('finance_transactions table ready');

    // 2. Budgets Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS finance_budgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(100) NOT NULL UNIQUE,
        monthly_limit DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('finance_budgets table ready');

    // Default Budgets
    const budgets = [
      ['Marketing', 50000],
      ['Software', 20000],
      ['Office Rent', 100000],
      ['Travel', 30000]
    ];
    for (const [category, limit] of budgets) {
      await conn.query('INSERT IGNORE INTO finance_budgets (category, monthly_limit) VALUES (?, ?)', [category, limit]);
    }

    // Default Transactions (Mock Data for charts)
    const tx = [
      ['income', 'Sales', 500000, 'INR', 1, 500000, '2026-06-15', 'Client A Payment'],
      ['income', 'Consulting', 250000, 'INR', 1, 250000, '2026-06-20', 'Client B Consulting'],
      ['expense', 'Software', 15000, 'INR', 1, 15000, '2026-06-05', 'AWS Bill'],
      ['expense', 'Marketing', 40000, 'INR', 1, 40000, '2026-06-10', 'Google Ads'],
      ['income', 'Sales', 600000, 'INR', 1, 600000, '2026-07-02', 'Client C Payment'],
      ['expense', 'Office Rent', 80000, 'INR', 1, 80000, '2026-07-01', 'HQ Rent'],
      ['expense', 'Software', 500, 'USD', 83.5, 41750, '2026-07-05', 'SaaS Subscriptions']
    ];
    
    // Check if transactions exist
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM finance_transactions');
    if (rows[0].count === 0) {
      for (const t of tx) {
        await conn.query('INSERT INTO finance_transactions (type, category, amount, currency, exchange_rate, amount_base, date, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', t);
      }
      console.log('Mock transactions inserted');
    }

    console.log('Finance setup complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

setupFinance();
