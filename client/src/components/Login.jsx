import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Lock, ArrowRight, UserPlus, ShieldCheck } from 'lucide-react';
import axios from '../axiosConfig';
import logo from '../assets/logo_transparent.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    // 1. Check for valid token and handle session_expired
    const urlParams = new URLSearchParams(window.location.search);
    const sessionExpired = urlParams.get('session_expired');
    
    if (sessionExpired) {
      toast.error('Your session has expired. Please log in again.');
      // Clean up URL without refreshing
      window.history.replaceState({}, document.title, '/login');
    }

    const token = localStorage.getItem('token');
    if (token && !sessionExpired) {
      // Instead of blind redirect, validate token
      handleAutoLogin(token);
    }

    // 2. Handle Auto-login from URL (if applicable)
    const urlParamsB = new URLSearchParams(window.location.search);
    const urlToken = urlParamsB.get('token');
    if (urlToken) {
      handleAutoLogin(urlToken);
    }
  }, [navigate]);

  const handleAutoLogin = async (token) => {
    setLoading(true);
    try {
      // Validate token and get user info
      const res = await axios.get(`/api/auth/profile`);

      if (res.data.success) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        toast.success(`Auto-logged in as System SuperAdmin`);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error('Auto-login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter credentials');
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        // Clear session-specific flags to ensure fresh state
        localStorage.removeItem('activeTab');
        localStorage.removeItem('face_enrolled');
        toast.success(`Welcome back, ${response.data.user.name}!`);

        // Redirect to dashboard instead of landing page
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Please enter your email');

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email: forgotEmail });
      if (res.data.success) {
        toast.success('Reset link sent to your email!');
        setShowForgot(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
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
              Elevate Your <br className="hidden md:block" />
              Business <span className="text-blue-500">Success.</span>
            </h2>

            <p className="hidden md:block text-slate-400 text-lg font-medium leading-relaxed max-w-sm text-center">
              Log in to access your dashboard, manage operations, and drive your business forward with our integrated tools.
            </p>
          </div>

          <div className="hidden md:flex relative z-10 mt-12 md:mt-0 items-center justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">
            <div className="w-12 h-[1px] bg-slate-800"></div>
            Everything in One Place
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-[60%] p-8 sm:p-10 md:px-16 md:pt-16 md:pb-24 flex flex-col justify-center bg-white rounded-[32px] rounded-t-none md:rounded-t-[32px] md:rounded-l-none border border-slate-100 md:border-l-0">
          <div className="mb-10 text-center md:text-left mt-4 md:mt-0">
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Account Login</h3>
            <p className="text-slate-500 font-medium">Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
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
                  className="w-full pl-12 pr-4 py-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {loading ? 'Authenticating...' : (
                <>
                  Sign In <ArrowRight size={16} className="ml-1" />
                </>
              )}
            </button>
            <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-500">
                New here? <Link to="/register" className="text-blue-600 font-bold hover:underline">Create Account</Link>
              </p>
              <Link
                to="/vendor-register"
                className="px-6 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-slate-100 transition-all whitespace-nowrap"
              >
                Vendor Access
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl border border-slate-100 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 right-0 p-6">
              <button
                onClick={() => setShowForgot(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Reset Password</h3>
              <p className="text-slate-500 text-sm font-medium">Enter your work email and we'll send you a secure link to reset your password.</p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-sm"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${loading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                {loading ? 'Sending...' : (
                  <>
                    Send Reset Link <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
