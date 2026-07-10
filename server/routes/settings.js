const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Always save as 'company_logo' with original extension, or timestamped to avoid cache issues
    cb(null, 'company_logo' + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get all settings
router.get('/', (req, res) => {
  db.query('SELECT * FROM system_settings', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching settings' });
    const settings = {};
    results.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json({ success: true, data: settings });
  });
});

// Update settings (JSON)
router.post('/', (req, res) => {
  const settings = req.body;
  console.log('Received settings for update:', settings);
  const queries = Object.keys(settings).map(key => {
    return db.promise().query(
      'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, settings[key], settings[key]]
    );
  });

  Promise.all(queries)
    .then(() => res.json({ success: true, message: 'Settings updated successfully' }))
    .catch(err => res.status(500).json({ success: false, message: 'Error updating settings' }));
});

// Upload Logo
router.post('/upload-logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;

  // Save URL to database
  db.query(
    'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    ['company_logo', fileUrl, fileUrl],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Error saving logo path' });
      res.json({ success: true, message: 'Logo uploaded successfully', logoUrl: fileUrl });
    }
  );
});

module.exports = router;
