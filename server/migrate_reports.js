const db = require('./config/db');

const migrate = async () => {
    try {
        console.log('Starting migration for expenditures and report updates...');

        // 1. Create Expenditures Table
        await db.promise().query(`
            CREATE TABLE IF NOT EXISTS expenditures (
                id INT AUTO_INCREMENT PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Expenditures table created/verified.');

        // 2. Update Reports Table Schema
        // Check if total_expenditure column exists
        const [columns] = await db.promise().query('SHOW COLUMNS FROM reports');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('total_expenditure')) {
            await db.promise().query('ALTER TABLE reports ADD COLUMN total_expenditure DECIMAL(15, 2) DEFAULT 0 AFTER total_deductions');
            console.log('Added total_expenditure column to reports table.');
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
