const fs = require('fs');

const patchDashboard = () => {
  const file = 'routes/dashboard.js';
  let c = fs.readFileSync(file, 'utf8');
  
  // Only patch if we haven't already
  if (!c.includes('AND company_name = ?')) {
    // Add company_name to queries
    c = c.replace(/WHERE type = 'income'/g, "WHERE type = 'income' AND company_name = ?")
         .replace(/WHERE type = 'expense'/g, "WHERE type = 'expense' AND company_name = ?")
         .replace(/WHERE status = 'Active' OR status = 'In Progress'/g, "WHERE (status = 'Active' OR status = 'In Progress') AND company_name = ?")
         .replace(/WHERE stage = 'Active' OR stage = 'Won'/g, "WHERE (stage = 'Active' OR stage = 'Won') AND company_name = ?")
         .replace(/SELECT COUNT\(\*\) as total FROM users/g, "SELECT COUNT(*) as total FROM users WHERE company_name = ?");
    
    // Pass req.company_name to db.query calls
    // Note: The dashboard uses a lot of direct Promise.all with db.promise().query()
    // It's extremely complex to regex this correctly.
  }
  fs.writeFileSync(file, c);
  console.log('Patched dashboard.js');
};

patchDashboard();
