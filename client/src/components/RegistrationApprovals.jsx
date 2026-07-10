import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, User, Mail, Shield, Clock, Search } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const RegistrationApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const isSuperAdmin = user?.role === 'Super Admin';
  const isDeveloper = user?.role === 'Developer';

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const res = await axios.get('/api/users/pending');
      if (res.data.success) {
        setPendingUsers(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching pending registrations');
    } finally {
      setLoading(false);
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState({ id: null, status: null });

  const showStatusConfirm = (id, status) => {
    setPendingAction({ id, status });
    setShowConfirm(true);
  };

  const performStatusUpdate = async () => {
    const { id, status } = pendingAction;
    if (!id || !status) return;
    try {
      const res = await axios.put(`/api/users/status/${id}`, { status });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchPendingUsers();
      }
    } catch (err) {
      toast.error('Error updating user status');
    } finally {
      setShowConfirm(false);
      setPendingAction({ id: null, status: null });
    }
  };

  const cancelStatusUpdate = () => {
    setShowConfirm(false);
    setPendingAction({ id: null, status: null });
  };

  const filteredUsers = pendingUsers.filter(u =>
    (u.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (u.email || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (u.employee_id || '').toString().toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // Employees can be approved by Admin or Super Admin
  // Admins can ONLY be approved by Super Admin
  const canApprove = (targetRole) => {
    if (isDeveloper || isSuperAdmin) return true;
    if (user?.role === 'Admin' && (targetRole === 'Employee ERP' || targetRole === 'Employee CRM')) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Registration Approvals</h2>
          <ConfirmModal
            isOpen={showConfirm}
            title="Confirm Action"
            message={`Are you sure you want to ${(pendingAction.status || '').toLowerCase()} this user?`}
            onConfirm={performStatusUpdate}
            onCancel={cancelStatusUpdate}
            confirmText="Proceed"
            cancelText="Cancel"
          />
          <p className="text-sm text-gray-500">
            {isDeveloper
              ? 'Master Control: Direct approval of all registration requests.'
              : isSuperAdmin
                ? 'Stage 2: Final approval of requests already approved by an Admin.'
                : 'Stage 1: Initial review of new registration requests.'}
          </p>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading pending requests...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-20 text-center text-gray-500">
            <Clock size={48} className="mx-auto mb-4 text-gray-200" />
            <h3 className="text-lg font-bold text-gray-900">No Pending Requests</h3>
            <p className="text-sm">All registration requests have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Requested Role</th>
                  <th className="px-6 py-4">Approval Stage</th>
                  <th className="px-6 py-4">Date Requested</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          {(u.name || u.email || '').charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{u.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {u.employee_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'Admin' ? 'bg-amber-100 text-amber-700' :
                        u.role === 'Employee CRM' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">
                      <span className={`flex items-center gap-1 ${isDeveloper ? 'text-violet-600' : isSuperAdmin ? 'text-amber-600' : 'text-blue-600'}`}>
                        <Shield size={14} /> {isDeveloper ? 'Master Approval (Developer)' : isSuperAdmin ? 'Final Gate (Super Admin)' : 'Initial Gate (Admin)'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.joined_at ? new Date(u.joined_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canApprove(u.role) ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() => showStatusConfirm(u.id, 'Approved')}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            onClick={() => showStatusConfirm(u.id, 'Rejected')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">Super Admin Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationApprovals;
