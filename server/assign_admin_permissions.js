const db = require('./config/db');

const assignAdminPermissions = async () => {
  try {
    console.log('Assigning Admin permissions...');

    // 1. Fetch ALL permissions first
    const [allPerms] = await db.promise().query('SELECT id, name FROM permissions');
    console.log('Available Permissions:', allPerms.map(p => p.name));

    // 2. Define desired Admin permissions (Title Case matching DB)
    const desiredPerms = [
      'View Dashboard',
      'Manage Users',       // Covers Employees
      'View Attendance',
      // 'Manage Attendance', // If exists
      'View Leaves',        // If exists
      'Manage Leaves',      // If exists
      'View Payroll',       // If exists
      'Manage Payroll',     // If exists
      'Manage Projects',
      'Manage Tasks',
      'View Reports'
    ];

    // 3. Filter IDs based on name matching (case insensitive for safety)
    const targetPermIds = allPerms
      .filter(p => desiredPerms.some(dp => dp.toLowerCase() === p.name.toLowerCase()))
      .map(p => p.id);

    if (targetPermIds.length === 0) {
      console.log('No matching permissions found.');
      process.exit(0);
    }

    const roleId = 2; // Admin Role ID

    // 4. Clear existing permissions for Admin
    await db.promise().query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

    // 5. Insert new permissions
    const values = targetPermIds.map(permId => [roleId, permId]);
    if (values.length > 0) {
      await db.promise().query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);
    }

    console.log(`Successfully assigned ${values.length} permissions to Admin role.`);
    console.log('Assigned IDs:', targetPermIds);

    // Log names of assigned permissions
    const assignedNames = allPerms.filter(p => targetPermIds.includes(p.id)).map(p => p.name);
    console.log('Assigned Names:', assignedNames);

    process.exit(0);

  } catch (err) {
    console.error('Error assigning permissions:', err);
    process.exit(1);
  }
};

assignAdminPermissions();
