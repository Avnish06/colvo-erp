import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Users,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Building2,
  Package,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Layout,
  MapPin,
  X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const VendorManagement = ({ initialView = 'directory' }) => {
  const [activeView, setActiveView] = useState(initialView);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [assignedTools, setAssignedTools] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [showToolModal, setShowToolModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Forms State
  const [newVendor, setNewVendor] = useState({ email: '', password: '', company_name: '', first_name: '', last_name: '', phone: '' });
  const [toolForm, setToolForm] = useState({ tool_name: '', tool_key: '', description: '', icon: 'Package', tool_url: '' });
  const [assignForm, setAssignForm] = useState({ tool_id: '' });
  const [repoAssignModal, setRepoAssignModal] = useState({ show: false, tool: null, target_vendor_user_id: '' });

  // Map state
  const [showMapModal, setShowMapModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (activeView === 'directory' || activeView === 'repository') fetchVendors();
    if (activeView === 'repository') fetchAvailableTools();
  }, [activeView]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/vendors/list');
      if (res.data.success) setVendors(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTools = async () => {
    try {
      const res = await axios.get('/api/vendors/available-tools');
      if (res.data.success) setAvailableTools(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch tool repository');
    }
  };

  const fetchVendorTools = async (userId) => {
    try {
      const res = await axios.get(`/api/vendors/tools/${userId}`);
      if (res.data.success) setAssignedTools(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch vendor tools');
    }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    if (!newVendor.email || !newVendor.password || !newVendor.company_name) {
      return toast.error('Email, Password, and Company Name are required');
    }
    try {
      const res = await axios.post('/api/vendors/create-manual', newVendor);
      if (res.data.success) {
        toast.success(`Vendor created: ${res.data.vendor_id}`);
        setNewVendor({ email: '', password: '', company_name: '', first_name: '', last_name: '', phone: '' });
        setActiveView('directory');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor');
    }
  };

  const handleCreateGlobalTool = async (e) => {
    e.preventDefault();
    if (!toolForm.tool_name || !toolForm.tool_key || !toolForm.description || !toolForm.tool_url) {
      return toast.error('All tool information fields are required');
    }
    try {
      const res = await axios.post('/api/vendors/available-tools', toolForm);
      if (res.data.success) {
        toast.success('Tool added to repository');
        setToolForm({ tool_name: '', tool_key: '', description: '', icon: 'Package', tool_url: '' });
        fetchAvailableTools();
      }
    } catch (err) {
      toast.error('Failed to add tool');
    }
  };

  const handleDeleteGlobalTool = async (id) => {
    if (!window.confirm('Delete this tool from the global repository?\nThis will also remove it from ALL vendors it was assigned to.')) return;
    try {
      await axios.delete(`/api/vendors/available-tools/${id}`);
      toast.success('Tool deleted from repository and all vendors');
      fetchAvailableTools();
      fetchVendors(); // refresh vendor tool counts
      if (selectedVendor) fetchVendorTools(selectedVendor.user_id); // refresh selected vendor's tool list
    } catch (err) {
      toast.error('Failed to delete tool');
    }
  };

  const handleAssignFromRepo = async (e) => {
    e.preventDefault();
    const tool = availableTools.find(t => t.id === parseInt(assignForm.tool_id));
    if (!tool) return;

    try {
      const res = await axios.post('/api/vendors/tools', {
        vendor_user_id: selectedVendor.user_id,
        tool_name: tool.tool_name,
        tool_key: tool.tool_key,
        description: tool.description,
        icon: tool.icon,
        tool_url: tool.tool_url || null,
        assigned_by: currentUser.id
      });
      if (res.data.success) {
        toast.success('Tool assigned');
        setShowToolModal(false);
        fetchVendorTools(selectedVendor.user_id);
        fetchVendors();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign tool');
    }
  };

  const handleRepoAssign = async (e) => {
    e.preventDefault();
    const { tool, target_vendor_user_id } = repoAssignModal;
    if (!tool || !target_vendor_user_id) return;

    try {
      const res = await axios.post('/api/vendors/tools', {
        vendor_user_id: target_vendor_user_id,
        tool_name: tool.tool_name,
        tool_key: tool.tool_key,
        description: tool.description,
        icon: tool.icon,
        tool_url: tool.tool_url || null,
        assigned_by: currentUser.id
      });
      if (res.data.success) {
        toast.success('Tool assigned successfully');
        setRepoAssignModal({ show: false, tool: null, target_vendor_user_id: '' });
        fetchVendors();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign tool');
    }
  };

  const renderDirectory = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 scale-95 origin-top transition-all duration-300">
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-blue-50 p-2 text-blue-600 rounded-xl">
                <Users size={20} />
              </div>
              <h3 className="font-black text-slate-900">Registered Vendors</h3>
            </div>
            <button onClick={() => setActiveView('add')} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all">
              <Plus size={20} />
            </button>
          </div>
          <div className="p-4 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by company or ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
            {vendors.filter(v => (v.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())).map(v => (
              <button
                key={v.id}
                onClick={() => { setSelectedVendor(v); fetchVendorTools(v.user_id); }}
                className={`w-full p-5 flex items-center justify-between border-b border-slate-50 transition-all hover:bg-blue-50/30 ${selectedVendor?.id === v.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-4 text-left">
                  <div className="bg-white shadow-sm p-3 rounded-2xl text-slate-600">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="font-black text-slate-900">{v.company_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{v.vendor_id}</div>
                  </div>
                </div>
                <div className="bg-blue-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black">
                  {v.toolCount}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7">
        {!selectedVendor ? (
          <div className="h-full min-h-[500px] bg-white rounded-[2rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 p-12 text-center">
            <ShieldCheck size={64} className="mb-6 opacity-10" />
            <h4 className="font-black text-slate-900 text-xl">Select a Vendor to Manage</h4>
            <p className="font-bold max-w-xs mt-2">Oversee tool assignments and business details for your registered ERP partners.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-slate-950 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Partner Profile</div>
                <h3 className="text-3xl font-black mb-1">{selectedVendor.company_name}</h3>
                <div className="flex flex-wrap gap-4 mt-6">
                  <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-wrap items-center gap-2">
                    <Users size={14} className="text-blue-400" />
                    <span className="text-xs font-bold">{selectedVendor.first_name} {selectedVendor.last_name}</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex flex-wrap items-center gap-2">
                    <Settings size={14} className="text-blue-400" />
                    <span className="text-xs font-bold">{selectedVendor.vendor_id}</span>
                  </div>
                  {/* Show Map Location toggle button */}
                  <button 
                    onClick={() => setShowMapModal(true)}
                    className="bg-blue-600/80 backdrop-blur-md px-4 py-2 rounded-xl border border-blue-500/30 flex flex-wrap items-center gap-2 hover:bg-blue-600 transition-colors"
                  >
                    <MapPin size={14} className="text-white" />
                    <span className="text-xs font-bold text-white">View Exact Location</span>
                  </button>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <Package size={24} />
                  </div>
                  <h3 className="font-black text-slate-900 text-xl">Deployed Tools</h3>
                </div>
                <button
                  onClick={() => { fetchAvailableTools(); setShowToolModal(true); }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2"
                >
                  <Plus size={18} /> Assign New
                </button>
              </div>
              <div className="divide-y divide-slate-50 min-h-[300px]">
                {assignedTools.map(tool => (
                  <div key={tool.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-wrap items-center gap-5">
                      <div className={`p-4 rounded-2xl shadow-sm ${tool.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Layout size={24} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900 text-lg">{tool.tool_name}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{tool.tool_key}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={() => {
                        axios.put(`/api/vendors/tools/${tool.id}/toggle`).then(() => fetchVendorTools(selectedVendor.user_id));
                      }} className={`p-3 rounded-xl ${tool.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                        {tool.enabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                      </button>
                      <button onClick={() => {
                        if (window.confirm('Remove access?')) {
                          axios.delete(`/api/vendors/tools/${tool.id}`).then(() => { fetchVendorTools(selectedVendor.user_id); fetchVendors(); });
                        }
                      }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showToolModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Assign Tool</h3>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">Target: {selectedVendor.company_name}</p>
              </div>
              <button onClick={() => setShowToolModal(false)} className="p-2 hover:bg-white/10 rounded-xl"><Plus className="rotate-45" size={28} /></button>
            </div>
            <form onSubmit={handleAssignFromRepo} className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select from Repository</label>
                <select
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  value={assignForm.tool_id}
                  onChange={(e) => setAssignForm({ tool_id: e.target.value })}
                >
                  <option value="">-- Select an Available Tool --</option>
                  {availableTools.map(t => (
                    <option key={t.id} value={t.id}>{t.tool_name} ({t.tool_key})</option>
                  ))}
                </select>
                {availableTools.length === 0 && (
                  <p className="text-xs text-amber-600 font-bold ml-1 flex items-center gap-2">
                    <ShieldAlert size={14} /> Repository is empty. Go to "Tool Repository" first.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <button type="button" onClick={() => setShowToolModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" disabled={!assignForm.tool_id} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 disabled:opacity-50">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderAddVendor = () => (
    <div className="max-w-4xl mx-auto py-8 scale-95 origin-top transition-all duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-10 bg-slate-950 text-white relative">
          <div className="relative z-10 flex flex-wrap items-center gap-6">
            <div className="bg-blue-600 p-5 rounded-[1.5rem] shadow-2xl shadow-blue-500/20">
              <Plus size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black">Register New Business Vendor</h3>
              <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">Internal Onboarding System</p>
            </div>
          </div>
          <div className="absolute -right-24 -top-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
        </div>

        <form onSubmit={handleCreateVendor} className="p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={newVendor.company_name} onChange={(e) => setNewVendor({ ...newVendor, company_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
                <input required type="email" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={newVendor.email} onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                <input required type="text" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={newVendor.password} onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })} />
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={newVendor.first_name} onChange={(e) => setNewVendor({ ...newVendor, first_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={newVendor.last_name} onChange={(e) => setNewVendor({ ...newVendor, last_name: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={newVendor.phone} onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })} />
              </div>
              <div className="bg-blue-50 p-6 rounded-[1.5rem] border border-blue-100 mt-8 flex flex-wrap gap-4">
                <ShieldCheck className="text-blue-600 flex-shrink-0" size={24} />
                <p className="text-xs text-blue-900/60 font-bold leading-relaxed">
                  Role ID 6 (Vendor) will be automatically assigned. The vendor can log in immediately after you confirm.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap gap-4">
            <button type="button" onClick={() => setActiveView('directory')} className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest">Cancel Operations</button>
            <button type="submit" className="flex-2 py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-200">Process Registration</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderRepository = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 scale-95 origin-top transition-all duration-300">
      <div className="lg:col-span-4">
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8">
          <div className="p-8 bg-slate-950 text-white">
            <h3 className="text-2xl font-black">Define New Tool</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Repository Configuration</p>
          </div>
          <form onSubmit={handleCreateGlobalTool} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
              <input required placeholder="e.g. CRM Dashboard" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={toolForm.tool_name} onChange={(e) => setToolForm({ ...toolForm, tool_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique System Key</label>
              <input required placeholder="CRM_PANEL_V1" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:border-blue-500 transition-all uppercase" value={toolForm.tool_key} onChange={(e) => setToolForm({ ...toolForm, tool_key: e.target.value.toUpperCase().replace(/\s+/g, '_') })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
              <textarea required className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all h-24 resize-none" value={toolForm.description} onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Launch URL (Target Panel)</label>
              <input required placeholder="https://app.example.com/panel" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" value={toolForm.tool_url} onChange={(e) => setToolForm({ ...toolForm, tool_url: e.target.value })} />
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all mt-4">Save to Repository</button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-wrap items-center gap-4">
            <div className="bg-indigo-50 p-3 text-indigo-600 rounded-2xl">
              <Package size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Available Tool Repository</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Global Definitions for Vendor Assignment</p>
            </div>
          </div>
          <div className="p-8">
            {availableTools.length === 0 ? (
              <div className="p-20 text-center text-slate-300 italic font-bold">Tool repository is currently empty</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableTools.map(tool => (
                  <div key={tool.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1">
                    <div className="absolute top-4 right-4 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setRepoAssignModal({ show: true, tool, target_vendor_user_id: '' })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl" title="Assign to Vendor">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => handleDeleteGlobalTool(tool.id)} className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="bg-white shadow-sm p-3 rounded-2xl text-blue-600">
                        <Package size={24} />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{tool.tool_name}</div>
                        <div className="text-[10px] text-blue-600 font-black tracking-widest">{tool.tool_key}</div>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-4">{tool.description || 'No description provided.'}</p>
                    {tool.tool_url && (
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-400 border-t border-slate-100 pt-4">
                        <ExternalLink size={12} />
                        <span className="truncate">{tool.tool_url}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      {activeView === 'directory' && renderDirectory()}
      {activeView === 'add' && renderAddVendor()}
      {activeView === 'repository' && renderRepository()}

      {repoAssignModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 bg-slate-950 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Assign to Vendor</h3>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">Tool: {repoAssignModal.tool?.tool_name}</p>
              </div>
              <button onClick={() => setRepoAssignModal({ show: false, tool: null, target_vendor_user_id: '' })} className="p-2 hover:bg-white/10 rounded-xl"><Plus className="rotate-45" size={28} /></button>
            </div>
            <form onSubmit={handleRepoAssign} className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Vendor Business</label>
                <select
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  value={repoAssignModal.target_vendor_user_id}
                  onChange={(e) => setRepoAssignModal({ ...repoAssignModal, target_vendor_user_id: e.target.value })}
                >
                  <option value="">-- Select a Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.user_id}>{v.company_name} ({v.vendor_id})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <button type="button" onClick={() => setRepoAssignModal({ show: false, tool: null, target_vendor_user_id: '' })} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" disabled={!repoAssignModal.target_vendor_user_id} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 disabled:opacity-50">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Location Map Modal */}
      {showMapModal && selectedVendor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-950 text-white">
              <div className="flex items-center gap-3">
                <MapPin size={22} className="text-blue-500" />
                <div>
                  <h3 className="text-lg font-bold">Vendor Coordinates Map</h3>
                  <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">{selectedVendor.company_name} Location</p>
                </div>
              </div>
              <button 
                onClick={() => setShowMapModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Map Container */}
            <div className="h-[450px] w-full relative z-0">
              <MapContainer
                center={[parseFloat(selectedVendor.office_latitude) || 28.6273, parseFloat(selectedVendor.office_longitude) || 77.3725]}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker 
                  position={[parseFloat(selectedVendor.office_latitude) || 28.6273, parseFloat(selectedVendor.office_longitude) || 77.3725]}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-gray-900">{selectedVendor.company_name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Vendor Partner ID: {selectedVendor.vendor_id}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-gray-500 font-bold">
                📍 Coordinates: {selectedVendor.office_latitude || '28.6273'}, {selectedVendor.office_longitude || '77.3725'}
              </span>
              <button onClick={() => setShowMapModal(false)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all">
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
