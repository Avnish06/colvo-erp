const mysql = require('mysql2');
const fs = require('fs');

const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'management_system' });
const log = [];

db.connect(err => {
  if (err) { console.error(err.message); process.exit(1); }

  db.query("SHOW CREATE VIEW users", (err, rows) => {
    if (err) log.push('VIEW error: ' + err.message);
    else log.push('USERS VIEW DEF:\n' + rows[0]['Create View']);
    fs.writeFileSync('view_def.txt', log.join('\n'));
    db.end();
  });
});
