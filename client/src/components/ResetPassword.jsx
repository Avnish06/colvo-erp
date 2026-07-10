import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import axios from '../axiosConfig';
import logo from '../assets/logo_transparent.png';

const ResetPassword = () => {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/reset-password', {
        token,
        newPassword
      });

      if (res.data.success) {
        setSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => navigate('/login'), 5000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[32px] shadow-2xl p-12 text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="text-green-600" size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Success!</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Your password has been reset successfully. You will be redirected to the login page in a few seconds.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            Go to Login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 md:py-20 px-4">
      <div className="max-w-5xl w-full bg-white md:rounded-[32px] shadow-2xl flex flex-col md:flex-row h-auto relative overflow-hidden">
        {/* Left Side: Brand Panel */}
        <div className="flex w-full md:w-[40%] bg-[#0a0c10] p-8 md:p-14 text-white flex-col justify-center md:justify-between relative overflow-hidden rounded-[32px] rounded-b-none md:rounded-b-[32px] md:rounded-r-none">
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4">
              <img src={logo} alt="Brand Logo" className="h-24 w-24 md:h-40 md:w-40 object-contain" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-4 md:mb-8 leading-[1.1] tracking-tight text-center">
              Secure Your <br className="hidden md:block" />
              <span className="text-blue-500">Account.</span>
            </h2>
            <p className="hidden md:block text-slate-400 text-lg font-medium leading-relaxed max-w-sm text-center">
              Please enter your new password below. Make sure it's strong and unique.
            </p>
          </div>
          <div className="hidden md:flex relative z-10 flex-wrap items-center justify-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <ShieldCheck size={16} className="text-blue-500" />
            End-to-End Encryption
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[60%] p-8 sm:p-10 md:px-16 md:pt-16 md:pb-24 flex flex-col justify-center bg-white rounded-[32px] rounded-t-none md:rounded-t-[32px] md:rounded-l-none border border-slate-100 md:border-l-0">
          <div className="mb-10 text-center md:text-left mt-4 md:mt-0">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Set New Password</h3>
            <p className="text-slate-500 font-medium">Reset your account access securely</p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {loading ? 'Updating...' : (
                <>
                  Update Password <ArrowRight size={16} />
                </>
              )}
            </button>

            <Link
              to="/login"
              className="w-full text-center block text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Back to Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
