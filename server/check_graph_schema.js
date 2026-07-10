const fs = require('fs');
const db = require('./config/db');

const tables = ['users', 'payroll', 'leave_requests', 'tasks'];
let out = '';
let done = 0;

tables.forEach(t => {
  db.query(`DESCRIBE ${t}`, (err, res) => {
    if (err) {
      out += `\nERROR ${t}: ${err.message}\n`;
    } else {
      out += `\n=== ${t} ===\n`;
      res.forEach(r => out += `  ${r.Field} (${r.Type})\n`);
    }
    done++;
    if (done === tables.length) {
      fs.writeFileSync('schema_output.txt', out);
      console.log('Done - see schema_output.txt');
      process.exit(0);
    }
  });
});
