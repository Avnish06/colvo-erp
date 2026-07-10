const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// ─── Configuration ────────────────────────────────────────────────────────────
const DB_CONFIG = {
  host:              process.env.DB_HOST     || 'localhost',
  port:              parseInt(process.env.DB_PORT || '3306'),
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'management_system',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  connectTimeout:    10000,   // 10s timeout per connection attempt
  acquireTimeout:    10000,
  enableKeepAlive:   true,
  keepAliveInitialDelay: 0,
};

// ─── Create Pool ───────────────────────────────────────────────────────────────
const pool = mysql.createPool(DB_CONFIG);

// ─── Verify Connection on Startup ─────────────────────────────────────────────
function verifyConnection() {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('  ❌  DATABASE CONNECTION FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error(`  Host     : ${DB_CONFIG.host}:${DB_CONFIG.port}`);
      console.error(`  Database : ${DB_CONFIG.database}`);
      console.error(`  User     : ${DB_CONFIG.user}`);
      console.error(`  Error    : ${err.code} — ${err.message}`);
      console.error('');
      console.error('  ➜  FIX: Make sure MySQL is installed and running.');
      console.error('         • XAMPP  → Open XAMPP Control Panel → Start MySQL');
      console.error('         • MySQL  → Run: net start mysql80  (in admin terminal)');
      console.error('         • Check .env for correct DB_HOST / DB_USER / DB_PASSWORD');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Retry after 5 seconds instead of crashing
      console.log('  🔄  Retrying DB connection in 5 seconds...\n');
      setTimeout(verifyConnection, 5000);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  ✅  DATABASE CONNECTED SUCCESSFULLY');
    console.log(`  Host     : ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`  Database : ${DB_CONFIG.database}`);
    console.log(`  User     : ${DB_CONFIG.user}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    connection.release();
  });
}

verifyConnection();

// ─── Pool Error Handler (keeps server alive on lost connections) ───────────────
pool.on('error', (err) => {
  console.error('[DB Pool Error]', err.code, err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
    console.warn('[DB] Connection lost — pool will auto-reconnect on next query.');
  }
});

// Export both callback-style pool and promise-based pool
module.exports = pool;
module.exports.promise = pool.promise();
