const mysql = require('mysql2');
const fs = require('fs');

const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'management_system' });
const output = [];
const log = (msg) => { output.push(msg); };

db.connect(err => {
  if (err) { log('DB Error: ' + err.message); process.exit(1); }

  // Check developers table
  db.query("SELECT * FROM developers WHERE user_id = 24", (err, rows) => {
    if (err) log('developers error: ' + err.message);
    else log('DEVELOPERS TABLE: ' + JSON.stringify(rows));

    // Check if there's a developer_panel_login table or similar
    db.query("SHOW TABLES", (err2, rows2) => {
      if (err2) log('tables error: ' + err2.message);
      else log('ALL TABLES: ' + JSON.stringify(rows2.map(r => Object.values(r)[0])));

      // Try to find any developer-specific auth table
      db.query("SELECT * FROM user_identities WHERE id = 24", (err3, rows3) => {
        if (err3) log('user_identities error: ' + err3.message);
        else log('USER_IDENTITIES for id=24: ' + JSON.stringify(rows3.map(r => ({ id: r.id, email: r.email, role_id: r.role_id }))));

        fs.writeFileSync('debug2_output.txt', output.join('\n'));
        db.end();
      });
    });
  });
});
