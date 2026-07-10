const db = require('../config/db');

/**
 * Generates a sequential ID in the format HT{YY}{PREFIX}-{SEQ}
 * Example: HT26EMP-0001 or HT26VNDR-0001
 * 
 * @param {number} roleId - The role ID to determine the prefix
 * @returns {Promise<string>} - The generated sequence ID
 */
const generateSequentialId = (roleId) => {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const prefix = (roleId === 6) ? 'VNDR' : 'EMP';
    const searchPattern = `HT${yy}${prefix}-%`;

    let query;
    if (prefix === 'EMP') {
      // Check all internal role tables
      query = `
                SELECT employee_id 
                FROM (
                    SELECT employee_id FROM superadmins
                    UNION ALL
                    SELECT employee_id FROM admins
                    UNION ALL
                    SELECT employee_id FROM employees
                    UNION ALL
                    SELECT employee_id FROM developers
                ) as all_ids 
                WHERE employee_id LIKE ? 
                ORDER BY employee_id DESC 
                LIMIT 1
            `;
    } else {
      // Check vendor table
      query = `SELECT vendor_id as employee_id FROM vendors WHERE vendor_id LIKE ? ORDER BY vendor_id DESC LIMIT 1`;
    }

    db.query(query, [searchPattern], (err, results) => {
      if (err) return reject(err);

      let lastSeq = 0;
      if (results.length > 0) {
        const lastId = results[0].employee_id;
        const parts = lastId.split('-');
        if (parts.length === 2) {
          const seqStr = parts[1];
          lastSeq = parseInt(seqStr, 10);
        }
      }

      const nextSeq = (lastSeq + 1).toString().padStart(4, '0');
      const newId = `HT${yy}${prefix}-${nextSeq}`;
      resolve(newId);
    });
  });
};

module.exports = { generateSequentialId };
