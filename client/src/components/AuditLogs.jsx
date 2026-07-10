import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Search, Filter, Shield, User, Clock, FileText } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get('/api/audit');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      toast.error('Error loading audit logs');
    } finally {
      setLoading(false);
    }
  };

  const uniqueRoles = ['All', 'Super Admin', 'Admin', 'Employee'];
  const uniqueActions = ['All', ...new Set(logs.map(log => log.action))];

  const getRoleName = (roleId) => {
    switch (roleId) {
      case 1: return 'Super Admin';
      case 2: return 'Admin';
      default: return 'Employee';
    }
  };

  const filteredLogs = logs.filter(log => {
    const roleMatch = roleFilter === 'All' || getRoleName(log.role_id) === roleFilter;
    const actionMatch = actionFilter === 'All' || log.action === actionFilter;
    const searchMatch = (log.details || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (log.user_name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    return roleMatch && actionMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-indigo-600" /> Admin Action Logs
          </h2>
          <p className="text-sm text-gray-500">Monitor system-level activities and changes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Filter by Role</label>
          <select
            className="w-full p-2 border border-gray-200 rounded-lg text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Filter by Action</label>
          <select
            className="w-full p-2 border border-gray-200 rounded-lg text-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">User / Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">Loading logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No logs found matching criteria.</td></tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{log.user_name || 'System'}</p>
                          <p className="text-[10px] uppercase font-bold text-gray-500">{getRoleName(log.role_id)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
