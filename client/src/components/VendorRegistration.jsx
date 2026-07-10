import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import logo from '../assets/logo_transparent.png';
import { Building2, User, Mail, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

const VendorRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    companyName: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register-vendor', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        navigate('/login'); // Redirect to login
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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
              Scale Your <br className="hidden md:block" />
              Vendor <span className="text-blue-500">Business.</span>
            </h2>

            <p className="hidden md:block text-slate-400 text-lg font-medium leading-relaxed max-w-sm text-center">
              Register your company and get access to dedicated business tools, CRM modules, and enterprise resources tailored for your growth.
            </p>
          </div>

          <div className="hidden md:flex relative z-10 mt-12 md:mt-0 items-center justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">
            <div className="w-12 h-[1px] bg-slate-800"></div>
            Trusted by 500+ Vendors
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[60%] p-8 sm:p-10 md:px-16 md:pt-16 md:pb-24 flex flex-col justify-center bg-white rounded-[32px] rounded-t-none md:rounded-t-[32px] md:rounded-l-none border border-slate-100 md:border-l-0">
          <div className="mb-10 text-center md:text-left mt-4 md:mt-0">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Vendor Registration</h3>
            <p className="text-slate-500 font-medium">Create your business vendor account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input
                    name="firstName"
                    type="text"
                    required
                    pattern="[A-Za-z\s]{4,}"
                    title="Name must contain only letters and be at least 4 characters long"
                    placeholder="John"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 text-sm"
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input
                    name="lastName"
                    type="text"
                    required
                    pattern="[A-Za-z\s]{4,}"
                    title="Name must contain only letters and be at least 4 characters long"
                    placeholder="Doe"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 text-sm"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  name="companyName"
                  type="text"
                  required
                  placeholder="Acme Corporation"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  name="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold text-slate-900 text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-blue-50/50 border border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {loading ? 'Creating Account...' : (
                <>
                  Register Vendor <ArrowRight size={16} className="ml-1" />
                </>
              )}
            </button>
            <div className="text-center mt-6">
              <p className="text-sm font-medium text-slate-500">
                Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;
