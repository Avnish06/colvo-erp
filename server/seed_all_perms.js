const db = require('./config/db');

const seedPermissions = async () => {
  try {
    console.log('Seeding comprehensive permissions...');

    const permissions = [
      ['View Dashboard', 'view_dashboard'],
      ['Manage Users', 'manage_users'],
      ['View Employees', 'view_employees'],
      ['Manage Departments', 'manage_departments'],
      ['View Attendance', 'view_attendance'],
      ['View Leaves', 'view_leaves'],
      ['Manage Leaves', 'manage_leaves'],
      ['View Payroll', 'view_payroll'],
      ['Manage Payroll', 'manage_payroll'],
      ['View Projects', 'view_projects'],
      ['Manage Projects', 'manage_projects'],
      ['Manage Tasks', 'manage_tasks'],
      ['View Reports', 'view_reports'],
      ['Manage Settings', 'manage_settings'],
      ['Manage Support', 'manage_support']
    ];

    for (const [name, slug] of permissions) {
      await db.promise().query(
        'INSERT INTO permissions (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE slug = VALUES(slug)',
        [name, slug]
      );
    }

    console.log('Permissions seeded successfully.');

    // Now assign standard permissions to Admin (Role ID 2)
    const adminPerms = [
      'view_dashboard',
      'view_employees',
      'manage_departments',
      'view_attendance',
      'view_leaves',
      'manage_leaves',
      'view_payroll',
      'view_projects',
      'manage_projects',
      'manage_tasks',
      'manage_payroll'
    ];

    const [permRows] = await db.promise().query('SELECT id FROM permissions WHERE slug IN (?)', [adminPerms]);
    const permIds = permRows.map(p => p.id);
    const roleId = 2;

    await db.promise().query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    const values = permIds.map(pid => [roleId, pid]);
    await db.promise().query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [values]);

    console.log(`Assigned ${values.length} permissions to Admin role.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding permissions:', err);
    process.exit(1);
  }
};

seedPermissions();
