import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { Mail, Hexagon, Building2, Calendar, Lock } from 'lucide-react';
import { toast } from 'react-toastify';

const MyProfile = () => {
  const [user, setUser] = useState(null);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Read the user data from localStorage initially
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdatePassword = async () => {
    if (!passwords.currentPassword) {
      toast.error('Current password is required');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsUpdating(true);
      const res = await axios.put('/api/auth/update-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      
      if (res.data.success) {
        toast.success(res.data.message || 'Password updated successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-medium">Loading profile...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">View your account information and manage your password security.</p>
      </div>

      {/* Main Gradient Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-fuchsia-400 rounded-3xl p-8 shadow-xl shadow-indigo-200 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-4xl font-black text-white shadow-inner backdrop-blur-sm shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="text-center md:text-left text-white">
          <h2 className="text-3xl font-black tracking-tight drop-shadow-sm">{user?.name || 'User Name'}</h2>
          <p className="text-indigo-100 font-medium mt-1 mb-4 flex items-center justify-center md:justify-start gap-2">
            <Mail size={16} /> {user?.email || 'user@example.com'}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold shadow-sm backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-transparent border-[1.5px] border-white"></span>
              {user?.role || 'Employee'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-xs font-bold shadow-sm backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Detail Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Email Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <Mail size={20} strokeWidth={2.5} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</p>
            <p className="text-sm font-black text-slate-800 truncate">{user?.email || 'N/A'}</p>
          </div>
        </div>

        {/* Employee ID Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
            <Hexagon size={20} strokeWidth={2.5} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Employee ID</p>
            <p className="text-sm font-black text-slate-800 truncate">{user?.employee_id || user?.id || 'N/A'}</p>
          </div>
        </div>

        {/* Department Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
            <Building2 size={20} strokeWidth={2.5} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Department</p>
            <p className="text-sm font-black text-slate-800 truncate uppercase">{user?.department_name || 'DEVELOPMENT'}</p>
          </div>
        </div>

        {/* Joined Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Joined</p>
            <p className="text-sm font-black text-slate-800 truncate">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Jun 29, 2026'}</p>
          </div>
        </div>
      </div>

      {/* Security & Password Settings */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <Lock size={20} strokeWidth={2.5} />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Security & Password Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Current Password</label>
            <input 
              type="password" 
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">New Password</label>
            <input 
              type="password" 
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              placeholder="Min. 6 characters"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">Confirm New Password</label>
            <input 
              type="password" 
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Repeat new password"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleUpdatePassword}
            disabled={isUpdating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-indigo-200"
          >
            <Lock size={16} strokeWidth={2.5} />
            {isUpdating ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
