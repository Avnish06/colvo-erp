import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Bell, Send, User, AlertCircle, CheckCircle2, Info, AlertTriangle, Activity } from 'lucide-react';
const NotificationCenter = ({ targetNotificationId, clearTargetNotification, refreshStats }) => {
  const [employees, setEmployees] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    message: '',
    type: 'info'
  });

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Developer';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (isAdmin) {
        const empRes = await axios.get('/api/employees/list');
        if (empRes.data.success) setEmployees(empRes.data.data);
      }

      // Fetch notifications for the authenticated user.
      const notifRes = await axios.get('/api/notifications/user');
      console.debug('NotificationCenter fetchData response:', notifRes && notifRes.data);
      setNotifications(notifRes.data.data || []);
    } catch (err) {
      console.error('Error fetching notifications/employees:', err);
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/notifications/send', formData);
      if (res.data.success) {
        toast.success('Notification sent');
        setFormData({ user_id: '', title: '', message: '', type: 'info' });
      }
    } catch (err) {
      toast.error('Error sending notification');
    }
  };

  const markAsRead = async (id) => {
    try {
      if (String(id).startsWith('ann-')) {
        const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        if (!readAnnouncements.includes(id)) {
          readAnnouncements.push(id);
          localStorage.setItem('read_announcements', JSON.stringify(readAnnouncements));
        }
        fetchData();
        if (refreshStats) refreshStats();
        return;
      }

      const res = await axios.put(`/api/notifications/${id}/read`, {});
      if (res.data.success) {
        fetchData();
        if (refreshStats) refreshStats();
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {});
      // Mark all announcements as read in localStorage
      const annIds = notifications.filter(n => String(n.id).startsWith('ann-') && !n.is_read).map(n => n.id);
      if (annIds.length > 0) {
        const readAnnouncements = JSON.parse(localStorage.getItem('read_announcements') || '[]');
        annIds.forEach(id => { if (!readAnnouncements.includes(id)) readAnnouncements.push(id); });
        localStorage.setItem('read_announcements', JSON.stringify(readAnnouncements));
      }
      fetchData();
      if (refreshStats) refreshStats();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [hoveredNotification, setHoveredNotification] = useState(null);

  useEffect(() => {
    if (targetNotificationId && notifications.length > 0) {
      console.debug('Attempting to open notification:', targetNotificationId);
      const targetNotif = notifications.find(n => String(n.id) === String(targetNotificationId));
      if (targetNotif) {
        setSelectedNotification(targetNotif);
        if (clearTargetNotification) clearTargetNotification();
      } else {
        console.warn('Target notification not found in state:', targetNotificationId);
      }
    }
  }, [targetNotificationId, notifications, clearTargetNotification]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={20} />;
      case 'error': return <AlertCircle className="text-rose-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const getBackgroundByType = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-50/50 border-emerald-100';
      case 'warning': return 'bg-amber-50/50 border-amber-100';
      case 'error': return 'bg-rose-50/50 border-rose-100';
      default: return 'bg-blue-50/50 border-blue-100';
    }
  };

  const displayNotif = hoveredNotification || selectedNotification;

  return (
    <div className="space-y-6 pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight text-center md:text-left">Direct Alerts</h2>
          <p className="text-slate-500 font-medium text-center md:text-left">Manage and track organization-wide alerts.</p>
        </div>
        {selectedNotification && (
          <button
            onClick={() => { setSelectedNotification(null); setHoveredNotification(null); }}
            className="w-full md:w-auto px-4 py-3 md:py-2 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <Send size={16} /> Send New Notification
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List or Send Form */}
        <div className="lg:col-span-1">
          {!selectedNotification && isAdmin ? (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Send size={20} />
                </div>
                Send Notification
              </h3>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Recipient</label>
                  <select
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm bg-slate-50/50 font-medium"
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Priority Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['info', 'success', 'warning', 'error'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${formData.type === t
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                          : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm bg-slate-50/50 font-medium"
                    placeholder="e.g., System Update"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Message</label>
                  <textarea
                    required
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-sm bg-slate-50/50 font-medium"
                    placeholder="Detailed message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Send size={18} /> Broadcast Message
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-16rem)]">
              <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
                <h3 className="text-xl font-bold text-slate-900">Notifications</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {notifications.filter(n => !n.is_read).length} Unread
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 font-medium italic">Synchronizing...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell size={48} className="mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-500 font-medium">Empty inbox.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => setSelectedNotification(notif)}
                      onMouseEnter={() => setHoveredNotification(notif)}
                      onMouseLeave={() => setHoveredNotification(null)}
                      className={`p-5 cursor-pointer transition-all border-l-4 ${selectedNotification?.id === notif.id ? 'border-blue-600 bg-blue-50/30' : 'border-transparent hover:bg-slate-50/80'} ${!notif.is_read && selectedNotification?.id !== notif.id ? 'bg-orange-50/20' : ''}`}
                    >
                      <div className="flex flex-wrap gap-4">
                        <div className="mt-1 flex-shrink-0">{getTypeIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
                            <h4 className={`font-bold text-sm truncate ${notif.is_read ? 'text-slate-500' : 'text-slate-900'}`}>{notif.title}</h4>
                            <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap ml-2">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Original List (if not selected) or Details (if selected) */}
        <div className="lg:col-span-2">
          {!selectedNotification ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-[calc(100vh-16rem)] flex flex-col">
              <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                <p className="text-xs text-slate-400 font-semibold italic">Select a notification to view details</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedNotification(notif)}
                    onMouseEnter={() => setHoveredNotification(notif)}
                    onMouseLeave={() => setHoveredNotification(null)}
                    className={`p-6 cursor-pointer transition-all group ${notifications.filter(n => !n.is_read).length > 0 && !notif.is_read ? 'bg-blue-50/10' : ''} hover:bg-slate-50`}
                  >
                    <div className="flex flex-wrap gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${getBackgroundByType(notif.type).split(' ')[0]}`}>
                        {getTypeIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-1">
                          <h4 className="font-bold text-slate-900 text-lg tracking-tight">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">{new Date(notif.created_at).toLocaleString([], { hour12: true })}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">{notif.message}</p>
                        <div className="flex flex-wrap items-center gap-4">
                          {!notif.is_read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                              className="text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-[0.15em] flex items-center gap-1.5"
                            >
                              <CheckCircle2 size={12} /> Mark as Read
                            </button>
                          )}
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5 ml-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            {notif.action_type || 'SYSTEM_GEN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-full ${getBackgroundByType(displayNotif.type).split(' ')[0]}`}></div>

                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-4 rounded-2xl shadow-inner ${getBackgroundByType(displayNotif.type).split(' ')[0]}`}>
                      {React.cloneElement(getTypeIcon(displayNotif.type), { size: 32 })}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Received On</span>
                      <span className="text-sm font-bold text-slate-900">{new Date(displayNotif.created_at).toLocaleString([], { hour12: true })}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{displayNotif.title}</h3>
                    <div className="h-1 w-20 bg-blue-500 rounded-full mb-6"></div>
                    <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{displayNotif.message}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Performed By</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-blue-600 shadow-sm">
                          {displayNotif.triggered_by_name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{displayNotif.triggered_by_name || 'System Operator'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Triggerer</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Action</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                          <Activity size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{displayNotif.action_type || 'GENERAL_ACTION'}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">System Key</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    {!displayNotif.is_read && (
                      <button
                        onClick={() => markAsRead(displayNotif.id)}
                        className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                      >
                        <CheckCircle2 size={20} /> Resolve & Mark Read
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedNotification(null); setHoveredNotification(null); }}
                      className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all border border-slate-200"
                    >
                      Close View
                    </button>
                  </div>
                </div>
              </div>

              {/* Hover Details Panel (Secondary) */}
              <div className="bg-slate-950 p-6 rounded-[2rem] shadow-2xl border border-slate-800/50 flex flex-wrap items-center justify-between gap-4 text-slate-400">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    <Info size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-wider">Quick Audit Context</h5>
                    <p className="text-[11px] text-slate-500 font-medium">Auto-generated event log for this session.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black text-white">REF_ID: #00{displayNotif.id}</p>
                  <p className="text-[9px] font-bold uppercase text-slate-600 tracking-tighter">Secure Hash: Verified</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
