import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Search, UserCog, Shield, User } from 'lucide-react';

const AssignRoles = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const lowerTerm = (searchTerm || '').toLowerCase();
    const filtered = users.filter(user =>
      (user.name || '').toLowerCase().includes(lowerTerm) ||
      (user.email || '').toLowerCase().includes(lowerTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/roles')
      ]);

      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
        setFilteredUsers(usersRes.data.data);
      }
      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data);
      }
    } catch (err) {
      toast.error('Error loading data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId, userName, userEmail) => {
    try {
      // Optimistic update
      const updatedUsers = users.map(u =>
        u.id === userId ? { ...u, role_id: parseInt(newRoleId) } : u
      );
      setUsers(updatedUsers);

      await axios.put(`/api/employees/${userId}/role`, { role_id: newRoleId });
      toast.success(`Role updated for ${userName}`);

      // Audit Log
      const role = roles.find(r => r.id == newRoleId);
      const roleName = role ? role.name : 'Unknown';
      const currentUser = JSON.parse(localStorage.getItem('user'));

      await axios.post('/api/audit', {
        user_id: currentUser ? currentUser.id : 0,
        action: 'ASSIGN_ROLE',
        details: `Changed ${userName}'s (${userEmail}) role to ${roleName}`
      });

    } catch (err) {
      toast.error('Error updating role');
      fetchInitialData(); // Revert on error
    }
  };

  const getRoleColor = (roleId) => {
    switch (roleId) {
      case 1: return 'bg-purple-100 text-purple-600 border-purple-200'; // Super Admin
      case 2: return 'bg-blue-100 text-blue-600 border-blue-200';     // Admin
      default: return 'bg-gray-100 text-gray-600 border-gray-200';      // Employee
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCog className="text-blue-600" />
            Assign Roles
          </h2>
          <p className="text-gray-500 text-sm mt-1">Manage user access levels and permissions dynamically.</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Assign New Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                          {(user.name || user.email || '').charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role_id)}`}>
                        {roles.find(r => r.id === user.role_id)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative w-48">
                        <select
                          className="w-full appearance-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer hover:bg-gray-100"
                          value={user.role_id || ''}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.name || 'Unknown', user.email || '')}
                          disabled={user.role_id === 1 && user.email === 'admin@example.com'}
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignRoles;
