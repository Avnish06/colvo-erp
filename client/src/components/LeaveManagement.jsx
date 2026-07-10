import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Calendar, FileText, Check, X, Clock } from 'lucide-react';

const LeaveManagement = ({ initialAction }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(initialAction === 'apply');
  const [formData, setFormData] = useState({
    leave_type: 'Casual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentLeaveId, setCurrentLeaveId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Developer';

  useEffect(() => {
    fetchLeaves();
    if (initialAction === 'apply') {
      setIsApplyModalOpen(true);
    }
  }, [initialAction]);

  const fetchLeaves = async () => {
    const url = isAdmin ? '/api/leaves' : `/api/leaves/${user.id}`;
    try {
      const res = await axios.get(url);
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/leaves/apply', {
        ...formData,
        user_id: user.id
      });
      if (res.data.success) {
        toast.success('Leave application submitted');
        setIsApplyModalOpen(false);
        fetchLeaves();
      }
    } catch (err) {
      toast.error('Error applying for leave');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (status === 'Rejected') {
      setCurrentLeaveId(id);
      setIsRejectModalOpen(true);
      return;
    }

    try {
      const res = await axios.put(`/api/leaves/${id}`, { status });
      if (res.data.success) {
        toast.success(`Leave ${status}`);
        fetchLeaves();
      }
    } catch (err) {
      toast.error('Error updating leave status');
    }
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      return toast.warning('Please provide a reason for rejection');
    }

    try {
      const res = await axios.put(`/api/leaves/${currentLeaveId}`, {
        status: 'Rejected',
        rejection_reason: rejectionReason
      });
      if (res.data.success) {
        toast.success('Leave Rejected');
        setIsRejectModalOpen(false);
        setRejectionReason('');
        fetchLeaves();
      }
    } catch (err) {
      toast.error('Error rejecting leave');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{isAdmin ? 'Leave Approvals' : 'My Leave Requests'}</h3>
          <p className="text-gray-500 font-medium">{isAdmin ? 'Review and manage employee leave requests' : 'Track and apply for your leaves'}</p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Calendar size={20} /> Apply for Leave
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Reason / Remarks</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={isAdmin ? 6 : 4} className="px-6 py-8 text-center text-gray-500">Loading history...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 4} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
              ) : leaves.map((leaf) => (
                <tr key={leaf.id} className="hover:bg-gray-50 transition-colors">
                  {isAdmin && <td className="px-6 py-4 text-sm font-semibold text-gray-900">{leaf.employee_name}</td>}
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">{leaf.leave_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(leaf.start_date).toLocaleDateString()} - {new Date(leaf.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p className="font-medium">{leaf.reason}</p>
                    {leaf.rejection_reason && (
                      <p className="text-[11px] text-red-500 bg-red-50 px-2 py-1 rounded mt-1 border border-red-100 italic">
                        <strong>Rejected:</strong> {leaf.rejection_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${leaf.status === 'Approved' ? 'bg-green-100 text-green-600' :
                      leaf.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                      {leaf.status}
                    </span>
                  </td>
                  {isAdmin && leaf.status === 'Pending' && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => handleStatusUpdate(leaf.id, 'Approved')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-100"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(leaf.id, 'Rejected')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                  {isAdmin && leaf.status !== 'Pending' && <td className="px-6 py-4 text-right text-gray-400 text-xs italic">Reviewed</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-blue-50">
              <h3 className="text-xl font-bold text-blue-900">Apply for Leave</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleApply} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Leave Type</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                >
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Paid</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Start Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">End Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Reason</label>
                <textarea
                  rows="3"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-red-50 border-b border-red-100 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-xl font-black text-red-900 tracking-tight">Rejection Reason</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-red-400 hover:text-red-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-1">Why are you rejecting this request?</label>
                <textarea
                  rows="4"
                  required
                  placeholder="e.g., Heavy workload this month, please reschedule..."
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none font-bold text-gray-700 resize-none transition-all"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                ></textarea>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmRejection}
                  className="w-full py-4 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="w-full py-4 bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-widest rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
