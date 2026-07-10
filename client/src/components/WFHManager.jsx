import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Home,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ClipboardList,
  AlertCircle,
  Briefcase
} from 'lucide-react';

const WFHManager = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Developer';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState(isAdmin ? 'AdminReview' : 'MyRequests'); // 'MyRequests' or 'AdminReview'

  useEffect(() => {
    fetchRequests();
  }, [activeView]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const endpoint = activeView === 'AdminReview' ? '/api/wfh/all' : '/api/wfh/my';
      const res = await axios.get(endpoint);
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error fetching WFH requests';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post('/api/wfh', { date, reason });
      if (res.data.success) {
        toast.success('WFH request submitted');
        setReason('');
        fetchRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await axios.put(`/api/wfh/${id}/status`, { status });
      if (res.data.success) {
        toast.success(`Request ${status}`);
        fetchRequests();
      }
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Home size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Work From Home</h2>
            <p className="text-gray-400 text-sm font-medium">Manage and track remote work requests.</p>
          </div>
        </div>

        {isAdmin && !isAdmin && (
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            {/* Logic removed: Admin doesn't need 'My Requests' */}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submission Form (Only in MyRequests view for Employees) */}
        {activeView === 'MyRequests' && !isAdmin && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 h-fit sticky top-8">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                <Send size={20} className="text-blue-600" />
                Submit Request
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Selected Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reason / Notes</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly explain your WFH reason..."
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-100 transition-all min-h-[120px] resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Send Request'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className={activeView === 'MyRequests' ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <ClipboardList size={22} className="text-blue-600" />
                {activeView === 'AdminReview' ? 'Staff Requests' : 'Request Timeline'}
              </h3>
              <span className="bg-white px-4 py-1.5 rounded-full text-[10px] font-black text-blue-600 border border-blue-100 shadow-sm">
                TOTAL: {requests.length}
              </span>
            </div>

            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading records...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="py-32 flex flex-col items-center gap-5 opacity-40">
                  <Briefcase size={64} className="text-gray-300" />
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No WFH requests found</p>
                </div>
              ) : requests.map((req) => (
                <div key={req.id} className="p-8 hover:bg-blue-50/30 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-start gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        req.status === 'Rejected' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                        {req.status === 'Approved' ? <CheckCircle size={24} /> :
                          req.status === 'Rejected' ? <XCircle size={24} /> :
                            <Clock size={24} />}
                      </div>
                      <div>
                        {activeView === 'AdminReview' && (
                          <p className="text-xs font-black text-blue-600 uppercase tracking-wider mb-1">
                            {req.employee_name} ({req.employee_id})
                          </p>
                        )}
                        <h4 className="font-black text-gray-900 text-lg flex items-center gap-2">
                          {new Date(req.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </h4>
                        <p className="text-gray-500 text-sm font-medium mt-1 leading-relaxed max-w-lg">
                          {req.reason || 'No reason provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                        {req.status}
                      </span>

                      {activeView === 'AdminReview' && req.status === 'Pending' && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'Approved')}
                            className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-90"
                            title="Approve Request"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                            className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-90"
                            title="Reject Request"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-500/20">
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="font-black text-lg underline-offset-4 decoration-blue-300">Remote Verification Policy</h4>
            <p className="text-blue-100 text-sm font-medium">Approved WFH bypasses geofencing, allowing you to mark attendance from any location.</p>
          </div>
        </div>
        <div className="px-6 py-3 border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm bg-white/5">
          Compliance Verified
        </div>
      </div>
    </div>
  );
};

export default WFHManager;
