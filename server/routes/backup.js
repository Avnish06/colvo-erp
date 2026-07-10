const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// Helper to generate SQL dump
const generateSqlDump = async () => {
  const [tables] = await db.promise().query('SHOW TABLES');
  const tableNames = tables.map(row => Object.values(row)[0]);

  let sqlDump = `-- ERPMaster Database Backup\n-- Generated: ${new Date().toISOString()}\n-- Database: ${process.env.DB_NAME || 'management_system'}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

  for (const table of tableNames) {
    const [createTableResult] = await db.promise().query(`SHOW CREATE TABLE \`${table}\``);
    const createTableSql = createTableResult[0]['Create Table'];
    sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sqlDump += `${createTableSql};\n\n`;

    const [rows] = await db.promise().query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      sqlDump += `INSERT INTO \`${table}\` VALUES `;
      const values = rows.map(row => {
        const rowValues = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        });
        return `(${rowValues.join(', ')})`;
      }).join(',\n');
      sqlDump += `${values};\n\n`;
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
  return sqlDump;
};

// Check role helper
const isAllowedRole = (role) => ['Super Admin', 'Developer'].includes(role);

// List all saved backups
router.get('/list', verifyToken, async (req, res) => {
  if (!isAllowedRole(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql'))
      .map(fileName => {
        const filePath = path.join(BACKUP_DIR, fileName);
        const stats = fs.statSync(filePath);
        return {
          fileName,
          size: stats.size,
          createdAt: stats.birthtime || stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: files });
  } catch (err) {
    console.error('List backups error:', err);
    res.status(500).json({ success: false, message: 'Failed to list backups' });
  }
});

// Get database stats (table count, total rows)
router.get('/stats', verifyToken, async (req, res) => {
  if (!isAllowedRole(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const [tables] = await db.promise().query('SHOW TABLES');
    const tableCount = tables.length;

    let totalRows = 0;
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [countResult] = await db.promise().query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      totalRows += countResult[0].cnt;
    }

    // Get backup directory size
    let backupSize = 0;
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql'));
      for (const file of files) {
        backupSize += fs.statSync(path.join(BACKUP_DIR, file)).size;
      }
    }

    res.json({
      success: true,
      data: { tableCount, totalRows, backupCount: fs.existsSync(BACKUP_DIR) ? fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sql')).length : 0, totalBackupSize: backupSize }
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

// Download a fresh backup (generate on-the-fly)
router.get('/download', verifyToken, async (req, res) => {
  if (!isAllowedRole(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const sqlDump = await generateSqlDump();
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=backup_${Date.now()}.sql`);
    res.send(sqlDump);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: 'Error downloading backup' });
  }
});

// Download a specific saved backup file
router.get('/download/:fileName', verifyToken, async (req, res) => {
  if (!isAllowedRole(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const filePath = path.join(BACKUP_DIR, req.params.fileName);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'Backup not found' });
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename=${req.params.fileName}`);
    return res.sendFile(filePath);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: 'Error downloading backup' });
  }
});

// Create and save backup to server
router.post('/', verifyToken, async (req, res) => {
  if (!isAllowedRole(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const sqlDump = await generateSqlDump();
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const fileName = `backup_${dateStr}_${timeStr}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    fs.writeFileSync(filePath, sqlDump);
    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: { fileName, size: stats.size, createdAt: stats.birthtime || stats.mtime }
    });
  } catch (err) {
    console.error('Create backup error:', err);
    res.status(500).json({ success: false, message: 'Backup failed' });
  }
});

// Delete a backup
router.delete('/:fileName', verifyToken, async (req, res) => {
  if (!isAllowedRole(req.user.role)) return res.status(403).json({ success: false, message: 'Access denied' });
  try {
    const filePath = path.join(BACKUP_DIR, req.params.fileName);

    // Security: prevent path traversal
    if (!path.resolve(filePath).startsWith(path.resolve(BACKUP_DIR))) {
      return res.status(400).json({ success: false, message: 'Invalid file name' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (err) {
    console.error('Delete backup error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete backup' });
  }
});

module.exports = router;
