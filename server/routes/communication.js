const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, checkPermission } = require('../middleware/auth');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Initialize Transporter
let transporter;
try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('Nodemailer transporter initialized');
} catch (err) {
  console.error('Nodemailer initialization failed:', err);
}

// Initialize Twilio Client (optional/conditional)
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC') && 
    process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Helper to replace placeholders
const replacePlaceholders = (text, data) => {
  if (!text) return '';
  let result = text;
  const placeholders = {
    ...data,
    login_url: `${process.env.APP_URL || 'http://localhost:5173'}/login`,
    app_url: process.env.APP_URL || 'http://localhost:5173'
  };
  Object.keys(placeholders).forEach(key => {
    // Supports both {{name}} and [name]
    const bracketPlaceholder = new RegExp(`{{${key}}}`, 'g');
    const squarePlaceholder = new RegExp(`\\[${key}\\]`, 'g');
    result = result.replace(bracketPlaceholder, placeholders[key] || '');
    result = result.replace(squarePlaceholder, placeholders[key] || '');
  });
  return result;
};

// --- Templates ---

// Get all templates
router.get('/templates', (req, res) => {
  console.log('--- DEBUG: GET /api/communication/templates REACHED ---');
  db.query('SELECT * FROM email_templates ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('--- DEBUG: DATABASE ERROR in /templates ---', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    console.log('--- DEBUG: Returning templates count:', results.length);
    res.json({ success: true, data: results });
  });
});

// Create template
router.post('/templates', verifyToken, checkPermission('manage_communication'), (req, res) => {
  const { name, subject, body, type } = req.body;
  const query = 'INSERT INTO email_templates (name, subject, body, type) VALUES (?, ?, ?, ?)';
  db.query(query, [name, subject, body, type || 'General'], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Template created', id: result.insertId });
  });
});

// Update template
router.put('/templates/:id', verifyToken, checkPermission('manage_communication'), (req, res) => {
  const { name, subject, body, type } = req.body;
  const query = 'UPDATE email_templates SET name = ?, subject = ?, body = ?, type = ? WHERE id = ?';
  db.query(query, [name, subject, body, type, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Template updated' });
  });
});

// --- Sending ---

// Send manual email
router.post('/send', verifyToken, checkPermission('manage_communication'), async (req, res) => {
  const { recipient_email, subject, body } = req.body;
  
  if (!recipient_email || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    // 0. Fetch contact data for placeholders if possible
    let contactData = { name: '', email: recipient_email }; // Start empty to detect if found
    
    const [leads] = await db.promise().query('SELECT name, email FROM leads WHERE email = ? LIMIT 1', [recipient_email]);
    if (leads.length > 0) {
      contactData.name = leads[0].name;
    } else {
      const [customers] = await db.promise().query('SELECT name, email FROM customers WHERE email = ? LIMIT 1', [recipient_email]);
      if (customers.length > 0) contactData.name = customers[0].name;
    }

    // Fallback: If name still empty, extract from email (e.g. vivek@gmail.com -> Vivek)
    if (!contactData.name) {
      const emailPrefix = recipient_email.split('@')[0];
      // Clean up common patterns like numbers or special characters if needed
      contactData.name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).replace(/[.0-9_-]/g, ' ').trim();
    }

    const processedSubject = replacePlaceholders(subject, contactData);
    const processedBody = replacePlaceholders(body, contactData);

    // 1. Send via Nodemailer
    const mailOptions = {
      from: `"${process.env.SENDER_NAME || 'Management System'}" <${process.env.SMTP_USER}>`,
      to: recipient_email,
      subject: processedSubject,
      html: processedBody.trim().startsWith('<') ? processedBody : processedBody.replace(/\n/g, '<br/>'), 
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    // 2. Log to database
    const logQuery = 'INSERT INTO email_logs (recipient_email, subject, body, user_id) VALUES (?, ?, ?, ?)';
    db.query(logQuery, [recipient_email, processedSubject, processedBody, req.user.id], (err) => {
      if (err) console.error('Error logging email:', err);
      res.json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
    });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email: ' + error.message });
  }
});

// Get logs
router.get('/logs', verifyToken, checkPermission('manage_communication'), (req, res) => {
  db.query('SELECT email_logs.*, users.name as sender_name FROM email_logs LEFT JOIN users ON email_logs.user_id = users.id ORDER BY sent_at DESC', (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// --- Automation ---

// Get automation rules
router.get('/automation', verifyToken, checkPermission('manage_communication'), (req, res) => {
  const query = `
    SELECT email_automation.*, email_templates.name as template_name
    FROM email_automation
    JOIN email_templates ON email_automation.template_id = email_templates.id
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// --- Calls ---

// Log a call
router.post('/calls', verifyToken, checkPermission('manage_communication'), (req, res) => {
  const { contact_id, contact_type, duration, notes } = req.body;
  const query = 'INSERT INTO call_logs (contact_id, contact_type, duration, notes, user_id) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [contact_id, contact_type, duration, notes, req.user.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Call logged successfully' });
  });
});

// Get call logs
router.get('/calls', verifyToken, checkPermission('manage_communication'), (req, res) => {
  const query = `
    SELECT call_logs.*, users.name as user_name,
    CASE 
      WHEN contact_type = 'Lead' THEN (SELECT name FROM leads WHERE id = contact_id)
      WHEN contact_type = 'Customer' THEN (SELECT name FROM customers WHERE id = contact_id)
    END as contact_name
    FROM call_logs
    LEFT JOIN users ON call_logs.user_id = users.id
    ORDER BY called_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// Create call reminder
router.post('/reminders', verifyToken, checkPermission('manage_communication'), (req, res) => {
  const { contact_id, contact_type, remind_at, notes } = req.body;
  const query = 'INSERT INTO call_reminders (contact_id, contact_type, remind_at, notes, user_id) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [contact_id, contact_type, remind_at, notes, req.user.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, message: 'Call reminder set' });
  });
});

// Get call reminders
router.get('/reminders', verifyToken, checkPermission('manage_communication'), (req, res) => {
  const query = `
    SELECT call_reminders.*, 
    CASE 
      WHEN contact_type = 'Lead' THEN (SELECT name FROM leads WHERE id = contact_id)
      WHEN contact_type = 'Customer' THEN (SELECT name FROM customers WHERE id = contact_id)
    END as contact_name
    FROM call_reminders
    WHERE user_id = ? AND status = 'Pending'
    ORDER BY remind_at ASC
  `;
  db.query(query, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

// --- Call Center (Functional) ---

// Initiate a Call Bridge
router.post('/call-initiate', verifyToken, checkPermission('manage_communication'), async (req, res) => {
  const { contact_id, contact_type } = req.body;
  const userId = req.user.id;

  if (!twilioClient) {
    return res.status(503).json({ success: false, message: 'Twilio service not configured. Please add credentials to .env.' });
  }

  try {
    // 1. Get User's Phone
    const [user] = await db.promise().query('SELECT phone FROM users WHERE id = ?', [userId]);
    if (!user || !user[0]?.phone) {
      return res.status(400).json({ success: false, message: 'Your phone number is not set in your profile.' });
    }

    // 2. Get Contact's Phone
    let contactPhone;
    if (contact_type === 'Lead') {
      const [lead] = await db.promise().query('SELECT phone FROM leads WHERE id = ?', [contact_id]);
      contactPhone = lead[0]?.phone;
    } else {
      const [customer] = await db.promise().query('SELECT phone FROM customers WHERE id = ?', [contact_id]);
      contactPhone = customer[0]?.phone;
    }

    if (!contactPhone) {
      return res.status(400).json({ success: false, message: 'Contact phone number not found.' });
    }

    // 3. Create Twilio Call
    // We call the User first. When they answer, Twilio hits the /voice-twiml endpoint to connect the Contact.
    const call = await twilioClient.calls.create({
      url: `${req.protocol}://${req.get('host')}/api/communication/voice-twiml?to=${encodeURIComponent(contactPhone)}`,
      to: user[0].phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });

    // 4. Log the initialization
    const logQuery = 'INSERT INTO call_logs (contact_id, contact_type, duration, notes, user_id) VALUES (?, ?, ?, ?, ?)';
    db.query(logQuery, [contact_id, contact_type, 'Initiating...', 'Auto-initiated via Call Bridge', userId], (err) => {
      if (err) console.error('Error logging call initiation:', err);
      res.json({ success: true, message: 'Call initiated! Your phone should ring shortly.', callSid: call.sid });
    });

  } catch (error) {
    console.error('Call initialization error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate call: ' + error.message });
  }
});

// TwiML Endpoint for Call Bridging
router.post('/voice-twiml', (req, res) => {
  const contactPhone = req.query.to;
  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();

  response.say({ voice: 'alice' }, 'Connecting you to the contact. Please wait.');
  response.dial(contactPhone);

  res.type('text/xml');
  res.send(response.toString());
});

// --- WhatsApp / SMS ---

// Send a message
router.post('/messages', verifyToken, checkPermission('manage_communication'), async (req, res) => {
  const { recipient, platform, message } = req.body;

  try {
    let messageId = 'offline-simulated';

    if (twilioClient) {
      const from = platform === 'WhatsApp' 
        ? `whatsapp:${process.env.TWILIO_PHONE_NUMBER}` 
        : process.env.TWILIO_PHONE_NUMBER;
      
      const to = platform === 'WhatsApp' 
        ? `whatsapp:${recipient}` 
        : recipient;

      const response = await twilioClient.messages.create({
        body: message,
        from: from,
        to: to
      });
      messageId = response.sid;
    }

    const query = 'INSERT INTO message_logs (recipient, platform, message, user_id) VALUES (?, ?, ?, ?)';
    db.query(query, [recipient, platform, message, req.user.id], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error' });
      res.json({ 
        success: true, 
        message: `${platform} message ${twilioClient ? 'sent' : 'logged (Simulated)'}`, 
        messageId 
      });
    });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message: ' + error.message });
  }
});

// Get message logs
router.get('/messages', verifyToken, checkPermission('manage_communication'), (req, res) => {
  db.query('SELECT * FROM message_logs WHERE user_id = ? ORDER BY sent_at DESC', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });
    res.json({ success: true, data: results });
  });
});

module.exports = router;
