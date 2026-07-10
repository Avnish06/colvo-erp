import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

const EmployeeModal = ({ isOpen, onClose, onSave, employee = null }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserRole = currentUser?.role || '';

  // Determine what role IDs this user is allowed to create
  // Admin (role_id=2) can only create Employees (role_id=3 or 4)
  // Super Admin (role_id=1) can create everything (1, 2, 3, 4)
  const isSuperAdmin = currentUserRole === 'Super Admin';
  const isAdmin = currentUserRole === 'Admin';

  const getDefaultRoleId = () => {
    if (isSuperAdmin) return 2; // Default to Admin when Super Admin creates
    return 3; // Default to Employee ERP when Admin creates
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: getDefaultRoleId(),
    department_id: '',
    status: 'Active'
  });
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchRoles();
      if (employee) {
        setFormData({
          ...employee,
          password: '' // Don't show password for editing
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role_id: getDefaultRoleId(),
          department_id: '',
          status: 'Active'
        });
      }
    }
  }, [isOpen, employee]);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get('/api/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching departments');
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles');
      if (res.data.success) {
        let allRoles = res.data.data;
        // Filter roles based on current user's privilege
        if (isSuperAdmin) {
          // Super Admin can create all roles
          // No filter needed, or we can explicitly allow 1,2,3,4
          allRoles = allRoles.filter(r => [1, 2, 3, 4].includes(r.id));
        } else if (isAdmin) {
          // Admin can only create Employees (id=3 or 4)
          allRoles = allRoles.filter(r => r.id === 3 || r.id === 4);
        }
        setRoles(allRoles);
      }
    } catch (err) {
      toast.error('Error fetching roles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.department_id || !formData.role_id) {
      return toast.error('Name, Email, Department, and Role are required');
    }
    try {
      if (employee) {
        await axios.put(`/api/employees/${employee.id}`, formData);
        toast.success('Employee updated');
      } else {
        const res = await axios.post('/api/employees', formData);
        const generatedId = res.data.employee_id;
        toast.success(`Account created! ID: ${generatedId}`);
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving employee');
    }
  };

  // Determine modal title based on creator role
  const getModalTitle = () => {
    if (employee) return 'Edit Account';
    if (isSuperAdmin) return 'Add New Admin / Super Admin';
    return 'Add New Employee';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-blue-50">
          <h3 className="text-xl font-bold text-blue-900">{getModalTitle()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {!employee && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Department</label>
              <select
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Role</label>
              <select
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              {employee ? 'Update Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
