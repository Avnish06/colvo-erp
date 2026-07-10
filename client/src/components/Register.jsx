import React, { useState } from 'react';
import axios from '../axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Mail, Lock, UserPlus, ShieldCheck, ChevronLeft } from 'lucide-react';
import logo from '../assets/logo_transparent.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '3' // Default to Employee
  });
  const [loading, setLoading] = useState(false);
  const [registeredId, setRegisteredId] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`/api/auth/register`, formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setRegisteredId(res.data.unique_id);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (registeredId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Registration Received!</h2>
          <p className="text-gray-500 mb-6">Your application is now pending approval from an administrator.</p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Your Unique ID</p>
            <p className="text-4xl font-black text-indigo-600 tracking-tighter">{registeredId}</p>
          </div>

          <p className="text-sm text-gray-400 mb-8 px-4">
            Please save this ID. You will be able to log in once your account is approved.
          </p>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
          >
            <ChevronLeft size={18} /> Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 md:py-20 px-4">
      <div className="max-w-5xl w-full bg-white md:rounded-[32px] shadow-2xl flex flex-col md:flex-row h-auto relative">
        {/* Left Side: Brand Panel */}
        <div className="flex w-full md:w-[40%] bg-[#0a0c10] p-8 md:p-14 text-white flex-col justify-center md:justify-between relative overflow-hidden rounded-[32px] rounded-b-none md:rounded-b-[32px] md:rounded-r-none">
          {/* Background Decoration */}
          <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4">
              <img src={logo} alt="Brand Logo" className="h-24 w-24 md:h-48 md:w-48 object-contain" />
            </div>

            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-8 leading-[1.1] tracking-tight text-center">
              Join Our <br className="hidden md:block" />
              Professional <span className="text-blue-500">Network.</span>
            </h2>

            <p className="hidden md:block text-slate-400 text-lg font-medium leading-relaxed max-w-sm text-center">
              Register your account today and connect with thousands of professionals in our growing ecosystem.
            </p>
          </div>

          <div className="hidden md:flex relative z-10 mt-12 md:mt-0 items-center justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">
            <div className="w-12 h-[1px] bg-slate-800"></div>
            Built for Growth
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[60%] p-8 sm:p-10 md:px-16 md:pt-16 md:pb-24 flex flex-col justify-center bg-white rounded-[32px] rounded-t-none md:rounded-t-[32px] md:rounded-l-none border border-slate-100 md:border-l-0">
          <div className="mb-8 text-center md:text-left mt-4 md:mt-0">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Create Account</h3>
            <p className="text-slate-500 font-medium">Register as a new organization member</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="text"
                  required
                  pattern="[A-Za-z\s]{4,}"
                  title="Name must contain only letters and be at least 4 characters long"
                  placeholder="Your Name"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desired Role</label>
              <select
                className="block w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 appearance-none cursor-pointer text-sm"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              >
                <option value="3">👩‍💼 Employee ERP</option>
                <option value="4">🤝 Employee CRM</option>
              </select>
            </div>

            <button
              disabled={loading}
              className={`w-full py-4 mt-2 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {loading ? 'Processing...' : 'Submit Registration'}
            </button>
            <div className="text-center pt-4">
              <p className="text-sm font-medium text-slate-500">
                Already member? <Link to="/login" className="text-blue-600 font-bold hover:underline">Log In</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
