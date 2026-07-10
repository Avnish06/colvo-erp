const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Simulated AI Chatbot for ERP & CRM data
router.post('/', verifyToken, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  const query = message.toLowerCase();
  let responseText = "I'm sorry, I couldn't understand that. You can ask me about our total revenue, active clients, pending proposals, employee count, or current projects!";

  try {
    // Intent: Revenue / Finance
    if (query.includes('revenue') || query.includes('income') || query.includes('money') || query.includes('sales')) {
      const [results] = await db.promise().query("SELECT SUM(amount_base) as total FROM finance_transactions WHERE type = 'income'");
      const total = results[0].total || 0;
      responseText = `Based on our financial records, the total revenue (income) recorded is **$${Number(total).toLocaleString()}**.`;
    } 
    // Intent: Clients / CRM
    else if (query.includes('client') || query.includes('customer')) {
      const [results] = await db.promise().query("SELECT COUNT(*) as count FROM customers WHERE stage = 'Active' OR stage = 'Won'");
      const count = results[0].count || 0;
      responseText = `We currently have **${count} active clients** being managed in the CRM.`;
    }
    // Intent: Proposals
    else if (query.includes('proposal')) {
      const [results] = await db.promise().query("SELECT COUNT(*) as count, SUM(value) as total_val FROM proposals WHERE status != 'Approved'");
      const count = results[0].count || 0;
      const val = results[0].total_val || 0;
      responseText = `There are **${count} pending proposals** waiting for approval, with a combined estimated value of **$${Number(val).toLocaleString()}**.`;
    }
    // Intent: Employees / HR
    else if (query.includes('employee') || query.includes('staff') || query.includes('team')) {
      const [results] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role LIKE '%Employee%'");
      const count = results[0].count || 0;
      responseText = `We have **${count} employees** currently registered in the ERP system.`;
    }
    // Intent: Projects
    else if (query.includes('project') || query.includes('task')) {
      const [results] = await db.promise().query("SELECT COUNT(*) as count FROM projects WHERE status = 'Active' OR status = 'In Progress'");
      const count = results[0].count || 0;
      responseText = `There are **${count} active projects** currently being worked on by the team.`;
    }
    // Intent: Greeting
    else if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      responseText = "Hello! I am your AI ERP Assistant. How can I help you today? I can pull data about our clients, revenue, proposals, or employees.";
    }

    res.json({
      success: true,
      reply: responseText
    });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ success: false, reply: "I'm having trouble connecting to the database right now." });
  }
});

module.exports = router;
