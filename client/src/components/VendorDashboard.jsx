import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Building2,
  Box,
  LogOut,
  ShieldCheck,
  Package,
  LayoutDashboard,
  ExternalLink,
  Info,
  BadgeCheck,
  Lock
} from 'lucide-react';
import AccountControl from './AccountControl';

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [vendorData, setVendorData] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (err) {
    user = null;
  }

  useEffect(() => {
    if (!user || user.role !== 'Vendor') {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, toolsRes] = await Promise.all([
        axios.get(`/api/vendors/dashboard/${user.id}`),
        axios.get(`/api/vendors/tools/${user.id}`)
      ]);

      if (dashRes.data.success) {
        setVendorData(dashRes.data.data);
      } else {
        toast.error(dashRes.data.message || 'Failed to load dashboard');
      }

      if (toolsRes.data.success) {
        setTools(toolsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching vendor data:', err);
      toast.error('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleLaunchTool = (tool) => {
    if (!tool.enabled || !tool.tool_url) return;
    window.open(tool.tool_url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-bold animate-pulse text-xs uppercase tracking-widest">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  // Fallback if data loading failed completely
  if (!vendorData?.vendor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-12 shadow-xl max-w-md w-full text-center space-y-6">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-500">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Dashboard Unavailable</h2>
          <p className="text-slate-500 font-medium">We couldn't retrieve your vendor profile. Please try logging in again or contact support.</p>
          <button onClick={handleLogout} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const { vendor, toolCount } = vendorData;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shrink-0">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
            <ShieldCheck size={28} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setActiveTab('Dashboard')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'Dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('Account')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'Account' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            Change Password
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          <button
            onClick={handleLogout}
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            title="Logout"
          >
            <LogOut size={22} />
          </button>
        </div>
      </nav>

      {/* Internal Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-8">
        {activeTab === 'Account' ? (
          <div className="max-w-4xl mx-auto">
            <AccountControl />
          </div>
        ) : (
          <main className="max-w-7xl mx-auto w-full space-y-8 min-h-full">
            {/* Welcome Section */}
            <div className="bg-slate-950 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black">Welcome, {vendor?.first_name}!</h2>
                  <p className="text-slate-400 font-medium max-w-md">
                    Manage your business profile and access tools assigned to you by the development team.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                    <span className="block text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Assigned Tools</span>
                    <span className="text-3xl font-black">{toolCount || 0}</span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"></div>
              <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl"></div>
            </div>

            {/* Assigned Tools Section */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Package size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-900">Your Tools & Services</h3>
              </div>

              {tools.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Box size={32} />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">No tools assigned yet</h4>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    Please contact the Developer to get access to specific management modules.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tools.map((tool) => (
                    <div key={tool.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                          <LayoutDashboard size={28} />
                        </div>
                        {tool.enabled ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full">Active</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full">Inactive</span>
                        )}
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-2">{tool.tool_name}</h4>
                      <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                        {tool.description || 'Access restricted module for business management and operations.'}
                      </p>
                      <button
                        onClick={() => handleLaunchTool(tool)}
                        className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all ${tool.enabled && tool.tool_url ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                        disabled={!tool.enabled || !tool.tool_url}
                      >
                        {tool.tool_url ? 'Launch Tool' : 'URL Not Set'} <ExternalLink size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Company Profile */}
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Building2 size={20} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Company Profile</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Company</span>
                    <span className="font-black text-slate-900">{vendor?.company_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Owner</span>
                    <span className="font-black text-slate-900">{vendor?.first_name} {vendor?.last_name}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-slate-50">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Email</span>
                    <span className="font-black text-slate-900">{vendor?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Phone</span>
                    <span className="font-black text-slate-900">{vendor?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Support / Contact */}
              <div className="bg-indigo-50 rounded-3xl p-8 border border-indigo-100 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-600 rounded-lg text-white">
                      <Info size={20} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">Need Assistance?</h3>
                  </div>
                  <p className="text-indigo-900/60 font-medium leading-relaxed mb-8">
                    If you encounter any issues or need additional tools assigned to your account, please reach out to our system administration team.
                  </p>
                </div>
                <a
                  href={`mailto:support@example.com`}
                  className="bg-white text-indigo-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-center shadow-lg shadow-indigo-200 hover:shadow-xl transition-all border border-indigo-100"
                >
                  Contact Support Team
                </a>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 p-8 text-center">
        <p className="text-slate-400 text-sm font-medium">© 2026 — Business Vendor Panel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default VendorDashboard;
